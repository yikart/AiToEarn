import type { FSWatcher } from 'node:fs'
import { ChildProcess, spawn } from 'node:child_process'
import { existsSync, mkdirSync, unlinkSync, watch, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { config } from '../../../config'

interface TransformerConfig {
  use: Array<string | [string, Record<string, unknown>] | Record<string, TransformerConfig>>
}

interface ProviderConfig {
  name: string
  api_base_url: string
  api_key: string
  models: string[]
  transformer?: TransformerConfig
}

interface RouterConfig {
  default: string
  background?: string
  think?: string
  longContext?: string
  longContextThreshold?: number
  webSearch?: string
  image?: string
}

interface ClaudeCodeRouterConfig {
  PORT?: number
  APIKEY?: string
  PROXY_URL?: string
  LOG?: boolean
  LOG_LEVEL?: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'
  HOST?: string
  NON_INTERACTIVE_MODE?: boolean
  Providers?: ProviderConfig[]
  Router?: RouterConfig
  API_TIMEOUT_MS?: number
}

@Injectable()
export class ClaudeCodeRouterService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ClaudeCodeRouterService.name)
  private childProcess: ChildProcess | null = null
  private fileWatcher: FSWatcher | null = null
  private shouldRestart = true
  private readonly sessionDir = join(process.cwd(), '.claude-session')
  private readonly configDir = join(this.sessionDir, '.claude-code-router')
  private readonly configPath = join(this.configDir, 'config.json')
  private readonly pidFilePath = join(this.sessionDir, '.claude-code-router.pid')

  async onModuleInit() {
    const routerConfig = config.agent

    const cliPath = require.resolve('@musistudio/claude-code-router/dist/cli.js')
    this.logger.debug(`找到 Claude Code Router CLI: ${cliPath}`)

    this.startFileWatcher()
    this.generateConfigFile(routerConfig)
    this.startChildProcess(cliPath)
  }

  async onModuleDestroy() {
    this.shouldRestart = false

    if (this.fileWatcher) {
      this.fileWatcher.close()
      this.fileWatcher = null
      this.logger.debug('文件监听器已停止')
    }

    if (this.childProcess) {
      this.logger.debug('正在停止 Claude Code Router...')
      this.childProcess.kill('SIGTERM')
      this.childProcess = null
    }
  }

  private generateConfigFile(routerConfig: { baseUrl: string, apiKey: string }) {
    if (!existsSync(this.configDir)) {
      mkdirSync(this.configDir, { recursive: true })
      this.logger.debug(`创建配置目录: ${this.configDir}`)
    }

    const routerConfigFile: ClaudeCodeRouterConfig = {
      PORT: 3456,
      APIKEY: 'ccr',
      NON_INTERACTIVE_MODE: true,
      Providers: [
        {
          name: 'new',
          api_base_url: routerConfig.baseUrl,
          api_key: routerConfig.apiKey,
          models: [
            'claude-opus-4-6',
            'claude-haiku-4-5-20251001-thinking',
            'claude-opus-4-5-20251101-thinking',
            'claude-opus-4-5-20251101',
            'claude-sonnet-4-5-20250929-thinking',
            'claude-haiku-4-5-20251001',
            'claude-opus-4-1-20250805',
            'claude-opus-4-1-20250805-thinking',
            'claude-sonnet-4-5-20250929',
            'claude-opus-4-6',
            'claude-opus-4-6-thinking',
          ],
          transformer: {
            use: [
              'Anthropic',
            ],
          },
        },
      ],
      Router: {
        default: 'new,claude-opus-4-6',
        background: 'new,claude-haiku-4-5-20251001',
        think: 'new,claude-opus-4-6',
      },
    }

    writeFileSync(this.configPath, JSON.stringify(routerConfigFile, null, 2), 'utf-8')
    this.logger.debug(`配置文件已生成: ${this.configPath}`)
  }

  private startChildProcess(cliPath: string) {
    this.logger.debug('正在启动 Claude Code Router 子进程...')

    this.childProcess = spawn('node', [cliPath, 'start'], {
      cwd: this.sessionDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        HOME: this.sessionDir,
      },
    })

    this.childProcess.stdout?.on('data', (data) => {
      this.logger.debug(`Claude Code Router stdout: ${data.toString().trim()}`)
    })

    this.childProcess.stderr?.on('data', (data) => {
      this.logger.warn(`Claude Code Router stderr: ${data.toString().trim()}`)
    })

    this.childProcess.on('exit', (code, signal) => {
      if (code !== null) {
        this.logger.debug(`Claude Code Router 进程退出，退出码: ${code}`)
      }
      else if (signal) {
        this.logger.debug(`Claude Code Router 进程被信号终止: ${signal}`)
      }
      this.childProcess = null

      if (this.shouldRestart) {
        this.logger.debug('正在重启 Claude Code Router...')
        this.startChildProcess(cliPath)
      }
    })

    this.childProcess.on('error', (error) => {
      this.logger.error({ error }, 'Claude Code Router 进程错误')
      this.childProcess = null
    })

    this.logger.debug('Claude Code Router 子进程已启动')
  }

  private removePidFile() {
    if (existsSync(this.pidFilePath)) {
      try {
        unlinkSync(this.pidFilePath)
        this.logger.debug(`已删除 pid 文件: ${this.pidFilePath}`)
      }
      catch (error) {
        this.logger.warn({ error }, '删除 pid 文件失败')
      }
    }
  }

  private startFileWatcher() {
    if (!existsSync(this.configDir)) {
      mkdirSync(this.configDir, { recursive: true })
      this.logger.debug(`创建配置目录: ${this.configDir}`)
    }

    if (this.fileWatcher) {
      this.fileWatcher.close()
    }

    this.removePidFile()

    this.logger.debug(`开始监听目录: ${this.sessionDir}`)

    this.fileWatcher = watch(this.sessionDir, (eventType, filename) => {
      if (filename === '.claude-code-router.pid') {
        this.logger.debug(`检测到 pid 文件事件: ${eventType}`)
        this.removePidFile()
      }
    })

    this.fileWatcher.on('error', (error) => {
      this.logger.error({ error }, '文件监听器错误')
    })
  }
}
