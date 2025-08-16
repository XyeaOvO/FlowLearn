import { app, BrowserWindow, Tray, Menu, clipboard, Notification, ipcMain, nativeImage, shell, globalShortcut, screen, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

type CollectedItem = {
  term: string
  addedAt: number
}

type StoredWord = {
  id: string
  term: string
  definition: string
  phonetic: string
  example: string
  domain?: string
  addedAt: number
  reviewStatus: 'new' | 'learning' | 'mastered'
  reviewDueDate: number | null
  analysis?: string
  // FSRS fields (optional)
  fsrsDifficulty?: number // 1 (easy) ~ 10 (hard)
  fsrsStability?: number // in days
  fsrsLastReviewedAt?: number // ts
  fsrsReps?: number
  fsrsLapses?: number
  deletedAt?: number
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let tray: Tray | null = null

// In-memory basket and waiting state
let basket: CollectedItem[] = []
let isWaitingForAIResult = false
let waitingTimeout: NodeJS.Timeout | null = null
let isPaused = false
let reminderInterval: NodeJS.Timeout | null = null
let reminderFiredKeysForToday = new Set<string>()
let isAppQuitting = false // 标记应用是否正在退出

// Settings (simple file storage)
const settingsFile = path.join(app.getPath('userData'), 'settings.json')
const dbFile = path.join(app.getPath('userData'), 'vocab.json')
const backupDir = path.join(app.getPath('userData'), 'backups')

type Settings = {
  triggerThreshold: number
  promptTemplate: string
  minWords: number
  maxWords: number
  ignoreMultiline: boolean
  regexExcludes: string[]
  hotkey: string
  onboarded?: boolean
  responseMode: 'rich-summary' | 'json-only'
  richHeader: string
  // TTS
  ttsEnabled?: boolean
  ttsAutoOnSelect?: boolean
  ttsVoice?: string
  ttsLang?: string
  ttsRate?: number
  ttsPitch?: number
  // Cloud TTS provider (Volcengine OpenSpeech)
  ttsProvider?: 'local' | 'volcengine'
  volcAppid?: string
  volcToken?: string
  volcCluster?: string
  volcVoiceType?: string
  volcEncoding?: 'wav' | 'pcm' | 'ogg_opus' | 'mp3'
  volcSpeedRatio?: number
  volcRate?: number
  // UI
  theme?: 'system' | 'light' | 'dark'
  locale?: 'zh' | 'en'
  // Close behavior
  closeAction?: 'ask' | 'minimize' | 'exit'
  // Daily goal & reminders
  dailyGoal?: number
  reviewReminderTimes?: string[]
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(raw) as T
    }
  } catch {}
  return fallback
}

function writeJsonFile<T>(filePath: string, value: T) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8')
  } catch {}
}

function migrateSettings(input: Settings): Settings {
  let tpl = input.promptTemplate || ''
  let changed = false
  if (/(\{word1\}|\{word2\}|\{wordN\})/.test(tpl)) {
    // Replace the old word placeholders with {terms}
    tpl = tpl.replace(/词汇列表：[\s\S]*?$/m, '词汇列表： {terms}')
    changed = true
  }
  if (/\.\.\./.test(tpl)) {
    tpl = tpl.replace(/词汇列表：[\s\S]*?$/m, '词汇列表： {terms}')
    changed = true
  }
  const { responseMode: inResp, richHeader: inHeader, ...rest } = input as Settings
  const output: Settings = {
    ...rest,
    responseMode: (inResp as any) ?? 'rich-summary',
    richHeader: (inHeader as any) ?? '你现在是我的专属英语语言导师，请用资深编辑的专业水准和清晰的教学逻辑，为我对下列文本进行深入、全面、条理清晰且通俗易懂的中文讲解。根据输入的类型（单词/短语/句子/段落），自动选择以下一个或多个维度进行分析：1) 释义与词性 2) 语体与细微差别 3) 常见搭配与高质量例句 4) 近义词辨析 5) 词源趣闻（若有） 6) 对句子/段落的整体解读与翻译、结构拆解、修辞与文体分析、潜在意图。请保持鼓励语气。最后在输出的最末尾，用 BEGIN_FLOWLEARN_JSON 和 END_FLOWLEARN_JSON 包裹一个严格 JSON，总结每一项的：term, definition, phonetic, example, domain（若未知留空字符串）。不要在该 JSON 外围添加任何文字。',
    promptTemplate: tpl,
    ttsProvider: (input as any).ttsProvider ?? 'local',
    theme: (input as any).theme ?? 'system',
    locale: (input as any).locale ?? 'zh',
    closeAction: (input as any).closeAction ?? 'ask',
    dailyGoal: (input as any).dailyGoal ?? 50,
    reviewReminderTimes: Array.isArray((input as any).reviewReminderTimes) ? (input as any).reviewReminderTimes : ['09:00','21:00'],
  }
  if (changed) writeJsonFile(settingsFile, output)
  return output
}

