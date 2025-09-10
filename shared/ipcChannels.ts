export const IPC = {
  SettingsGet: 'settings:get',
  SettingsSet: 'settings:set',

  BasketList: 'basket:list',
  BasketTrigger: 'basket:trigger',
  BasketAdd: 'basket:add',

  DbList: 'db:list',
  DbDeletedList: 'db:deleted:list',
  DbDelete: 'db:delete',
  DbUpdate: 'db:update',
  DbRestore: 'db:restore',
  DbBulkUpdate: 'db:bulkUpdate',
  DbBulkDelete: 'db:bulkDelete',
  DbBulkRestore: 'db:bulkRestore',
  DbRebuild: 'db:rebuild',
  DbClearAll: 'db:clearAll',

  ReviewDue: 'review:due',
  ReviewApply: 'review:apply',

  ImportFromClipboard: 'import:fromClipboard',
  ImportFromText: 'import:fromText',

  DbExport: 'db:export',
  DbImport: 'db:import',
  DbBackupNow: 'db:backup:now',
  DbBackupList: 'db:backup:list',
  DbBackupRestore: 'db:backup:restore',
  DbBackupOpenDir: 'db:backup:openDir',
  DbResetAll: 'db:resetAll',

  TtsVolcQuery: 'tts:volc:query',

  TestAIModel: 'test-ai-model',
  ProcessWordsWithAI: 'process-words-with-ai',
  GetAIProcessingStatus: 'get-ai-processing-status',
  CancelAIProcessing: 'cancel-ai-processing',
  CreateAIProcessingWindow: 'create-ai-processing-window',
  ShowWordConfirmation: 'show-word-confirmation',
  StartAIProcessing: 'start-ai-processing',
} as const

export type IpcChannel = typeof IPC[keyof typeof IPC]

