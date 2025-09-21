import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import type { Word } from '../../shared/types'

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const CACHE_SWEEP_INTERVAL_MS = 60 * 1000

type CacheEntry<T> = {
  value: T
  expiresAt: number
}

function ensureDirectoryExists(filePath: string) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function normalizeNullable<T>(value: T | null | undefined): T | null {
  return value === undefined ? null : (value as T | null)
}

export class DatabaseManager {
  private readonly db: Database.Database
  private readonly dbPath: string
  private cache = new Map<string, CacheEntry<unknown>>()
  private cacheSweepTimer: NodeJS.Timeout | null = null

  constructor(dbPath: string) {
    this.dbPath = dbPath
    this.db = this.openDatabase()
    this.cacheSweepTimer = setInterval(() => this.pruneExpiredCache(), CACHE_SWEEP_INTERVAL_MS)
    if (typeof this.cacheSweepTimer.unref === 'function') {
      this.cacheSweepTimer.unref()
    }
  }

  private openDatabase(): Database.Database {
    ensureDirectoryExists(this.dbPath)
    const db = new Database(this.dbPath)

    db.pragma('journal_mode = WAL')
    db.pragma('synchronous = NORMAL')
    db.pragma('cache_size = 1000')
    db.pragma('temp_store = memory')

    this.ensureSchema(db)
    return db
  }