function getSettings(): Settings {
  const def: Settings = {
    triggerThreshold: 5,
    promptTemplate: `请将以下{count}个词语或表达的解释，以一个JSON数组的格式返回给我。不要在JSON代码块前后添加任何描述性文字或寒暄。
这个数组中的每一个对象都必须包含以下四个键（key）：
- "term": 词语本身 (string)
- "definition": 简洁的中文释义 (string)
- "phonetic": 国际音标 (string)
- "example": 包含中英双语的例句 (string)
// 可选：
- "domain": 该词汇最常出现的领域（如 "科技", "金融", "日常"）(string, optional)

请确保你的回答是一个格式正确的、可以直接被程序解析的JSON。

词汇列表： {terms}`,
    minWords: 1,
    maxWords: 10,
    ignoreMultiline: true,
    regexExcludes: [],
    hotkey: process.platform === 'darwin' ? 'CommandOrControl+Shift+Y' : 'Control+Shift+Y',
    onboarded: false,
    responseMode: 'rich-summary',
    richHeader: '你现在是我的专属英语语言导师，请用资深编辑的专业水准和清晰的教学逻辑，为我对下列文本进行深入、全面、条理清晰且通俗易懂的中文讲解。根据输入的类型（单词/短语/句子/段落），自动选择以下一个或多个维度进行分析：1) 释义与词性 2) 语体与细微差别 3) 常见搭配与高质量例句 4) 近义词辨析 5) 词源趣闻（若有） 6) 对句子/段落的整体解读与翻译、结构拆解、修辞与文体分析、潜在意图。请保持鼓励语气。最后在输出的最末尾，用 BEGIN_FLOWLEARN_JSON 和 END_FLOWLEARN_JSON 包裹一个严格 JSON，总结每一项的：term, definition, phonetic, example, domain（若未知留空字符串）。不要在该 JSON 外围添加任何文字。',
    // TTS defaults
    ttsEnabled: true,
    ttsAutoOnSelect: true,
    ttsVoice: '',
    ttsLang: 'en-US',
    ttsRate: 1,
    ttsPitch: 1,
    ttsProvider: 'local',
    volcAppid: '',
    volcToken: '',
    volcCluster: 'volcano_tts',
    volcVoiceType: '',
    volcEncoding: 'mp3',
    volcSpeedRatio: 1,
    volcRate: 24000,
    // UI defaults
    theme: 'system',
    locale: 'zh',
    // Close behavior defaults
    closeAction: 'ask',
  }
  const raw = readJsonFile(settingsFile, def)
  // Ensure new keys from defaults are present
  return migrateSettings({ ...def, ...raw })
}

function setSettings(newSettings: Partial<Settings>) {
  const current = getSettings()
  const merged = { ...current, ...newSettings }
  writeJsonFile(settingsFile, merged)
  // Re-register hotkey when changed
  registerGlobalHotkey(merged.hotkey)
  try { updateTrayMenu() } catch {}
  try { scheduleReviewReminders() } catch {}
}

function readDB(): StoredWord[] {
  return readJsonFile<StoredWord[]>(dbFile, [])
}

function writeDB(data: StoredWord[]) {
  writeJsonFile(dbFile, data)
}

function getWindowIconImage() {
  const pub = process.env.VITE_PUBLIC
  const tryPaths = process.platform === 'win32'
    ? ['icon.ico', 'icon.png', 'electron-vite.svg']
    : ['icon.png', 'electron-vite.svg']
  for (const p of tryPaths) {
    const full = path.join(pub, p)
    if (fs.existsSync(full)) {
      const img = nativeImage.createFromPath(full)
      if (!img.isEmpty()) return img
    }
  }
  // 16x16 gray dot PNG fallback (data URL)
  const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAAEklEQVQ4T2NkoBAwUqigYQwAAGVdAqg5H3jGAAAAAElFTkSuQmCC'
  return nativeImage.createFromDataURL(dataUrl)
}

function getTrayIconImage() {
  const pub = process.env.VITE_PUBLIC
  const tryPaths = process.platform === 'win32'
    ? [
        // Prefer tray-optimized assets
        'tray.ico', 'icon_tray.ico', 'icon-tray.ico',
        'tray.png', 'icon_tray.png', 'icon-tray.png',
        // Fallbacks
        'icon.ico', 'icon.png', 'electron-vite.svg',
      ]
    : [
        'tray.png', 'icon_tray.png', 'icon-tray.png',
        'icon.png', 'electron-vite.svg',
      ]
  let base: Electron.NativeImage | null = null
  for (const p of tryPaths) {
    const full = path.join(pub, p)
    if (fs.existsSync(full)) {
      const img = nativeImage.createFromPath(full)
      if (!img.isEmpty()) { base = img; break }
    }
  }
  if (!base) base = getWindowIconImage()
  // Scale for Windows DPI so it looks crisp and fills the tray cell
  if (process.platform === 'win32') {
    const sf = Math.max(1, Math.round(screen.getPrimaryDisplay().scaleFactor))
    const size = Math.max(16, Math.min(32, 16 * sf))
    return base.resize({ width: size, height: size, quality: 'best' })
  }
  return base
}

function showCloseConfirmDialog() {
  if (!win) return
  
  dialog.showMessageBox(win, {
    type: 'question',
    buttons: ['最小化到托盘', '退出应用', '取消'],
    defaultId: 0,
    cancelId: 2,
    title: '关闭应用',
    message: '您希望如何处理？',
    detail: '最小化到托盘：应用将继续在后台运行\n退出应用：完全关闭应用程序',
  }).then((result) => {
    if (result.response === 0) {
      // 最小化到托盘
      win?.hide()
    } else if (result.response === 1) {
      // 退出应用
      isAppQuitting = true
      app.quit()
    }
    // response === 2 时是取消，不做任何操作
  })
}

