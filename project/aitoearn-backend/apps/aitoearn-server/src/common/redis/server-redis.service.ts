import { Injectable } from '@nestjs/common'
import { RedisService } from '@yikart/redis'
import { ServerRedisKeys } from './server-redis-keys'

@Injectable()
export class ServerRedisService {
  constructor(private readonly redis: RedisService) {}

  async incrementRateLimit(key: string, windowSeconds: number): Promise<number> {
    const luaScript = `
      local count = redis.call("INCR", KEYS[1])
      if tonumber(count) == 1 then
        redis.call("EXPIRE", KEYS[1], ARGV[1])
      end
      return count
    `

    return Number(await this.redis.eval(luaScript, 1, ServerRedisKeys.rateLimit(key), windowSeconds.toString()))
  }

  async saveShortLink(code: string, originalUrl: string): Promise<boolean> {
    return this.redis.set(ServerRedisKeys.shortLink(code), originalUrl, 60 * 60 * 24)
  }

  async getShortLink(code: string): Promise<string | null> {
    return this.redis.get(ServerRedisKeys.shortLink(code))
  }

  async saveChannelAuthSession<T>(sessionId: string, session: T, ttlSeconds = 60 * 5): Promise<boolean> {
    return this.redis.setJson(ServerRedisKeys.channelAuthSession(sessionId), session, ttlSeconds)
  }

  async getChannelAuthSession<T>(sessionId: string): Promise<T | null> {
    return this.redis.getJson(ServerRedisKeys.channelAuthSession(sessionId))
  }

  async getChannelCredentialCache<T>(accountId: string): Promise<T | null> {
    return this.redis.getJson(ServerRedisKeys.channelCredential(accountId))
  }

  async saveChannelCredentialCache<T>(accountId: string, credential: T): Promise<boolean> {
    return this.redis.setJson(ServerRedisKeys.channelCredential(accountId), credential, 60 * 5)
  }

  async deleteChannelCredentialCache(accountId: string): Promise<boolean> {
    return this.redis.del(ServerRedisKeys.channelCredential(accountId))
  }

  async acquireChannelCredentialRefreshLock(accountId: string, token: string): Promise<boolean> {
    return this.redis.setNx(ServerRedisKeys.channelCredentialLock(accountId), token, 30)
  }

  async releaseChannelCredentialRefreshLock(accountId: string, token: string): Promise<boolean> {
    const luaScript = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      end
      return 0
    `

    return Number(await this.redis.eval(luaScript, 1, ServerRedisKeys.channelCredentialLock(accountId), token)) > 0
  }

  async saveLegacyChannelAuthTask<T>(platform: string, id: string, value: T): Promise<boolean> {
    return this.redis.setJson(ServerRedisKeys.legacyChannelAuthTask(platform, id), value, 60 * 5)
  }

  async saveLegacyGoogleBusinessAuthTask<T>(id: string, value: T): Promise<boolean> {
    return this.redis.setJson(ServerRedisKeys.legacyChannelAuthTask('google_business', id), value, 60 * 10)
  }

  async saveLegacyRelayAuthTask<T>(platform: string, id: string, value: T): Promise<boolean> {
    return this.redis.setJson(ServerRedisKeys.legacyChannelAuthTask(platform, id), value, 60 * 10)
  }

  async getLegacyChannelAuthTask<T>(platform: string, id: string): Promise<T | null> {
    return this.redis.getJson(ServerRedisKeys.legacyChannelAuthTask(platform, id))
  }

  async deleteLegacyChannelAuthTask(platform: string, id: string): Promise<boolean> {
    return this.redis.del(ServerRedisKeys.legacyChannelAuthTask(platform, id))
  }

  async extendLegacyChannelAuthTask(platform: string, id: string): Promise<boolean> {
    return this.redis.expire(ServerRedisKeys.legacyChannelAuthTask(platform, id), 60 * 3)
  }

  async saveLegacyChannelAccessToken<T extends { expires_in?: number, expiresAt?: number }>(platform: string, accountId: string, value: T): Promise<boolean> {
    return this.redis.setJson(
      ServerRedisKeys.legacyChannelAccessToken(platform, accountId),
      value,
      value.expires_in ?? (value.expiresAt ? Math.max(value.expiresAt - Math.floor(Date.now() / 1000), 1) : undefined),
    )
  }

  async getLegacyChannelAccessToken<T>(platform: string, accountId: string): Promise<T | null> {
    return this.redis.getJson(ServerRedisKeys.legacyChannelAccessToken(platform, accountId))
  }

  async deleteLegacyChannelAccessToken(platform: string, accountId: string): Promise<boolean> {
    return this.redis.del(ServerRedisKeys.legacyChannelAccessToken(platform, accountId))
  }

  async deleteLegacyChannelCamelAccessToken(platform: string, accountId: string): Promise<boolean> {
    return this.redis.del(ServerRedisKeys.legacyChannelCamelAccessToken(platform, accountId))
  }

  async saveLegacyChannelPageAccessToken<T>(platform: string, pageId: string, value: T): Promise<boolean> {
    return this.redis.setJson(ServerRedisKeys.legacyChannelPageAccessToken(platform, pageId), value)
  }

  async getLegacyChannelPageAccessToken<T>(platform: string, pageId: string): Promise<T | null> {
    return this.redis.getJson(ServerRedisKeys.legacyChannelPageAccessToken(platform, pageId))
  }

  async deleteLegacyChannelPageAccessToken(platform: string, pageId: string): Promise<boolean> {
    return this.redis.del(ServerRedisKeys.legacyChannelPageAccessToken(platform, pageId))
  }

  async saveLegacyChannelUserPageList<T>(platform: string, accountId: string, value: T): Promise<boolean> {
    return this.redis.setJson(ServerRedisKeys.legacyChannelUserPageList(platform, accountId), value)
  }

  async getLegacyChannelUserPageList<T>(platform: string, accountId: string): Promise<T | null> {
    return this.redis.getJson(ServerRedisKeys.legacyChannelUserPageList(platform, accountId))
  }

  async saveDouyinClientToken<T extends { expires_in?: number }>(value: T): Promise<boolean> {
    return this.redis.setJson(ServerRedisKeys.douyinClientToken(), value, value.expires_in)
  }

  async getDouyinClientToken<T>(): Promise<T | null> {
    return this.redis.getJson(ServerRedisKeys.douyinClientToken())
  }

  async deleteDouyinClientToken(): Promise<boolean> {
    return this.redis.del(ServerRedisKeys.douyinClientToken())
  }

  async saveDouyinOpenTicket<T extends { expires_in?: number }>(value: T): Promise<boolean> {
    return this.redis.setJson(ServerRedisKeys.douyinOpenTicket(), value, value.expires_in)
  }

  async getDouyinOpenTicket<T>(): Promise<T | null> {
    return this.redis.getJson(ServerRedisKeys.douyinOpenTicket())
  }

  async deleteDouyinOpenTicket(): Promise<boolean> {
    return this.redis.del(ServerRedisKeys.douyinOpenTicket())
  }
}
