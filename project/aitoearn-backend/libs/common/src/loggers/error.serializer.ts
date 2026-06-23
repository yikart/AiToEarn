import pino from 'pino'

export function serializeError(error: unknown): unknown {
  if (!(error instanceof Error)) {
    return error
  }

  const serialized = pino.stdSerializers.errWithCause(error)
  pruneAxiosSocketData(serialized)
  return serialized
}

function pruneAxiosSocketData(value: unknown): void {
  if (!isRecord(value)) {
    return
  }

  if (isAxiosErrorLike(value)) {
    Object.setPrototypeOf(value, Object.prototype)
    delete value['request']
    delete value['raw']

    const response = value['response']
    if (isRecord(response)) {
      delete response['request']
      delete response['req']
      delete response['socket']
    }
  }

  pruneAxiosSocketData(value['cause'])

  const aggregateErrors = value['aggregateErrors']
  if (Array.isArray(aggregateErrors)) {
    for (const error of aggregateErrors) {
      pruneAxiosSocketData(error)
    }
  }
}

function isAxiosErrorLike(value: Record<string, unknown>): boolean {
  return value['isAxiosError'] === true
    || value['type'] === 'AxiosError'
    || value['name'] === 'AxiosError'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