function createWindow() {
  win = new BrowserWindow({
    icon: getWindowIconImage(),
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Handle window close event based on user settings
  win.on('close', (event) => {
    // 如果应用正在退出，直接允许关闭
    if (isAppQuitting) {
      return
    }
    
    const settings = getSettings()
    const closeAction = settings.closeAction || 'ask'
    
    if (closeAction === 'minimize') {
      // Minimize to system tray
      event.preventDefault()
      win?.hide()
    } else if (closeAction === 'ask') {
      // Show confirmation dialog
      event.preventDefault()
      showCloseConfirmDialog()
    } else if (closeAction === 'exit') {
      // Direct exit - let the default behavior proceed
      // Do nothing, the window will close normally
    }
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

function createTray() {
  const image = getTrayIconImage()
  tray = new Tray(image)
  const updateContextMenu = () => {
    const now = Date.now()
    const dueCount = listWords().filter(w => w.reviewDueDate !== null && (w.reviewDueDate as number) <= now).length
    const s = getSettings()
    const todayStart = new Date()
    todayStart.setHours(0,0,0,0)
    const todayReviewed = readDB().filter(w => !w.deletedAt && (w.fsrsLastReviewedAt || 0) >= todayStart.getTime()).length
    const goal = s.dailyGoal || 0
    const contextMenu = Menu.buildFromTemplate([
      {
        label: `待复习：${dueCount}   今日进度：${todayReviewed}${goal ? '/' + goal : ''}`,
        enabled: false,
      },
      { type: 'separator' },
      {
        label: win?.isVisible() ? '隐藏窗口' : '显示窗口',
        click: () => {
          if (!win) return
          if (win.isVisible()) win.hide()
          else win.show()
        },
      },
      { type: 'separator' },
      {
        label: isPaused ? '继续监听' : '暂停监听',
        click: () => {
          isPaused = !isPaused
          updateContextMenu()
        },
      },
      {
        label: '强制加入当前剪贴板（绕过过滤）',
        click: () => forceAddTermFromClipboard(),
      },
      {
        label: '手动导入：解析剪贴板 AI 输出',
        click: () => {
          const txt = clipboard.readText()
          if (!txt) {
            new Notification({ title: '剪贴板为空', body: '请先复制 AI 的完整输出文本' }).show()
            return
          }
          importAIResultFromText(txt)
        },
      },
      {
        label: `立即处理篮中 ${basket.length} 个生词`,
        enabled: basket.length > 0 && !isWaitingForAIResult,
        click: () => triggerPrompt(),
      },
      {
        label: '清空生词篮子',
        enabled: basket.length > 0 && !isWaitingForAIResult,
        click: () => {
          basket = []
          updateContextMenu()
          win?.webContents.send('basket-updated', basket)
        },
      },
      { type: 'separator' },
      {
        label: '设置',
        click: () => {
          win?.show()
          shell.beep()
        },
      },
      {
        label: '退出应用',
        click: () => {
          isAppQuitting = true
          app.quit()
        },
      },
    ])
    tray?.setToolTip('FlowLearn - 自动化生词学习助手')
    tray?.setContextMenu(contextMenu)
  }
  tray.setIgnoreDoubleClickEvents(true)
  tray.on('click', () => {
    if (!win) return
    if (win.isVisible()) win.hide()
    else win.show()
  })
  updateContextMenu()
  return updateContextMenu
}

function normalizeText(text: string): string {
  return text.trim().toLowerCase()
}

function basicFilter(text: string, settings: Settings): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  if (settings.ignoreMultiline && /[\r\n]/.test(trimmed)) return false
  const words = trimmed.split(/\s+/)
  if (words.length < settings.minWords) return false
  if (words.length > settings.maxWords) return false
  if (/^\d+$/.test(trimmed)) return false
  // regex excludes
  if (Array.isArray(settings.regexExcludes) && settings.regexExcludes.length > 0) {
    for (const p of settings.regexExcludes) {
      try {
        const re = new RegExp(p)
        if (re.test(trimmed)) return false
      } catch {}
    }
  }
  return true
}

function triggerPrompt() {
  const s = getSettings()
  const words = basket.map(b => b.term)
  const content = generatePrompt(s.promptTemplate, words)

  clipboard.writeText(content)
  basket = []
  isWaitingForAIResult = true
  win?.webContents.send('basket-updated', basket)
  updateTrayMenu()

  new Notification({
    title: 'Prompt 已复制到剪贴板',
    body: `请将其粘贴到你的 AI 工具中（共 ${words.length} 个词）。`,
  }).show()

  if (waitingTimeout) clearTimeout(waitingTimeout)
  waitingTimeout = setTimeout(() => {
    if (isWaitingForAIResult) {
      new Notification({
        title: '仍在等待 AI 结果',
        body: 'FlowLearn 仍在等待你的学习结果，需要帮助吗？',
      }).show()
      isWaitingForAIResult = false
      updateTrayMenu()
    }
  }, 5 * 60 * 1000)
}

let updateTrayMenu: () => void

function startClipboardWatcher() {
  let last = clipboard.readText()
  setInterval(() => {
    const current = clipboard.readText()
    if (current === last) return
    last = current
    if (!isPaused) handleClipboardText(current)
  }, 900)
}

function scheduleReviewReminders() {
  if (reminderInterval) { clearInterval(reminderInterval); reminderInterval = null }
  reminderFiredKeysForToday.clear()
  // tick every 30s
  reminderInterval = setInterval(() => {
    try {
      const s = getSettings()
      const times = Array.isArray(s.reviewReminderTimes) ? s.reviewReminderTimes : []
      if (times.length === 0) return
      const now = new Date()
      const keyPrefix = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`
      const pad = (n: number) => String(n).padStart(2,'0')
      const nowStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`
      const dueCount = listWords().filter(w => w.reviewDueDate !== null && (w.reviewDueDate as number) <= Date.now()).length
      for (const t of times) {
        if (!/^\d{2}:\d{2}$/.test(t)) continue
        const key = `${keyPrefix} ${t}`
        if (reminderFiredKeysForToday.has(key)) continue
        // fire when equals current minute
        if (t === nowStr) {
          new Notification({
            title: '复习提醒',
            body: dueCount > 0 ? `现在有 ${dueCount} 个待复习词，开始复习吧！` : '当前没有待复习的词，继续保持！'
          }).show()
          reminderFiredKeysForToday.add(key)
          updateTrayMenu()
        }
      }
      // reset daily
      if (now.getHours() === 0 && now.getMinutes() < 2) {
        reminderFiredKeysForToday.clear()
      }
    } catch {}
  }, 30 * 1000)
}

function handleClipboardText(text: string) {
  const s = getSettings()
  if (isWaitingForAIResult) {
    const json = extractFlowLearnJson(text) ?? extractJson(text)
    if (json) {
      try {
        const arr = JSON.parse(json)
        if (Array.isArray(arr) && arr.every(isValidWordObject)) {
          const cleaned = stripFlowLearnJson(text)
          saveWordsWithAnalysis(arr as Omit<StoredWord, 'id' | 'addedAt' | 'reviewStatus' | 'reviewDueDate' | 'analysis'>[], cleaned)
          isWaitingForAIResult = false
          updateTrayMenu()
          new Notification({ title: '保存成功', body: `${arr.length} 个学习结果已成功保存！` }).show()
          win?.webContents.send('db-updated')
          return
        }
      } catch {}
    }
    return
  }
  if (!basicFilter(text, s)) return
  const norm = normalizeText(text)
  if (basket.find(b => normalizeText(b.term) === norm)) return
  basket.push({ term: text.trim(), addedAt: Date.now() })
  win?.webContents.send('basket-updated', basket)
  updateTrayMenu()
  const s2 = getSettings()
  if (basket.length >= s2.triggerThreshold) {
    const n = new Notification({
      title: '已收集生词',
      body: `您已收集 ${basket.length} 个生词，点击通知复制学习 Prompt。`,
    })
    n.on('click', () => triggerPrompt())
    n.show()
  }
}

function isValidWordObject(obj: any): boolean {
  return obj && typeof obj === 'object' &&
    typeof obj.term === 'string' &&
    typeof obj.definition === 'string' &&
    typeof obj.phonetic === 'string' &&
    typeof obj.example === 'string'
}

function extractJson(input: string): string | null {
  // Try to find the first balanced [] or {}
  const startIdx = Math.min(
    ...[...input.matchAll(/[\[\{]/g)].map(m => m.index ?? Infinity)
  )
  if (!isFinite(startIdx)) return null
  const open = input[startIdx]
  const close = open === '[' ? ']' : '}'
  let depth = 0
  for (let i = startIdx; i < input.length; i++) {
    const ch = input[i]
    if (ch === open) depth++
    if (ch === close) depth--
    if (depth === 0) {
      const candidate = input.slice(startIdx, i + 1)
      return candidate
    }
  }
  return null
}

function extractFlowLearnJson(input: string): string | null {
  const startTag = 'BEGIN_FLOWLEARN_JSON'
  const endTag = 'END_FLOWLEARN_JSON'
  const start = input.indexOf(startTag)
  const end = input.lastIndexOf(endTag)
  if (start === -1 || end === -1 || end <= start) return null
  const between = input.slice(start + startTag.length, end)
  // Try to find first balanced JSON in between
  const trimmed = between.trim()
  const candidate = extractJson(trimmed)
  return candidate
}

function stripFlowLearnJson(input: string): string {
  const startTag = 'BEGIN_FLOWLEARN_JSON'
  const endTag = 'END_FLOWLEARN_JSON'
  const start = input.indexOf(startTag)
  const end = input.lastIndexOf(endTag)
  if (start === -1 || end === -1 || end <= start) return input
  const before = input.slice(0, start)
  const after = input.slice(end + endTag.length)
  return (before + after).trim()
}

function importAIResultFromText(text: string): number {
  const json = extractFlowLearnJson(text) ?? extractJson(text)
  if (!json) {
    new Notification({
      title: '无法解析学习结果',
      body: '未找到可解析的 JSON 片段（BEGIN/END 标记或 []/{}）'
    }).show()
    return 0
  }
  try {
    const arr = JSON.parse(json)
    if (Array.isArray(arr) && arr.every(isValidWordObject)) {
      const cleaned = stripFlowLearnJson(text)
      saveWordsWithAnalysis(arr as Omit<StoredWord, 'id' | 'addedAt' | 'reviewStatus' | 'reviewDueDate' | 'analysis'>[], cleaned)
      isWaitingForAIResult = false
      updateTrayMenu()
      new Notification({ title: '保存成功', body: `${arr.length} 个学习结果已成功保存！` }).show()
      win?.webContents.send('db-updated')
      return arr.length
    }
  } catch {}
  return 0
}

function escapeJsonString(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}

function generatePrompt(template: string, terms: string[]) {
  const list = `[${terms.map(t => `"${escapeJsonString(t)}"`).join(', ')}]`
  const s = getSettings()
  if (s.responseMode === 'json-only') {
    return template.replace('{count}', String(terms.length)).replace('{terms}', list)
  }
  // rich-summary: prepend analysis header and explicit instruction to include a trailing strict JSON block
  const guide = `${s.richHeader}\n\n以下是待解析的词汇列表（保持原样，不要改写）：\n${list}\n\n【格式要求，便于我按词保存全文】：为每个词单独分段，段首使用二级写成：\n## TERM: \\"具体词汇\\"\n其后紧接详尽中文讲解与例句。\n\n请在完成详尽的中文解析后，在输出的最末尾，单独追加一段以 BEGIN_FLOWLEARN_JSON 开始、以 END_FLOWLEARN_JSON 结束的严格 JSON，仅包含一个 JSON 数组，数组内每项包含键：term, definition, phonetic, example, domain。`
  return guide
}

function forceAddTermFromClipboard() {
  const text = clipboard.readText()
  if (!text) return
  const norm = normalizeText(text)
  if (basket.find(b => normalizeText(b.term) === norm)) return
  basket.push({ term: text.trim(), addedAt: Date.now() })
  win?.webContents.send('basket-updated', basket)
  updateTrayMenu()
}

let registeredHotkey = ''
function registerGlobalHotkey(hotkey: string) {
  try {
    if (registeredHotkey) {
      globalShortcut.unregister(registeredHotkey)
      registeredHotkey = ''
    }
    if (hotkey && globalShortcut.register(hotkey, () => forceAddTermFromClipboard())) {
      registeredHotkey = hotkey
    }
  } catch {}
}

function saveWordsWithAnalysis(items: Array<{ term: string; definition: string; phonetic: string; example: string; domain?: string }>, fullText?: string) {
  const db = readDB()
  const now = Date.now()
  const analyses = fullText ? parseTermAnalyses(fullText) : {}
  for (const it of items) {
    const id = `${now}-${Math.random().toString(36).slice(2, 8)}`
    db.push({
      id,
      term: it.term,
      definition: it.definition,
      phonetic: it.phonetic,
      example: it.example,
      domain: it.domain,
      addedAt: now,
      reviewStatus: 'new',
      reviewDueDate: now,
      analysis: analyses[normalizeText(it.term)] || fullText || '',
      // Initialize FSRS fields
      fsrsDifficulty: 5,
      fsrsStability: 0.5, // days
      fsrsLastReviewedAt: now,
      fsrsReps: 0,
      fsrsLapses: 0,
    })
  }
  writeDB(db)
}

function listWords() {
  return readDB().filter(w => !w.deletedAt).sort((a, b) => b.addedAt - a.addedAt)
}

function listDeletedWords() {
  return readDB().filter(w => !!w.deletedAt).sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0))
}

function autoScheduleMissingDueDates() {
  const db = readDB()
  let changed = false
  const now = Date.now()
  for (const w of db) {
    if (w.reviewDueDate === null || typeof w.reviewDueDate !== 'number') {
      w.reviewDueDate = now
      changed = true
    }
  }
  if (changed) writeDB(db)
}

function deleteWord(id: string) {
  const db = readDB()
  const idx = db.findIndex(w => w.id === id)
  if (idx >= 0) {
    db[idx].deletedAt = Date.now()
    writeDB(db)
    win?.webContents.send('db-updated')
    try { updateTrayMenu() } catch {}
  }
}

function restoreWord(id: string) {
  const db = readDB()
  const idx = db.findIndex(w => w.id === id)
  if (idx >= 0) {
    delete (db[idx] as any).deletedAt
    writeDB(db)
    win?.webContents.send('db-updated')
    try { updateTrayMenu() } catch {}
  }
}

function bulkUpdate(ids: string[], changes: Partial<StoredWord>) {
  const db = readDB()
  let changed = 0
  for (const id of ids) {
    const idx = db.findIndex(w => w.id === id)
    if (idx >= 0) {
      db[idx] = { ...db[idx], ...changes }
      changed++
    }
  }
  if (changed > 0) writeDB(db)
  if (changed > 0) { win?.webContents.send('db-updated'); try { updateTrayMenu() } catch {} }
  return changed
}

function bulkDelete(ids: string[]) {
  const db = readDB()
  const now = Date.now()
  let changed = 0
  for (const id of ids) {
    const idx = db.findIndex(w => w.id === id)
    if (idx >= 0 && !db[idx].deletedAt) {
      db[idx].deletedAt = now
      changed++
    }
  }
  if (changed > 0) writeDB(db)
  if (changed > 0) { win?.webContents.send('db-updated'); try { updateTrayMenu() } catch {} }
  return changed
}

function bulkRestore(ids: string[]) {
  const db = readDB()
  let changed = 0
  for (const id of ids) {
    const idx = db.findIndex(w => w.id === id)
    if (idx >= 0 && db[idx].deletedAt) {
      delete (db[idx] as any).deletedAt
      changed++
    }
  }
  if (changed > 0) writeDB(db)
  if (changed > 0) { win?.webContents.send('db-updated'); try { updateTrayMenu() } catch {} }
  return changed
}

function parseTermAnalyses(fullText: string): Record<string, string> {
  const text = fullText.replace(/\r\n/g, '\n')
  const norm = (s: string) => s.trim().toLowerCase()
  const result: Record<string, string> = {}
  type Block = { term: string; start: number; end: number }
  const blocks: Block[] = []
  const regex = /(^|\n)\s*#{2,3}\s*TERM\s*:\s*("?)([^\n"]+)\2\s*(\n|$)/gi
  let m: RegExpExecArray | null
  while ((m = regex.exec(text)) !== null) {
    const term = m[3].trim()
    const start = m.index + (m[1] ? m[1].length : 0)
    blocks.push({ term, start, end: -1 })
  }
  // Determine ends
  for (let i = 0; i < blocks.length; i++) {
    blocks[i].end = i + 1 < blocks.length ? blocks[i + 1].start : text.length
  }
  for (const b of blocks) {
    const content = text.slice(b.start, b.end).trim()
    result[norm(b.term)] = content
  }
  // Fallback: if no headings were found, leave map empty
  return result
}

function updateWord(updated: StoredWord) {
  const db = readDB()
  const idx = db.findIndex(w => w.id === updated.id)
  if (idx >= 0) {
    db[idx] = updated
    writeDB(db)
  }
}

type ReviewGrade = 'again' | 'hard' | 'good' | 'easy'

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function ensureFsrsDefaults(w: StoredWord): StoredWord {
  if (w.fsrsDifficulty === undefined) w.fsrsDifficulty = 5
  if (w.fsrsStability === undefined) w.fsrsStability = 0.5
  if (w.fsrsLastReviewedAt === undefined) w.fsrsLastReviewedAt = w.addedAt || Date.now()
  if (w.fsrsReps === undefined) w.fsrsReps = 0
  if (w.fsrsLapses === undefined) w.fsrsLapses = 0
  return w
}

function computeRetrievability(nowMs: number, lastReviewedAt?: number, stabilityDays?: number): number {
  if (!lastReviewedAt || !stabilityDays || stabilityDays <= 0) return 0.5
  const elapsedDays = (nowMs - lastReviewedAt) / (24 * 60 * 60 * 1000)
  // FSRS 近似：R(t) = exp(ln(0.9) * t / stability)
  const r = Math.exp(Math.log(0.9) * (elapsedDays / stabilityDays))
  if (!isFinite(r) || r < 0) return 0
  return Math.max(0, Math.min(1, r))
}

function applyReviewResult(id: string, grade: ReviewGrade) {
  const db = readDB()
  const idx = db.findIndex(w => w.id === id)
  if (idx < 0) return
  const now = Date.now()
  const w = ensureFsrsDefaults(db[idx])
  const d = w.fsrsDifficulty as number
  const s = w.fsrsStability as number
  let newD = d
  let newS = s
  let dueMs = now + 24 * 60 * 60 * 1000
  // Update difficulty & stability based on grade
  switch (grade) {
    case 'again':
      newD = clamp(d + 1.0, 1, 10)
      newS = Math.max(0.3, s * 0.5)
      dueMs = now + 10 * 60 * 1000 // 10 min
      w.fsrsLapses = (w.fsrsLapses || 0) + 1
      w.reviewStatus = 'learning'
      break
    case 'hard':
      newD = clamp(d + 0.5, 1, 10)
      newS = Math.max(0.4, s * 1.2)
      {
        const days = Math.max(0.5, newS)
        dueMs = now + days * 24 * 60 * 60 * 1000
      }
      w.reviewStatus = 'learning'
      break
    case 'good':
      newD = clamp(d - 0.15, 1, 10)
      newS = Math.max(0.5, s * 2.0)
      {
        const days = Math.max(1, newS)
        dueMs = now + days * 24 * 60 * 60 * 1000
      }
      w.reviewStatus = newS >= 7 ? 'mastered' : 'learning'
      break
    case 'easy':
      newD = clamp(d - 0.3, 1, 10)
      newS = Math.max(0.6, s * 2.5)
      {
        const days = Math.max(2, newS * 1.2)
        dueMs = now + days * 24 * 60 * 60 * 1000
      }
      w.reviewStatus = newS >= 7 ? 'mastered' : 'learning'
      break
  }
  w.fsrsDifficulty = newD
  w.fsrsStability = newS
  w.fsrsLastReviewedAt = now
  w.fsrsReps = (w.fsrsReps || 0) + 1
  w.reviewDueDate = dueMs
  db[idx] = w
  writeDB(db)
}

// IPC
ipcMain.handle('settings:get', () => getSettings())
ipcMain.handle('settings:set', (_e, s: Partial<Settings>) => setSettings(s))
ipcMain.handle('basket:list', () => basket)
ipcMain.handle('basket:trigger', () => triggerPrompt())
ipcMain.handle('db:list', () => listWords())
ipcMain.handle('db:deleted:list', () => listDeletedWords())
ipcMain.handle('db:delete', (_e, id: string) => deleteWord(id))
ipcMain.handle('db:update', (_e, w: StoredWord) => updateWord(w))
ipcMain.handle('db:restore', (_e, id: string) => { restoreWord(id); return { ok: true } })
ipcMain.handle('db:bulkUpdate', (_e, ids: string[], changes: Partial<StoredWord>) => ({ ok: true, changed: bulkUpdate(ids, changes) }))
ipcMain.handle('db:bulkDelete', (_e, ids: string[]) => ({ ok: true, changed: bulkDelete(ids) }))
ipcMain.handle('db:bulkRestore', (_e, ids: string[]) => ({ ok: true, changed: bulkRestore(ids) }))
ipcMain.handle('review:due', () => {
  const now = Date.now()
  const due = listWords().filter(w => w.reviewDueDate !== null && (w.reviewDueDate as number) <= now)
  // Sort by estimated retrievability ascending (lower first)
  const withR = due.map(w => {
    const ww = ensureFsrsDefaults(w)
    const r = computeRetrievability(now, ww.fsrsLastReviewedAt, ww.fsrsStability)
    return { w: ww, r }
  })
  withR.sort((a, b) => a.r - b.r)
  return withR.map(x => x.w)
})
ipcMain.handle('review:apply', (_e, id: string, grade: ReviewGrade) => applyReviewResult(id, grade))
ipcMain.handle('import:fromClipboard', () => importAIResultFromText(clipboard.readText()))
ipcMain.handle('import:fromText', (_e, text: string) => importAIResultFromText(text))
ipcMain.handle('basket:add', (_e, term: string) => {
  const trimmed = term.trim()
  if (!trimmed) return { ok: false, error: '词条不能为空' }
  const norm = normalizeText(trimmed)
  if (basket.find(b => normalizeText(b.term) === norm)) {
    return { ok: false, error: '该词条已在篮子中' }
  }
  basket.push({ term: trimmed, addedAt: Date.now() })
  win?.webContents.send('basket-updated', basket)
  updateTrayMenu()
  return { ok: true, count: basket.length }
})
// 导入/导出与备份
ipcMain.handle('db:export', async (_e, format: 'json' | 'csv' = 'json') => {
  try {
    const data = listWords()
    const ts = new Date()
    const y = String(ts.getFullYear())
    const m = String(ts.getMonth() + 1).padStart(2, '0')
    const d = String(ts.getDate()).padStart(2, '0')
    const hh = String(ts.getHours()).padStart(2, '0')
    const mm = String(ts.getMinutes()).padStart(2, '0')
    const ss = String(ts.getSeconds()).padStart(2, '0')
    const defaultName = `flowlearn-vocab-${y}${m}${d}-${hh}${mm}${ss}.${format}`
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: '导出词库',
      defaultPath: defaultName,
      filters: format === 'csv' ? [{ name: 'CSV 文件', extensions: ['csv'] }] : [{ name: 'JSON 文件', extensions: ['json'] }],
    })
    if (canceled || !filePath) return { ok: false, error: '用户取消' }
    if (format === 'json') {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    } else {
      const header = ['term','definition','phonetic','example','domain','addedAt','reviewStatus','reviewDueDate']
      const esc = (s: any) => {
        const v = s === undefined || s === null ? '' : String(s)
        const q = v.replace(/"/g, '""')
        return `"${q.replace(/\r?\n/g, ' ') }"`
      }
      const rows = [header.join(',')].concat(
        data.map(w => header.map(h => esc((w as any)[h])).join(','))
      )
      fs.writeFileSync(filePath, rows.join('\n'), 'utf-8')
    }
    return { ok: true, path: filePath, count: data.length }
  } catch (err: any) {
    return { ok: false, error: String(err?.message || err) }
  }
})

ipcMain.handle('db:import', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: '导入词库（JSON/CSV）',
    filters: [
      { name: '支持的文件', extensions: ['json', 'csv'] },
      { name: 'JSON', extensions: ['json'] },
      { name: 'CSV', extensions: ['csv'] },
    ],
    properties: ['openFile']
  })
  if (canceled || !filePaths?.[0]) return { ok: false, error: '用户取消' }
  try {
    const p = filePaths[0]
    const ext = path.extname(p).toLowerCase().replace('.', '')
    const raw = fs.readFileSync(p, 'utf-8')
    let items: Array<{ term: string; definition: string; phonetic: string; example: string; domain?: string }>
    if (ext === 'json') {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) throw new Error('JSON 不是数组')
      items = parsed
    } else {
      // 简单 CSV 解析（逗号分隔，双引号转义）
      const lines = raw.split(/\r?\n/).filter(Boolean)
      if (lines.length === 0) return { ok: false, error: 'CSV 为空' }
      const header = lines[0].split(',').map(s => s.trim().replace(/^"|"$/g, ''))
      const idx = (k: string) => header.findIndex(h => h.toLowerCase() === k)
      const iTerm = idx('term'), iDef = idx('definition'), iPho = idx('phonetic'), iEx = idx('example'), iDom = idx('domain')
      const parseCsvLine = (line: string): string[] => {
        const out: string[] = []
        let cur = ''
        let inQ = false
        for (let i = 0; i < line.length; i++) {
          const ch = line[i]
          if (inQ) {
            if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
            else if (ch === '"') inQ = false
            else cur += ch
          } else {
            if (ch === ',') { out.push(cur); cur = '' }
            else if (ch === '"') inQ = true
            else cur += ch
          }
        }
        out.push(cur)
        return out
      }
      items = lines.slice(1).map(l => parseCsvLine(l)).map(cols => ({
        term: cols[iTerm] || '',
        definition: cols[iDef] || '',
        phonetic: cols[iPho] || '',
        example: cols[iEx] || '',
        domain: cols[iDom] || ''
      })).filter(x => x.term && x.definition && x.phonetic && x.example)
    }
    // 合并入库（按 term 去重，忽略大小写）
    const db = readDB()
    const exist = new Set(db.map(w => w.term.trim().toLowerCase()))
    const now = Date.now()
    let added = 0
    for (const it of items) {
      const key = (it.term || '').trim().toLowerCase()
      if (!key || exist.has(key)) continue
      db.push({
        id: `${now}-${Math.random().toString(36).slice(2,8)}`,
        term: it.term,
        definition: it.definition,
        phonetic: it.phonetic,
        example: it.example,
        domain: it.domain,
        addedAt: now,
        reviewStatus: 'new',
        reviewDueDate: now,
        analysis: ''
      })
      exist.add(key)
      added++
    }
    writeDB(db)
    win?.webContents.send('db-updated')
    return { ok: true, added, total: items.length }
  } catch (err: any) {
    return { ok: false, error: String(err?.message || err) }
  }
})

