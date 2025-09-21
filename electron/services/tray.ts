import { Menu, Tray } from 'electron'
import type { MenuItemConstructorOptions, NativeImage } from 'electron'
import type { AIProcessingStatus } from '../../shared/types'

export type TrayState = {
  isWindowVisible: boolean
  isPaused: boolean
  basketCount: number
  isWaitingForAIResult: boolean
  aiProcessingStatus: Pick<AIProcessingStatus, 'isProcessing' | 'currentWords'>
  dueCount: number
  reviewedToday: number
  dailyGoal: number
}

export type TrayActions = {
  toggleWindowVisibility: () => void | Promise<void>
  togglePause: () => void | Promise<void>
  forceAddFromClipboard: () => void | Promise<void>
  importClipboardOutput: () => void | Promise<void>
  processBasket: () => void | Promise<void>
  clearBasket: () => void | Promise<void>
  cancelAIProcessing: () => void | Promise<void>
  openSettings: () => void | Promise<void>
  quit: () => void | Promise<void>
}

type TrayControllerDeps = {
  icon: NativeImage
  getState: () => TrayState
  actions: TrayActions
}

export type TrayController = {
  update: () => void
  tray: Tray
}

export function createTrayController({ icon, getState, actions }: TrayControllerDeps): TrayController {
  const tray = new Tray(icon)

  const runAndRefresh = async (fn: () => void | Promise<void>) => {
    try {
      await fn()
    } finally {
      update()
    }
  }

  const buildMenuTemplate = (state: TrayState): MenuItemConstructorOptions[] => {
    const { isWindowVisible, isPaused, basketCount, isWaitingForAIResult, aiProcessingStatus, dueCount, reviewedToday, dailyGoal } = state

    const busy = isWaitingForAIResult || aiProcessingStatus.isProcessing

    const template: MenuItemConstructorOptions[] = [
      {
        label: `待复习：${dueCount}   今日进度：${reviewedToday}${dailyGoal ? '/' + dailyGoal : ''}`,
        enabled: false,
      },
      { type: 'separator' },
      {
        label: isWindowVisible ? '隐藏窗口' : '显示窗口',
        click: () => runAndRefresh(actions.toggleWindowVisibility),
      },
      { type: 'separator' },
      {
        label: isPaused ? '继续监听' : '暂停监听',
        click: () => runAndRefresh(actions.togglePause),
      },
      {
        label: '强制加入当前剪贴板（绕过过滤）',
        click: () => runAndRefresh(actions.forceAddFromClipboard),
      },
      {
        label: '手动导入：解析剪贴板 AI 输出',
        click: () => runAndRefresh(actions.importClipboardOutput),
      },
      {
        label: `立即处理篮中 ${basketCount} 个生词`,
        enabled: basketCount > 0 && !busy,
        click: () => runAndRefresh(actions.processBasket),
      },
      {
        label: '清空生词篮子',
        enabled: basketCount > 0 && !busy,
        click: () => runAndRefresh(actions.clearBasket),
      },
    ]

    if (aiProcessingStatus.isProcessing) {
      template.push(
        {
          label: `AI处理中... (${aiProcessingStatus.currentWords.length}个词汇)`,
          enabled: false,
        },
        {
          label: '取消AI处理',
          click: () => runAndRefresh(actions.cancelAIProcessing),
        }
      )
    }

    template.push(
      { type: 'separator' },
      {
        label: '设置',
        click: () => runAndRefresh(actions.openSettings),
      },
      {
        label: '退出应用',
        click: () => runAndRefresh(actions.quit),
      }
    )

    return template
  }

  const update = () => {
    const state = getState()
    const template = buildMenuTemplate(state)
    tray.setToolTip('FlowLearn - 自动化生词学习助手')
    tray.setContextMenu(Menu.buildFromTemplate(template))
  }

  tray.setIgnoreDoubleClickEvents(true)
  tray.on('click', () => {
    void runAndRefresh(actions.toggleWindowVisibility)
  })

  update()

  return { tray, update }
}
