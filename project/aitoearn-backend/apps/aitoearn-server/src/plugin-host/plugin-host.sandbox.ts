import type { CapabilityMessage, PluginHostBroker } from './plugin-host.broker'
import { realpathSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Worker } from 'node:worker_threads'
import { PluginError, PluginErrorCode } from '@airongrong/plugin-api'
import { Logger } from '@nestjs/common'
import { WORKER_BOOTSTRAP_SOURCE } from './plugin-host.worker-bootstrap'

const WORKER_MEMORY_LIMIT_MB = 128

/** 文件系统隔离策略：auto 按 Node 能力自动决定，on 强制，off 关闭 */
export type FsIsolationMode = 'auto' | 'on' | 'off'

export function supportsPermissionModel(): boolean {
  return process.allowedNodeEnvironmentFlags?.has('--permission') === true
}

/**
 * 插件 worker 的 execArgv：开启 Node permission model 后，
 * 插件进程无法读取插件目录之外的任何文件，也无法 fork 子进程（P0-1）。
 */
export function buildWorkerExecArgv(packageDir: string, mode: FsIsolationMode = 'auto'): string[] {
  if (mode === 'off') {
    return []
  }
  if (!supportsPermissionModel()) {
    if (mode === 'on') {
      throw new PluginError(
        PluginErrorCode.PermissionViolation,
        '当前 Node 版本不支持 --permission，无法强制启用文件系统隔离',
      )
    }
    return []
  }
  return ['--permission', `--allow-fs-read=${resolve(packageDir)}`]
}

export interface SandboxInvokeOptions {
  timeoutMs?: number
  accountId?: string
}

interface PendingInvoke {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}

/**
 * 插件沙箱：每个插件一个 worker_threads 实例，128MB 内存上限，
 * 无 fs 访问、无宿主环境变量（仅注入 AIT_PLUGIN_ID）。
 */
export class PluginSandbox {
  private readonly logger = new Logger(PluginSandbox.name)
  private worker?: Worker
  private nextId = 0
  private methods: string[] = []
  private readonly pendingInvokes = new Map<number, PendingInvoke>()
  private readonly pendingCapabilities = new Map<number, PendingInvoke>()

  constructor(
    readonly pluginId: string,
    private readonly packageDir: string,
    private readonly entryModule: string,
    private readonly broker: PluginHostBroker,
    private readonly fsIsolation: FsIsolationMode = 'auto',
  ) {}

  /** 插件实际导出的方法名，用于跳过未实现的 deactivate（P0-2） */
  hasMethod(name: string): boolean {
    return this.methods.includes(name)
  }

  private resolveRealDir(): string {
    try {
      return realpathSync(this.packageDir)
    }
    catch {
      return resolve(this.packageDir)
    }
  }

  async start(activateTimeoutMs = 5_000): Promise<void> {
    // 必须用 realpath：macOS 的 /var → /private/var 等符号链接会让 Node 权限校验命中错误的路径前缀
    const dir = this.resolveRealDir()
    const loaderPath = join(dir, '.aitoearn-loader.mjs')
    const entryPath = join(dir, this.entryModule.replace(/^\.\//, ''))
    await writeFile(loaderPath, WORKER_BOOTSTRAP_SOURCE)

    const execArgv = buildWorkerExecArgv(dir, this.fsIsolation)
    if (execArgv.length === 0 && this.fsIsolation !== 'off') {
      this.logger.warn(`插件文件系统隔离未启用（Node 不支持 --permission）: ${this.pluginId}`)
    }

    this.worker = new Worker(pathToFileURL(loaderPath), {
      resourceLimits: { maxOldGenerationSizeMb: WORKER_MEMORY_LIMIT_MB },
      env: { AIT_PLUGIN_ID: this.pluginId },
      workerData: { entryUrl: pathToFileURL(entryPath).href },
      execArgv,
    })
    this.worker.on('message', (message: Record<string, unknown>) => {
      this.handleMessage(message).catch((error: Error) => {
        this.logger.error(error.message, { pluginId: this.pluginId })
      })
    })
    this.worker.on('error', (error: Error) => {
      this.logger.error(`插件 worker 崩溃: ${error.message}`, { pluginId: this.pluginId })
      this.rejectAllPending(new Error(`插件 worker 崩溃: ${error.message}`))
    })

    await this.waitForReady(this.worker, activateTimeoutMs)
  }

  private waitForReady(worker: Worker, timeoutMs: number): Promise<void> {
    const captureMethods = (message: Record<string, unknown>) => {
      this.methods = Array.isArray(message['methods']) ? message['methods'] as string[] : []
    }
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(onTimeout, timeoutMs)
      function teardown() {
        clearTimeout(timer)
        worker.off('message', onMessage)
        worker.off('error', onError)
      }
      function onTimeout() {
        teardown()
        reject(new PluginError(PluginErrorCode.ActivateTimeout, `插件激活超时（>${timeoutMs}ms）`))
      }
      function onMessage(message: Record<string, unknown>) {
        if (message['kind'] === 'ready') {
          captureMethods(message)
          teardown()
          resolve()
        }

        else if (message['kind'] === 'bootstrap-error') {
          teardown()
          const error = message['error'] as { message?: string } | undefined
          reject(new Error(error?.message ?? '插件引导失败'))
        }
      }
      function onError(error: Error) {
        teardown()
        reject(error)
      }
      worker.on('message', onMessage)
      worker.on('error', onError)
    })
  }