function ensureDir(p: string) {
  try { fs.mkdirSync(p, { recursive: true }) } catch {}
}

function formatTs(ts: number) {
  const d = new Date(ts)
  const y = String(d.getFullYear())
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${y}${m}${dd}-${hh}${mm}${ss}`
}

function latestBackupMtime(): number | null {
  try {
    ensureDir(backupDir)
    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'))
    if (files.length === 0) return null
    let latest = 0
    for (const f of files) {
      const st = fs.statSync(path.join(backupDir, f))
      if (st.mtimeMs > latest) latest = st.mtimeMs
    }
    return latest || null
  } catch { return null }
}

function backupNow(): { ok: boolean; path?: string; error?: string } {
  try {
    ensureDir(backupDir)
    const ts = Date.now()
    const name = `flowlearn-vocab-${formatTs(ts)}.json`
    const dest = path.join(backupDir, name)
    const data = readDB()
    fs.writeFileSync(dest, JSON.stringify(data, null, 2), 'utf-8')
    return { ok: true, path: dest }
  } catch (err: any) {
    return { ok: false, error: String(err?.message || err) }
  }
}

function maybeDailyBackup() {
  const last = latestBackupMtime()
  const now = Date.now()
  if (!last || (now - last) > 24 * 60 * 60 * 1000) {
    backupNow()
  }
}

ipcMain.handle('db:backup:now', () => {
  const r = backupNow()
  return r
})

ipcMain.handle('db:backup:list', () => {
  try {
    ensureDir(backupDir)
    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'))
    const list = files.map(f => {
      const full = path.join(backupDir, f)
      const st = fs.statSync(full)
      return { fileName: f, fullPath: full, size: st.size, mtime: st.mtimeMs }
    }).sort((a, b) => b.mtime - a.mtime)
    return { ok: true, list }
  } catch (err: any) {
    return { ok: false, error: String(err?.message || err) }
  }
})

ipcMain.handle('db:backup:restore', async (_e, specifiedPath?: string) => {
  try {
    let chosen = specifiedPath
    if (!chosen) {
      ensureDir(backupDir)
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: '选择备份文件以恢复',
        defaultPath: backupDir,
        filters: [{ name: 'JSON 文件', extensions: ['json'] }],
        properties: ['openFile']
      })
      if (canceled || !filePaths?.[0]) return { ok: false, error: '用户取消' }
      chosen = filePaths[0]
    }
    const raw = fs.readFileSync(chosen!, 'utf-8')
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) throw new Error('备份文件格式不正确')
    writeDB(arr)
    win?.webContents.send('db-updated')
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: String(err?.message || err) }
  }
})

ipcMain.handle('db:backup:openDir', () => {
  try { ensureDir(backupDir); shell.openPath(backupDir); return { ok: true } } catch (err: any) { return { ok: false, error: String(err?.message || err) } }
})
ipcMain.handle('tts:volc:query', async (_e, text: string) => {
  const s = getSettings()
  if (!text || !s.volcAppid || !s.volcToken) {
    return { ok: false, error: '缺少必要参数（文本 / appid / token）' }
  }
  try {
    const reqBody = {
      app: { appid: s.volcAppid, token: s.volcToken, cluster: s.volcCluster || 'volcano_tts' },
      user: { uid: 'flowlearn' },
      audio: {
        voice_type: s.volcVoiceType || 'zh_female_cancan_mars_bigtts',
        encoding: s.volcEncoding || 'mp3',
        speed_ratio: s.volcSpeedRatio ?? 1,
        rate: s.volcRate ?? 24000,
      },
      request: {
        reqid: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        text,
        operation: 'query'
      }
    }
    const r = await fetch('https://openspeech.bytedance.com/api/v1/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer; ${s.volcToken}`,
      },
      body: JSON.stringify(reqBody)
    })
    const data = await r.json()
    if (data && data.code === 3000 && typeof data.data === 'string') {
      return { ok: true, base64: data.data, encoding: reqBody.audio.encoding }
    }
    return { ok: false, error: data?.message || 'TTS 请求失败' }
  } catch (err: any) {
    return { ok: false, error: String(err?.message || err) }
  }
})

// Reset all words to initial learning state
function resetAllWords() {
  try {
    const now = Date.now()
    const db = readDB()
    for (const w of db) {
      w.reviewStatus = 'new'
      w.reviewDueDate = now
      w.fsrsDifficulty = 5
      w.fsrsStability = 0.5
      w.fsrsLastReviewedAt = now
      w.fsrsReps = 0
      w.fsrsLapses = 0
    }
    writeDB(db)
    win?.webContents.send('db-updated')
    return { ok: true, count: db.length }
  } catch (err: any) {
    return { ok: false, error: String(err?.message || err) }
  }
}

ipcMain.handle('db:resetAll', () => resetAllWords())

// Handle before-quit event to set quitting flag
app.on('before-quit', () => {
  isAppQuitting = true
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    isAppQuitting = true
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  // Required for Windows notifications
  if (process.platform === 'win32') {
    app.setAppUserModelId('FlowLearn')
  }
  createWindow()
  updateTrayMenu = createTray()
  startClipboardWatcher()
  // Ensure existing词条具备初始复习时间
  autoScheduleMissingDueDates()
  // 自动备份（每日一次）
  maybeDailyBackup()
  // Review reminders
  scheduleReviewReminders()
})
