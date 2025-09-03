import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'
import type { Word } from '../../shared/types'

/**
 * SQLite数据库管理器
 * 负责数据库初始化、迁移和基本CRUD操作
 */
export class DatabaseManager {
  private db: Database.Database
  private dbPath: string
  private queryCache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存
  private readonly MAX_CACHE_SIZE = 100

  constructor(dbPath: string) {
    this.dbPath = dbPath
    this.db = this.initializeDatabase()
    
    // 定期清理过期缓存
    setInterval(() => this.cleanExpiredCache(), 60 * 1000) // 每分钟清理一次
  }

  /**
   * 初始化数据库连接和表结构
   */
  private initializeDatabase(): Database.Database {
    // 确保数据库目录存在
    const dbDir = path.dirname(this.dbPath)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    // 创建数据库连接
    const db = new Database(this.dbPath)
    
    // 启用WAL模式以提高并发性能
    db.pragma('journal_mode = WAL')
    db.pragma('synchronous = NORMAL')
    db.pragma('cache_size = 1000')
    db.pragma('temp_store = memory')
    
    // 创建表结构
    this.createTables(db)
    this.createIndexes(db)
    
    return db
  }

  /**
   * 创建数据库表结构
   */
  private createTables(db: Database.Database) {
    const createWordsTable = `
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
    `

    const createSettingsTable = `
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      )
    `

    const createBasketTable = `
      CREATE TABLE IF NOT EXISTS basket (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        term TEXT NOT NULL,
        addedAt INTEGER NOT NULL
      )
    `

    db.exec(createWordsTable)
    db.exec(createSettingsTable)
    db.exec(createBasketTable)
  }

  /**
   * 创建数据库索引以优化查询性能
   * 优化查询性能，支持各种常用查询场景
   */
  private createIndexes(db: Database.Database) {
    const indexes = [
      // 基础索引
      'CREATE INDEX IF NOT EXISTS idx_words_term ON words(term)',
      'CREATE INDEX IF NOT EXISTS idx_words_status ON words(reviewStatus)',
      'CREATE INDEX IF NOT EXISTS idx_words_due_date ON words(reviewDueDate)',
      'CREATE INDEX IF NOT EXISTS idx_words_added_at ON words(addedAt)',
      'CREATE INDEX IF NOT EXISTS idx_words_deleted_at ON words(deletedAt)',
      'CREATE INDEX IF NOT EXISTS idx_words_domain ON words(domain)',
      'CREATE INDEX IF NOT EXISTS idx_words_created_at ON words(createdAt)',
      'CREATE INDEX IF NOT EXISTS idx_words_updated_at ON words(updatedAt)',
      
      // 复合索引（优化常用查询组合）
      'CREATE INDEX IF NOT EXISTS idx_words_active_status ON words(deletedAt, reviewStatus)',
      'CREATE INDEX IF NOT EXISTS idx_words_due_active ON words(reviewDueDate, deletedAt)',
      'CREATE INDEX IF NOT EXISTS idx_words_domain_active ON words(domain, deletedAt)',
      'CREATE INDEX IF NOT EXISTS idx_words_status_due ON words(reviewStatus, reviewDueDate)',
      
      // FSRS相关索引（优化复习算法查询）
      'CREATE INDEX IF NOT EXISTS idx_words_fsrs_last_reviewed ON words(fsrsLastReviewedAt)',
      'CREATE INDEX IF NOT EXISTS idx_words_fsrs_stability ON words(fsrsStability)',
      'CREATE INDEX IF NOT EXISTS idx_words_fsrs_difficulty ON words(fsrsDifficulty)',
      'CREATE INDEX IF NOT EXISTS idx_words_fsrs_composite ON words(fsrsLastReviewedAt, fsrsStability, deletedAt)',
      
      // 全文搜索索引（支持词汇内容搜索）
      'CREATE INDEX IF NOT EXISTS idx_words_term_lower ON words(LOWER(term))',
      'CREATE INDEX IF NOT EXISTS idx_words_definition_lower ON words(LOWER(definition))',
      
      // 篮子表索引
      'CREATE INDEX IF NOT EXISTS idx_basket_added_at ON basket(addedAt)',
      'CREATE INDEX IF NOT EXISTS idx_basket_term ON basket(term)'
    ]

    indexes.forEach(indexSql => {
      try {
        db.exec(indexSql)
      } catch (error) {
        // 索引创建失败，忽略错误
      }
    })
    
    // 创建FTS虚拟表用于全文搜索（如果支持）
    try {
      db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS words_fts USING fts5(
          term, definition, example, domain,
          content='words',
          content_rowid='rowid'
        )
      `)
      
      // 创建触发器保持FTS表同步
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
    } catch (error) {
      // FTS5不可用，回退到LIKE查询
    }
  }

  /**
   * 从JSON文件迁移数据到SQLite
   */
  async migrateFromJSON(jsonFilePath: string): Promise<{ migrated: number; errors: string[] }> {
    const errors: string[] = []
    let migrated = 0

    try {
      if (!fs.existsSync(jsonFilePath)) {
        return { migrated: 0, errors: ['JSON文件不存在'] }
      }

      const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'))
      const words = Array.isArray(jsonData) ? jsonData : []

      // 开始事务
      const transaction = this.db.transaction((wordsToMigrate: Word[]) => {
        const insertStmt = this.db.prepare(`
          INSERT OR REPLACE INTO words (
            id, term, definition, phonetic, example, domain, addedAt,
            reviewStatus, reviewDueDate, analysis, fsrsDifficulty,
            fsrsStability, fsrsLastReviewedAt, fsrsReps, fsrsLapses, deletedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)

        for (const word of wordsToMigrate) {
          try {
            insertStmt.run(
              word.id,
              word.term,
              word.definition,
              word.phonetic,
              word.example,
              word.domain || null,
              word.addedAt,
              word.reviewStatus,
              word.reviewDueDate,
              word.analysis || null,
              word.fsrsDifficulty || 5.0,
              word.fsrsStability || 0.5,
              word.fsrsLastReviewedAt || null,
              word.fsrsReps || 0,
              word.fsrsLapses || 0,
              word.deletedAt || null
            )
            migrated++
          } catch (error) {
            errors.push(`迁移词汇 ${word.term} 失败: ${error}`)
          }
        }
      })

