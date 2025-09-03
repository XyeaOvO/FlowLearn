/**
 * 通用错误处理工具函数
 */

/**
 * 处理未知类型的错误，返回错误消息
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return '未知错误'
}

/**
 * 安全地执行异步操作，并处理错误
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await operation()
  } catch (error) {
    // 异步操作失败，返回fallback值
    return fallback
  }
}

/**
 * 创建一个带有错误处理的异步函数包装器
 */
export function withErrorHandling<T extends unknown[], R>(
  asyncFunction: (...parameters: T) => Promise<R>
) {
  return async (...parameters: T): Promise<R | undefined> => {
    try {
      return await asyncFunction(...parameters)
    } catch (error) {
      // 操作失败，返回undefined
      return undefined
    }
  }
}