  async invoke<T>(method: string, params: unknown[] = [], options: SandboxInvokeOptions = {}): Promise<T> {
    const worker = this.worker
    if (!worker) {
      throw new Error('插件未启动')
    }
    this.broker.activeAccountId = options.accountId
    const timeoutMs = options.timeoutMs ?? 30_000
    const id = ++this.nextId
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingInvokes.delete(id)
        reject(new PluginError(PluginErrorCode.ActivateTimeout, `插件调用超时: ${method}`))
      }, timeoutMs)
      this.pendingInvokes.set(id, {
        resolve: (value) => {
          clearTimeout(timer)
          resolve(value as T)
        },
        reject: (error) => {
          clearTimeout(timer)
          reject(error)
        },
      })
      worker.postMessage({ kind: 'invoke', id, method, params })
    })
  }

  /**
   * 卸载插件。terminate() 是同步语义的强制终止，正常耗时 <100ms；
   * 是否需要先执行 deactivate 由 loader 根据 hasMethod 决定（P0-2）。
   */
  async stop(): Promise<void> {
    const worker = this.worker
    if (!worker) {
      return
    }
    try {
      await worker.terminate()
    }
    catch (error) {
      this.logger.warn(`插件 worker 终止异常: ${(error as Error).message}`)
    }
    finally {
      this.worker = undefined
      this.methods = []
      this.rejectAllPending(new Error('插件已卸载'))
    }
  }

  private async handleMessage(message: Record<string, unknown>): Promise<void> {
    if (message['kind'] === 'invoke-result') {
      const pending = this.pendingInvokes.get(message['id'] as number)
      if (!pending) {
        return
      }
      this.pendingInvokes.delete(message['id'] as number)
      if (message['error']) {
        const error = message['error'] as { name?: string, message: string, stack?: string }
        pending.reject(Object.assign(new Error(error.message), { name: error.name, stack: error.stack }))
      }
      else {
        pending.resolve(message['result'])
      }
      return
    }
    if (message['kind'] === 'cap') {
      const id = message['id'] as number
      try {
        const result = await this.broker.handle({ method: message['method'] as string, params: message['params'] as Record<string, unknown> } as CapabilityMessage)
        this.worker?.postMessage({ kind: 'cap-result', id, result })
      }
      catch (error) {
        this.worker?.postMessage({
          kind: 'cap-result',
          id,
          error: { name: (error as Error).name, message: (error as Error).message },
        })
      }
    }
  }

  private rejectAllPending(error: Error): void {
    for (const pending of this.pendingInvokes.values()) {
      pending.reject(error)
    }
    this.pendingInvokes.clear()
    for (const pending of this.pendingCapabilities.values()) {
      pending.reject(error)
    }
    this.pendingCapabilities.clear()
  }
}