  private ensureSchema(db: Database.Database) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS words (
        id TEXT PRIMARY KEY,
        term TEXT NOT NULL,
        definition TEXT NOT NULL,
        phonetic TEXT NOT NULL,
        example TEXT NOT NULL,
        domain TEXT,
        addedAt INTEGER NOT NULL,
        reviewStatus TEXT NOT NULL DEFAULT 'new',
        reviewDueDate INTEGER,
        analysis TEXT,
        fsrsDifficulty REAL DEFAULT 5.0,
        fsrsStability REAL DEFAULT 0.5,
        fsrsLastReviewedAt INTEGER,
        fsrsReps INTEGER DEFAULT 0,
        fsrsLapses INTEGER DEFAULT 0,
        deletedAt INTEGER,
        createdAt INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updatedAt INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      )
    `)

    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      )
    `)

    db.exec(`
      CREATE TABLE IF NOT EXISTS basket (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        term TEXT NOT NULL,
        addedAt INTEGER NOT NULL
      )
    `)

    const indexStatements = [
      'CREATE INDEX IF NOT EXISTS idx_words_term ON words(term)',
      'CREATE INDEX IF NOT EXISTS idx_words_status ON words(reviewStatus)',
      'CREATE INDEX IF NOT EXISTS idx_words_due_date ON words(reviewDueDate)',
      'CREATE INDEX IF NOT EXISTS idx_words_added_at ON words(addedAt)',
      'CREATE INDEX IF NOT EXISTS idx_words_deleted_at ON words(deletedAt)',
      'CREATE INDEX IF NOT EXISTS idx_words_domain ON words(domain)',
      'CREATE INDEX IF NOT EXISTS idx_words_active_status ON words(deletedAt, reviewStatus)',
      'CREATE INDEX IF NOT EXISTS idx_words_due_active ON words(reviewDueDate, deletedAt)',
      'CREATE INDEX IF NOT EXISTS idx_words_status_due ON words(reviewStatus, reviewDueDate)',
      'CREATE INDEX IF NOT EXISTS idx_words_term_lower ON words(LOWER(term))',
      'CREATE INDEX IF NOT EXISTS idx_words_definition_lower ON words(LOWER(definition))',
      'CREATE INDEX IF NOT EXISTS idx_basket_added_at ON basket(addedAt)',
      'CREATE INDEX IF NOT EXISTS idx_basket_term ON basket(term)'
    ]

    for (const statement of indexStatements) {
      try {
        db.exec(statement)
      } catch {
        // ignore index errors
      }
    }

    try {
      db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS words_fts USING fts5(
          term, definition, example, domain,
          content='words',
          content_rowid='rowid'
        )
      `)

      db.exec(`
        CREATE TRIGGER IF NOT EXISTS words_fts_insert AFTER INSERT ON words BEGIN
          INSERT INTO words_fts(rowid, term, definition, example, domain)
          VALUES (new.rowid, new.term, new.definition, new.example, new.domain);
        END
      `)

      db.exec(`
        CREATE TRIGGER IF NOT EXISTS words_fts_delete AFTER DELETE ON words BEGIN
          INSERT INTO words_fts(words_fts, rowid, term, definition, example, domain)
          VALUES('delete', old.rowid, old.term, old.definition, old.example, old.domain);
        END
      `)

      db.exec(`
        CREATE TRIGGER IF NOT EXISTS words_fts_update AFTER UPDATE ON words BEGIN
          INSERT INTO words_fts(words_fts, rowid, term, definition, example, domain)
          VALUES('delete', old.rowid, old.term, old.definition, old.example, old.domain);
          INSERT INTO words_fts(rowid, term, definition, example, domain)
          VALUES (new.rowid, new.term, new.definition, new.example, new.domain);
        END
      `)
    } catch {
      // FTS is optional; ignore if unavailable
    }
  }

  private getCached<T>(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined
    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key)
      return undefined
    }
    return entry.value as T
  }

  private setCached<T>(key: string, value: T) {
    this.cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
  }

  private pruneExpiredCache() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key)
      }
    }
  }

  private invalidateCache(keys?: string[]) {
    if (!keys || keys.length === 0) {
      this.cache.clear()
      return
    }
    for (const key of keys) {
      this.cache.delete(key)
    }
  }

  getAllWords(): Word[] {
    const cacheKey = 'words:all'
    const cached = this.getCached<Word[]>(cacheKey)
    if (cached !== undefined) return cached

    const stmt = this.db.prepare(`
      SELECT * FROM words
      WHERE deletedAt IS NULL
      ORDER BY addedAt DESC
    `)
    const rows = stmt.all() as Word[]
    this.setCached(cacheKey, rows)
    return rows
  }

  getDeletedWords(): Word[] {
    const cacheKey = 'words:deleted'
    const cached = this.getCached<Word[]>(cacheKey)
    if (cached !== undefined) return cached

    const stmt = this.db.prepare(`
      SELECT * FROM words
      WHERE deletedAt IS NOT NULL
      ORDER BY deletedAt DESC
    `)
    const rows = stmt.all() as Word[]
    this.setCached(cacheKey, rows)
    return rows
  }

  getWordById(id: string): Word | null {
    const cacheKey = `words:${id}`
    const cached = this.getCached<Word | null>(cacheKey)
    if (cached !== undefined) return cached

    const stmt = this.db.prepare('SELECT * FROM words WHERE id = ?')
    const row = stmt.get(id) as Word | undefined
    const result = row ?? null
    this.setCached(cacheKey, result)
    return result
  }

  addWord(word: Omit<Word, 'id'>): string {
    const id = `word_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    const stmt = this.db.prepare(`
      INSERT INTO words (
        id, term, definition, phonetic, example, domain, addedAt,
        reviewStatus, reviewDueDate, analysis, fsrsDifficulty,
        fsrsStability, fsrsLastReviewedAt, fsrsReps, fsrsLapses
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      word.term,
      word.definition,
      word.phonetic,
      word.example,
      normalizeNullable(word.domain),
      word.addedAt,
      word.reviewStatus,
      normalizeNullable(word.reviewDueDate),
      normalizeNullable(word.analysis),
      word.fsrsDifficulty ?? 5.0,
      word.fsrsStability ?? 0.5,
      normalizeNullable(word.fsrsLastReviewedAt),
      word.fsrsReps ?? 0,
      word.fsrsLapses ?? 0
    )

    this.invalidateCache()
    return id
  }

  updateWord(word: Word): boolean {
    const stmt = this.db.prepare(`
      UPDATE words SET
        term = ?,
        definition = ?,
        phonetic = ?,
        example = ?,
        domain = ?,
        reviewStatus = ?,
        reviewDueDate = ?,
        analysis = ?,
        fsrsDifficulty = ?,
        fsrsStability = ?,
        fsrsLastReviewedAt = ?,
        fsrsReps = ?,
        fsrsLapses = ?,
        updatedAt = strftime('%s', 'now') * 1000
      WHERE id = ?
    `)

    const result = stmt.run(
      word.term,
      word.definition,
      word.phonetic,
      word.example,
      normalizeNullable(word.domain),
      word.reviewStatus,
      normalizeNullable(word.reviewDueDate),
      normalizeNullable(word.analysis),
      word.fsrsDifficulty ?? 5.0,
      word.fsrsStability ?? 0.5,
      normalizeNullable(word.fsrsLastReviewedAt),
      word.fsrsReps ?? 0,
      word.fsrsLapses ?? 0,
      word.id
    )

    if (result.changes > 0) {
      this.invalidateCache()
      return true
    }

    return false
  }

  deleteWord(id: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE words SET
        deletedAt = strftime('%s', 'now') * 1000,
        updatedAt = strftime('%s', 'now') * 1000
      WHERE id = ? AND deletedAt IS NULL
    `)
    const result = stmt.run(id)
    if (result.changes > 0) {
      this.invalidateCache()
      return true
    }
    return false
  }

  restoreWord(id: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE words SET
        deletedAt = NULL,
        updatedAt = strftime('%s', 'now') * 1000
      WHERE id = ? AND deletedAt IS NOT NULL
    `)
    const result = stmt.run(id)
    if (result.changes > 0) {
      this.invalidateCache()
      return true
    }
    return false
  }

  bulkUpdateWords(ids: string[], changes: Partial<Word>): number {
    if (ids.length === 0) return 0

    const fields = Object.entries(changes).filter(([key]) => key !== 'id')
    if (fields.length === 0) return 0

    const setClause = fields
      .map(([key]) => `${key} = ?`)
      .concat("updatedAt = strftime('%s', 'now') * 1000")
      .join(', ')

    const placeholders = ids.map(() => '?').join(', ')
    const stmt = this.db.prepare(`
      UPDATE words SET ${setClause}
      WHERE id IN (${placeholders})
    `)

    const values = fields.map(([, value]) => (value === undefined ? null : value))
    const result = stmt.run(...values, ...ids)

    if (result.changes > 0) {
      this.invalidateCache()
    }

    return result.changes
  }

  bulkDeleteWords(ids: string[]): number {
    if (ids.length === 0) return 0
    const placeholders = ids.map(() => '?').join(', ')
    const stmt = this.db.prepare(`
      UPDATE words SET
        deletedAt = strftime('%s', 'now') * 1000,
        updatedAt = strftime('%s', 'now') * 1000
      WHERE id IN (${placeholders}) AND deletedAt IS NULL
    `)

    const result = stmt.run(...ids)
    if (result.changes > 0) {
      this.invalidateCache()
    }

    return result.changes
  }

  bulkRestoreWords(ids: string[]): number {
    if (ids.length === 0) return 0
    const placeholders = ids.map(() => '?').join(', ')
    const stmt = this.db.prepare(`
      UPDATE words SET
        deletedAt = NULL,
        updatedAt = strftime('%s', 'now') * 1000
      WHERE id IN (${placeholders}) AND deletedAt IS NOT NULL
    `)

    const result = stmt.run(...ids)
    if (result.changes > 0) {
      this.invalidateCache()
    }

    return result.changes
  }

  getDueWords(limit?: number): Word[] {
    const bucket = Math.floor(Date.now() / (5 * 60 * 1000))
    const cacheKey = `words:due:${limit ?? 'all'}:${bucket}`
    const cached = this.getCached<Word[]>(cacheKey)
    if (cached !== undefined) return cached

    let sql = `
      SELECT * FROM words
      WHERE deletedAt IS NULL
        AND reviewDueDate IS NOT NULL
        AND reviewDueDate <= ?
      ORDER BY reviewDueDate ASC, fsrsStability ASC
    `
    if (limit) {
      sql += ` LIMIT ${limit}`
    }
    const stmt = this.db.prepare(sql)
    const rows = stmt.all(Date.now()) as Word[]
    this.setCached(cacheKey, rows)
    return rows
  }

  countDueWords(referenceTimestamp: number = Date.now()): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM words
      WHERE deletedAt IS NULL
        AND reviewDueDate IS NOT NULL
        AND reviewDueDate <= ?
    `)
    const row = stmt.get(referenceTimestamp) as { count: number } | undefined
    return row?.count ?? 0
  }

  countReviewedSince(sinceTimestamp: number): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM words
      WHERE deletedAt IS NULL
        AND fsrsLastReviewedAt IS NOT NULL
        AND fsrsLastReviewedAt >= ?
    `)
    const row = stmt.get(sinceTimestamp) as { count: number } | undefined
    return row?.count ?? 0
  }

  clearAllWords(): number {
    const stmt = this.db.prepare('DELETE FROM words')
    const result = stmt.run()
    if (result.changes > 0) {
      this.invalidateCache()
    }
    return result.changes
  }

  close(): void {
    if (this.cacheSweepTimer) {
      clearInterval(this.cacheSweepTimer)
      this.cacheSweepTimer = null
    }
    this.cache.clear()
    this.db.close()
  }
}

let dbInstance: DatabaseManager | null = null

export function getDatabaseManager(dbPath?: string): DatabaseManager {
  if (!dbInstance) {
    if (!dbPath) {
      throw new Error('数据库路径未提供')
    }
    dbInstance = new DatabaseManager(dbPath)
  }
  return dbInstance
}

export function closeDatabaseManager(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}