      transaction(words)

      // 备份原JSON文件
      const backupPath = `${jsonFilePath}.backup.${Date.now()}`
      fs.copyFileSync(jsonFilePath, backupPath)

      return { migrated, errors }
    } catch (error) {
      errors.push(`迁移过程出错: ${error}`)
      return { migrated, errors }
    }
  }

  /**
   * 获取所有词汇（不包括已删除的）
   */
  getAllWords(): Word[] {
    const stmt = this.db.prepare(`
      SELECT * FROM words 
      WHERE deletedAt IS NULL 
      ORDER BY addedAt DESC
    `)
    return stmt.all() as Word[]
  }

  /**
   * 获取已删除的词汇
   */
  getDeletedWords(): Word[] {
    const stmt = this.db.prepare(`
      SELECT * FROM words 
      WHERE deletedAt IS NOT NULL 
      ORDER BY deletedAt DESC
    `)
    return stmt.all() as Word[]
  }

  /**
   * 根据ID获取词汇
   */
  getWordById(id: string): Word | null {
    const stmt = this.db.prepare('SELECT * FROM words WHERE id = ?')
    return stmt.get(id) as Word || null
  }

  /**
   * 添加新词汇
   */
  addWord(word: Omit<Word, 'id'>): string {
    const id = `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
      word.domain || null,
      word.addedAt,
      word.reviewStatus,
      word.reviewDueDate,
      word.analysis || null,
      word.fsrsDifficulty || 5.0,
      word.fsrsStability || 0.5,
      word.fsrsLastReviewedAt || null,
      word.fsrsReps || 0,
      word.fsrsLapses || 0
    )

    // 清除相关缓存
    this.invalidateCache()

    return id
  }

  /**
   * 更新词汇
   */
  updateWord(word: Word): boolean {
    const stmt = this.db.prepare(`
      UPDATE words SET
        term = ?, definition = ?, phonetic = ?, example = ?, domain = ?,
        reviewStatus = ?, reviewDueDate = ?, analysis = ?, fsrsDifficulty = ?,
        fsrsStability = ?, fsrsLastReviewedAt = ?, fsrsReps = ?, fsrsLapses = ?,
        updatedAt = strftime('%s', 'now') * 1000
      WHERE id = ?
    `)

    const result = stmt.run(
      word.term,
      word.definition,
      word.phonetic,
      word.example,
      word.domain || null,
      word.reviewStatus,
      word.reviewDueDate,
      word.analysis || null,
      word.fsrsDifficulty || 5.0,
      word.fsrsStability || 0.5,
      word.fsrsLastReviewedAt || null,
      word.fsrsReps || 0,
      word.fsrsLapses || 0,
      word.id
    )

    if (result.changes > 0) {
      // 清除相关缓存
      this.invalidateCache()
    }

    return result.changes > 0
  }

  /**
   * 软删除词汇
   */
  deleteWord(id: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE words SET 
        deletedAt = strftime('%s', 'now') * 1000,
        updatedAt = strftime('%s', 'now') * 1000
      WHERE id = ? AND deletedAt IS NULL
    `)
    const result = stmt.run(id)
    
    if (result.changes > 0) {
      // 清除相关缓存
      this.invalidateCache()
    }
    
    return result.changes > 0
  }

  /**
   * 恢复已删除的词汇
   */
  restoreWord(id: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE words SET 
        deletedAt = NULL,
        updatedAt = strftime('%s', 'now') * 1000
      WHERE id = ? AND deletedAt IS NOT NULL
    `)
    const result = stmt.run(id)
    
    if (result.changes > 0) {
      // 清除相关缓存
      this.invalidateCache()
    }
    
    return result.changes > 0
  }

  /**
   * 批量删除词汇
   * 使用事务处理提高性能
   */
  bulkDeleteWords(ids: string[]): number {
    if (ids.length === 0) return 0

    // 对于大批量操作，使用事务处理
    if (ids.length > 100) {
      return this.bulkDeleteWordsWithTransaction(ids)
    }

    const now = Date.now()
    const placeholders = ids.map(() => '?').join(', ')
    const sql = `
      UPDATE words SET 
        deletedAt = ?,
        updatedAt = strftime('%s', 'now') * 1000
      WHERE id IN (${placeholders}) AND deletedAt IS NULL
    `

    const stmt = this.db.prepare(sql)
    const result = stmt.run(now, ...ids)
    
    if (result.changes > 0) {
      // 清除相关缓存
      this.invalidateCache()
    }
    
    return result.changes
  }

  /**
   * 批量恢复词汇
   * 使用事务处理提高性能
   */
  bulkRestoreWords(ids: string[]): number {
    if (ids.length === 0) return 0

    // 对于大批量操作，使用事务处理
    if (ids.length > 100) {
      return this.bulkRestoreWordsWithTransaction(ids)
    }

    const placeholders = ids.map(() => '?').join(', ')
    const sql = `
      UPDATE words SET 
        deletedAt = NULL,
        updatedAt = strftime('%s', 'now') * 1000
      WHERE id IN (${placeholders}) AND deletedAt IS NOT NULL
    `

    const stmt = this.db.prepare(sql)
    const result = stmt.run(...ids)
    
    if (result.changes > 0) {
      // 清除相关缓存
      this.invalidateCache()
    }
    
    return result.changes
  }

  /**
   * 使用事务处理的批量删除
   */
  private bulkDeleteWordsWithTransaction(ids: string[]): number {
    const batchSize = 500
    let totalChanges = 0
    const now = Date.now()

    const stmt = this.db.prepare(`
      UPDATE words SET 
        deletedAt = ?,
        updatedAt = strftime('%s', 'now') * 1000
      WHERE id = ? AND deletedAt IS NULL
    `)

    const transaction = this.db.transaction((batchIds: string[]) => {
      for (const id of batchIds) {
        const result = stmt.run(now, id)
        totalChanges += result.changes
      }
    })

    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize)
      transaction(batch)
    }

    if (totalChanges > 0) {
      // 清除相关缓存
      this.invalidateCache()
    }

    return totalChanges
  }

  /**
   * 使用事务处理的批量恢复
   */
  private bulkRestoreWordsWithTransaction(ids: string[]): number {
    const batchSize = 500
    let totalChanges = 0

    const stmt = this.db.prepare(`
      UPDATE words SET 
        deletedAt = NULL,
        updatedAt = strftime('%s', 'now') * 1000
      WHERE id = ? AND deletedAt IS NOT NULL
    `)

    const transaction = this.db.transaction((batchIds: string[]) => {
      for (const id of batchIds) {
        const result = stmt.run(id)
        totalChanges += result.changes
      }
    })

    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize)
      transaction(batch)
    }

    if (totalChanges > 0) {
      // 清除相关缓存
      this.invalidateCache()
    }

    return totalChanges
  }

  /**
   * 批量更新词汇
   * 使用事务处理提高性能，支持大批量操作
   */
  bulkUpdateWords(ids: string[], changes: Partial<Word>): number {
    if (ids.length === 0) return 0

    const setClause = Object.keys(changes)
      .filter(key => key !== 'id')
      .map(key => `${key} = ?`)
      .join(', ')

    if (!setClause) return 0

    // 对于大批量操作，使用事务处理
    if (ids.length > 100) {
      return this.bulkUpdateWordsWithTransaction(ids, changes)
    }

    const placeholders = ids.map(() => '?').join(', ')
    const sql = `
      UPDATE words SET 
        ${setClause},
        updatedAt = strftime('%s', 'now') * 1000
      WHERE id IN (${placeholders})
    `

    const values = Object.keys(changes)
      .filter(key => key !== 'id')
      .map(key => changes[key as keyof Word])
      .concat(ids)

    const stmt = this.db.prepare(sql)
    const result = stmt.run(...values)
    
    if (result.changes > 0) {
      // 清除相关缓存
      this.invalidateCache()
    }
    
    return result.changes
  }

  /**
   * 使用事务处理的批量更新
   * 将大批量操作分批处理，提高性能和稳定性
   */
  private bulkUpdateWordsWithTransaction(ids: string[], changes: Partial<Word>): number {
    const batchSize = 500 // 每批处理500条记录
    let totalChanges = 0

    const setClause = Object.keys(changes)
      .filter(key => key !== 'id')
      .map(key => `${key} = ?`)
      .join(', ')

    // 准备单条更新语句
    const sql = `
      UPDATE words SET 
        ${setClause},
        updatedAt = strftime('%s', 'now') * 1000
      WHERE id = ?
    `
    const stmt = this.db.prepare(sql)

    // 创建事务
    const transaction = this.db.transaction((batchIds: string[]) => {
      const values = Object.keys(changes)
        .filter(key => key !== 'id')
        .map(key => changes[key as keyof Word])

      for (const id of batchIds) {
        const result = stmt.run(...values, id)
        totalChanges += result.changes
      }
    })

    // 分批处理
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize)
      transaction(batch)
    }

    if (totalChanges > 0) {
      // 清除相关缓存
      this.invalidateCache()
    }

    return totalChanges
  }

  /**
   * 获取到期复习的词汇
   * 优化查询性能，使用复合索引
   */
  getDueWords(limit?: number): Word[] {
    const now = Date.now()
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
    return stmt.all(now) as Word[]
  }

  /**
   * 按领域获取词汇
   * 利用领域索引提高查询性能
   */
  getWordsByDomain(domain: string, includeDeleted: boolean = false): Word[] {
    let sql = `
      SELECT * FROM words 
      WHERE domain = ?
    `
    
    if (!includeDeleted) {
      sql += ` AND deletedAt IS NULL`
    }
    
    sql += ` ORDER BY createdAt DESC`

    const stmt = this.db.prepare(sql)
    return stmt.all(domain) as Word[]
  }

  /**
   * 按复习状态获取词汇
   * 利用复合索引提高查询性能
   */
  getWordsByStatus(status: string): Word[] {
    const sql = `
      SELECT * FROM words 
      WHERE deletedAt IS NULL 
        AND reviewStatus = ?
      ORDER BY createdAt DESC
    `

    const stmt = this.db.prepare(sql)
    return stmt.all(status) as Word[]
  }

  /**
   * 搜索词汇
   * 支持词汇和定义的模糊搜索
   */
  searchWords(query: string, includeDeleted: boolean = false): Word[] {
    // 首先尝试使用FTS5全文搜索
    try {
      const ftsQuery = query.replace(/["']/g, '').trim()
      if (ftsQuery) {
        let sql = `
          SELECT w.* FROM words w
          JOIN words_fts fts ON w.rowid = fts.rowid
          WHERE words_fts MATCH ?
        `
        
        if (!includeDeleted) {
          sql += ` AND w.deletedAt IS NULL`
        }
        
        sql += ` ORDER BY bm25(words_fts), w.createdAt DESC`
        
        const stmt = this.db.prepare(sql)
        const results = stmt.all(ftsQuery) as Word[]
        
        if (results.length > 0) {
          return results
        }
      }
    } catch (error) {
      // FTS搜索失败，回退到LIKE搜索
    }
    
    // 回退到传统的LIKE搜索
    const searchTerm = `%${query.toLowerCase()}%`
    let sql = `
      SELECT * FROM words 
      WHERE (LOWER(term) LIKE ? OR LOWER(definition) LIKE ? OR LOWER(example) LIKE ?)
    `
    
    if (!includeDeleted) {
      sql += ` AND deletedAt IS NULL`
    }
    
    sql += ` ORDER BY 
      CASE 
        WHEN LOWER(term) = LOWER(?) THEN 1
        WHEN LOWER(term) LIKE ? THEN 2
        WHEN LOWER(definition) LIKE ? THEN 3
        ELSE 4
      END,
      createdAt DESC
    `

    const stmt = this.db.prepare(sql)
    return stmt.all(searchTerm, searchTerm, searchTerm, query.toLowerCase(), `${query.toLowerCase()}%`, `%${query.toLowerCase()}%`) as Word[]
  }

  /**
   * 获取统计信息
   * 优化查询性能，使用单个查询获取所有统计数据，并支持缓存
   */
  getStats(): {
    total: number
    new: number
    learning: number
    mastered: number
    deleted: number
    dueToday: number
  } {
    const today = Date.now()
    const cacheKey = `stats:${Math.floor(today / (60 * 1000))}` // 按分钟缓存
    
    // 尝试从缓存获取
    const cached = this.getCachedResult<any>(cacheKey)
    if (cached) {
      return cached
    }
    
    // 使用单个查询获取所有统计数据，提高性能
    const sql = `
      SELECT 
        COUNT(CASE WHEN deletedAt IS NULL THEN 1 END) as total,
        COUNT(CASE WHEN deletedAt IS NULL AND reviewStatus = 'new' THEN 1 END) as new,
        COUNT(CASE WHEN deletedAt IS NULL AND reviewStatus = 'learning' THEN 1 END) as learning,
        COUNT(CASE WHEN deletedAt IS NULL AND reviewStatus = 'mastered' THEN 1 END) as mastered,
        COUNT(CASE WHEN deletedAt IS NOT NULL THEN 1 END) as deleted,
        COUNT(CASE WHEN deletedAt IS NULL AND reviewDueDate IS NOT NULL AND reviewDueDate <= ? THEN 1 END) as dueToday
      FROM words
    `
    
    const stmt = this.db.prepare(sql)
    const result = stmt.get(today) as any
    
    const stats = {
      total: result.total || 0,
      new: result.new || 0,
      learning: result.learning || 0,
      mastered: result.mastered || 0,
      deleted: result.deleted || 0,
      dueToday: result.dueToday || 0
    }
    
    // 缓存结果
    this.setCachedResult(cacheKey, stats)
    
    return stats
  }

  /**
   * 获取领域统计信息
   * 统计各个领域的词汇数量
   */
  getDomainStats(): Array<{ domain: string; count: number }> {
    const sql = `
      SELECT 
        COALESCE(domain, '未分类') as domain,
        COUNT(*) as count
      FROM words 
      WHERE deletedAt IS NULL
      GROUP BY domain
      ORDER BY count DESC, domain ASC
    `
    
    const stmt = this.db.prepare(sql)
    return stmt.all() as Array<{ domain: string; count: number }>
  }

  /**
   * 获取复习进度统计
   * 统计最近的复习活动
   */
  getReviewStats(days: number = 7): {
    reviewedToday: number
    reviewedThisWeek: number
    averageDaily: number
  } {
    const now = Date.now()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const weekStart = now - (days * 24 * 60 * 60 * 1000)
    
    const sql = `
      SELECT 
        COUNT(CASE WHEN fsrsLastReviewedAt >= ? THEN 1 END) as reviewedToday,
        COUNT(CASE WHEN fsrsLastReviewedAt >= ? THEN 1 END) as reviewedThisWeek
      FROM words 
      WHERE deletedAt IS NULL AND fsrsLastReviewedAt IS NOT NULL
    `
    
    const stmt = this.db.prepare(sql)
    const result = stmt.get(todayStart.getTime(), weekStart) as any
    
    return {
      reviewedToday: result.reviewedToday || 0,
      reviewedThisWeek: result.reviewedThisWeek || 0,
      averageDaily: Math.round((result.reviewedThisWeek || 0) / days)
    }
  }

  /**
   * 缓存管理方法
   */
  private getCachedResult<T>(key: string): T | null {
    const cached = this.queryCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T
    }
    return null
  }

  private setCachedResult(key: string, data: any): void {
    // 如果缓存已满，删除最旧的条目
    if (this.queryCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.queryCache.keys().next().value
      if (oldestKey) {
        this.queryCache.delete(oldestKey)
      }
    }
    
    this.queryCache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  private cleanExpiredCache(): void {
    const now = Date.now()
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp >= this.CACHE_TTL) {
        this.queryCache.delete(key)
      }
    }
  }

  private invalidateCache(): void {
    this.queryCache.clear()
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      try {
        this.queryCache.clear()
        this.db.close()
      } catch (error) {
        // 数据库关闭失败，忽略错误
      }
    }
  }

  /**
   * 获取数据库实例（用于高级操作）
   */
  getDatabase(): Database.Database {
    return this.db
  }
}

// 单例模式的数据库管理器
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