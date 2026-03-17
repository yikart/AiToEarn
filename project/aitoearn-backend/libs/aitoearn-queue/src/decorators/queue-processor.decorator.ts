import type { ProcessorOptions } from '@nestjs/bullmq'
import type { NestWorkerOptions } from '@nestjs/bullmq/dist/interfaces/worker-options.interface'
import type { Job } from 'bullmq'

import { Processor } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { storage, Store } from 'nestjs-pino/storage'

const ON_WORKER_EVENT_METADATA = 'bullmq:worker_events_metadata'

type ProcessFn = (job: Job, token?: string) => Promise<unknown>
type EventHandlerFn = (job: Job, ...args: unknown[]) => unknown
interface WorkerEventMetadata { eventName: string }

function ensureStore(bindings: Record<string, unknown>): Store {
  const existing = storage.getStore()
  if (existing) {
    existing.logger = existing.logger.child(bindings)
    return existing
  }
  return new Store(PinoLogger.root.child(bindings))
}

function wrapProcess(proto: Record<string, unknown>, name: string): void {
  const originalProcess = proto['process'] as ProcessFn | undefined
  if (!originalProcess)
    return

  const logger = new Logger(name)

  proto['process'] = function (
    this: unknown,
    job: Job,
    token?: string,
  ): Promise<unknown> {
    const bindings = { jobId: job.id, queue: job.queueName, jobName: job.name }
    const store = ensureStore(bindings)

    const run = (): Promise<unknown> => {
      const attemptsMade = job.attemptsMade
      const maxAttempts = job.opts.attempts ?? 1
      logger.log({ data: job.data, attempt: `${attemptsMade + 1}/${maxAttempts}` }, 'Job started')
      return originalProcess.call(this, job, token)
    }

    if (storage.getStore() === store) {
      return run()
    }
    return storage.run(store, run) as Promise<unknown>
  }
}

function wrapWorkerEvents(proto: Record<string, unknown>): void {
  const methodNames = Object.getOwnPropertyNames(proto)

  for (const methodName of methodNames) {
    if (methodName === 'constructor' || methodName === 'process')
      continue

    const method = proto[methodName]
    if (typeof method !== 'function')
      continue

    const metadata: WorkerEventMetadata | undefined = Reflect.getMetadata(
      ON_WORKER_EVENT_METADATA,
      method,
    )
    if (!metadata)
      continue

    const original = method as EventHandlerFn
    const wrapped = function (this: unknown, job: Job, ...args: unknown[]): unknown {
      const bindings: Record<string, unknown> = {
        event: metadata.eventName,
      }
      if (job?.id) {
        bindings['jobId'] = job.id
      }
      if (job?.queueName) {
        bindings['queue'] = job.queueName
      }

      const logger = PinoLogger.root.child(bindings)
      const store = new Store(logger)
      return storage.run(store, () => original.call(this, job, ...args))
    }

    const keys: string[] = Reflect.getMetadataKeys(method)
    for (const key of keys) {
      Reflect.defineMetadata(key, Reflect.getMetadata(key, method), wrapped)
    }

    proto[methodName] = wrapped
  }
}

export function QueueProcessor(queueName: string): ClassDecorator
export function QueueProcessor(queueName: string, workerOptions: NestWorkerOptions): ClassDecorator
export function QueueProcessor(processorOptions: ProcessorOptions): ClassDecorator
export function QueueProcessor(processorOptions: ProcessorOptions, workerOptions: NestWorkerOptions): ClassDecorator
export function QueueProcessor(queueNameOrOptions: string | ProcessorOptions, workerOptions?: NestWorkerOptions): ClassDecorator {
  return (target) => {
    if (workerOptions) {
      Processor(queueNameOrOptions as string, workerOptions)(target)
    }
    else {
      Processor(queueNameOrOptions as string)(target)
    }

    const proto = target.prototype as Record<string, unknown>
    wrapProcess(proto, target.name)
    wrapWorkerEvents(proto)
  }
}
