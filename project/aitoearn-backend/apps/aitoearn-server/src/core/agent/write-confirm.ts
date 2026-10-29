import { createHash, randomUUID } from 'node:crypto'
import { AgentError, AgentErrorCode } from '@airongrong/plugin-api'
import { Injectable, Logger } from '@nestjs/common'

/** 确认令牌有效期：10 分钟 */
export const CONFIRM_TOKEN_TTL_MS = 10 * 60_000

/** 默认频率上限：同一主体 60 秒内最多 30 次写操作（AIT-AG-003） */
export const DEFAULT_WRITE_RATE = { windowMs: 60_000, max: 30 }

export interface WritePlan {
  dryRun: true
  action: string
  params: Record<string, unknown>
  confirmToken: string
  expiresAt: string
  willDo: string
  hint: string
}

export interface WriteConfirmParams {
  dryRun?: boolean
  confirmToken?: string
}

interface PendingConfirm {
  action: string
  fingerprint: string
  expiresAt: number
}

function fingerprintOf(action: string, params: Record<string, unknown>): string {
  const { dryRun: _dryRun, confirmToken: _confirmToken, ...rest } = params
  return createHash('sha256').update(`${action}:${JSON.stringify(rest)}`).digest('hex')
}

/**
 * 写操作护栏（方案 §12.2 铁律 3 / §12.4）：
 * - 默认 dryRun：只返回"将要发生什么"与一次性 confirmToken，不产生副作用；
 * - 真正执行必须携带该令牌（与 action + 参数指纹绑定，10 分钟内一次有效）。
 *
 * 令牌默认存放在进程内存；多实例部署需替换为 Redis 实现（保持本类接口不变）。
 */
@Injectable()
export class WriteConfirmService {
  private readonly logger = new Logger(WriteConfirmService.name)
  private readonly pending = new Map<string, PendingConfirm>()
  private readonly rateBuckets = new Map<string, { count: number, resetAt: number }>()

  /**
   * @param action 工具名
   * @param params 原始入参（含 dryRun / confirmToken）
   * @param execute 真正执行的闭包，仅在确认通过后调用
   * @param subject 限流主体（用户/租户 ID），缺省时按 action 维度限流
   */
  async guard<T>(
    action: string,
    params: Record<string, unknown>,
    execute: () => Promise<T>,
    subject?: string,
  ): Promise<T | WritePlan> {
    const { dryRun = true, confirmToken } = params as WriteConfirmParams
    if (dryRun !== false) {
      return this.issuePlan(action, params)
    }
    if (!confirmToken) {
      throw new AgentError(
        AgentErrorCode.WriteNotConfirmed,
        `写操作 ${action} 必须先执行 dryRun 获取 confirmToken`,
        { fix: '先以 dryRun=true 调用同一工具，把返回的 confirmToken 连同 dryRun=false 再次调用' },
      )
    }
    this.consume(action, confirmToken, params)
    this.assertRateLimit(subject ?? '_', action)
    return execute()
  }

  /** 固定窗口限流，超出抛 AIT-AG-003（方案 §12.4 风控） */
  private assertRateLimit(subject: string, action: string): void {
    const key = `${subject}:${action}`
    const now = Date.now()
    const hit = this.rateBuckets.get(key)
    if (!hit || hit.resetAt <= now) {
      this.rateBuckets.set(key, { count: 1, resetAt: now + DEFAULT_WRITE_RATE.windowMs })
      return
    }
    if (hit.count >= DEFAULT_WRITE_RATE.max) {
      throw new AgentError(
        AgentErrorCode.RateLimited,
        `写操作过于频繁: ${action}（${DEFAULT_WRITE_RATE.max} 次 / ${DEFAULT_WRITE_RATE.windowMs / 1000}s）`,
        { retryAt: new Date(hit.resetAt).toISOString() },
      )
    }
    hit.count += 1
  }

  private issuePlan(action: string, params: Record<string, unknown>): WritePlan {
    const token = randomUUID()
    this.pending.set(token, {
      action,
      fingerprint: fingerprintOf(action, params),
      expiresAt: Date.now() + CONFIRM_TOKEN_TTL_MS,
    })
    this.logger.log({ action, dryRun: true }, 'Agent write plan issued')
    return {
      dryRun: true,
      action,
      params,
      confirmToken: token,
      expiresAt: new Date(Date.now() + CONFIRM_TOKEN_TTL_MS).toISOString(),
      willDo: `将执行 ${action}，参数同上`,
      hint: '确认无误后以 dryRun=false + confirmToken 重新调用本工具；令牌 10 分钟内一次性有效',
    }
  }

  private consume(action: string, token: string, params: Record<string, unknown>): void {
    const pending = this.pending.get(token)
    if (!pending) {
      throw new AgentError(
        AgentErrorCode.WriteNotConfirmed,
        `confirmToken 无效或已使用: ${action}`,
        { fix: '重新执行 dryRun 获取新的 confirmToken' },
      )
    }
    this.pending.delete(token)
    if (pending.expiresAt < Date.now()) {
      throw new AgentError(AgentErrorCode.RevokeTimeout, `confirmToken 已过期: ${action}`)
    }
    if (pending.action !== action || pending.fingerprint !== fingerprintOf(action, params)) {
      throw new AgentError(
        AgentErrorCode.WriteNotConfirmed,
        `confirmToken 与当前调用不匹配（action 或参数已变化）: ${action}`,
        { fix: '参数变化后需重新 dryRun' },
      )
    }
  }
}
