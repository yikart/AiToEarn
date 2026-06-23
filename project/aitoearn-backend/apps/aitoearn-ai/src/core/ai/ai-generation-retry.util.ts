import { HttpException } from '@nestjs/common'
import { AppException, getErrorMessage, ResponseCode } from '@yikart/common'
import { AxiosError } from 'axios'

export function isNonRetryableAiRequestError(error: unknown): boolean {
  const message = getErrorMessage(error)
  if (isContentSafetyMessage(message)) {
    return false
  }

  if (error instanceof AppException) {
    return [
      ResponseCode.InvalidModel,
      ResponseCode.InvalidAiTaskId,
      ResponseCode.VideoUploadInvalidInput,
      ResponseCode.AiLogNotFound,
    ].includes(error.code)
  }

  const status = getHttpStatus(error)
  if (status != null && [400, 401, 403, 404, 422].includes(status)) {
    return true
  }

  const lowerMessage = message.toLowerCase()
  return [
    'invalid parameter',
    'missing required',
    'bad request',
    'unauthorized',
    'forbidden',
    'not found',
    'insufficient balance',
    'unsupported',
    'model not found',
    'image size is not supported',
    'invalid image',
    'invalid input',
  ].some(pattern => lowerMessage.includes(pattern))
}

export async function runWithAiGenerationRetry<T>(
  run: () => Promise<T>,
  retry: number | undefined,
  onRetry?: (error: unknown, attempt: number, maxAttempts: number) => void,
): Promise<T> {
  const maxAttempts = 1 + Math.max(0, retry ?? 0)
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await run()
    }
    catch (error) {
      lastError = error
      if (attempt >= maxAttempts || isNonRetryableAiRequestError(error)) {
        throw error
      }
      onRetry?.(error, attempt, maxAttempts)
    }
  }

  throw lastError
}

function getHttpStatus(error: unknown): number | undefined {
  if (error instanceof HttpException) {
    return error.getStatus()
  }
  if (error instanceof AxiosError || looksLikeAxiosError(error)) {
    return (error as AxiosError).response?.status
  }
  return undefined
}

function looksLikeAxiosError(error: unknown): boolean {
  return typeof error === 'object' && error != null && 'isAxiosError' in error
}

function isContentSafetyMessage(message: string): boolean {
  const lowerMessage = message.toLowerCase()
  return [
    'safety',
    'policy',
    'content filter',
    'risk',
    'violation',
    'sensitive',
  ].some(pattern => lowerMessage.includes(pattern))
  || ['违规', '风控', '内容安全'].some(pattern => message.includes(pattern))
}
