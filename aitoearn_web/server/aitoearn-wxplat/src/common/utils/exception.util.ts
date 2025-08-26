import { BadRequestException, HttpException } from '@nestjs/common'
import { AppException } from '../exceptions/app.exception'
import { CommonResponse } from '../interfaces'

const MESSAGES = {
  UNKNOWN_EXCEPTION_MESSAGE: 'Internal server error',
  BAD_REQUEST_MESSAGE: 'Bad request',
}

export function getExceptionPayload(exception: unknown, returnBadRequestDetails = false): Omit<CommonResponse<unknown>, 'url' | 'timestamp'> {
  if (exception instanceof AppException) {
    return getPayloadFromAppException(exception)
  }

  if (exception instanceof BadRequestException) {
    return getPayloadFromBadRequestException(exception, returnBadRequestDetails)
  }

  if (exception instanceof HttpException) {
    return getPayloadFromHttpException(exception)
  }

  return getDefaultPayload()
}

function getPayloadFromAppException(exception: AppException) {
  const response = exception.getResponse() as CommonResponse<unknown>

  return {
    data: response.data || {},
    code: response.code,
    message: response.message,
  }
}

function getPayloadFromHttpException(exception: HttpException) {
  // eslint-disable-next-line ts/no-explicit-any
  const response: any = exception.getResponse()
  const code = exception.getStatus()

  const data = {}

  if (typeof response === 'string') {
    return {
      data,
      code,
      message: response,
    }
  }

  return {
    data: response.data ?? data,
    code: response.code ?? code,
    message: response.message ?? MESSAGES.UNKNOWN_EXCEPTION_MESSAGE,
  }
}

function getPayloadFromBadRequestException(exception: BadRequestException, returnBadRequestDetails: boolean) {
  if (returnBadRequestDetails) {
    return getPayloadFromHttpException(exception)
  }

  return {
    data: {},
    code: 400,
    message: MESSAGES.BAD_REQUEST_MESSAGE,
  }
}

function getDefaultPayload() {
  return {
    data: {},
    code: 500,
    message: MESSAGES.UNKNOWN_EXCEPTION_MESSAGE,
  }
}
