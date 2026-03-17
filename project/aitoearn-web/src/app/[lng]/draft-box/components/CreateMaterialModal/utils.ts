import type { SocialAccount } from '@/api/types/account.type'
import { PlatType } from '@/app/config/platConfig'

/**
 * 创建假账号以复用 PubParmasTextarea 组件
 * 使用固定的 TikTok 平台（影响上传限制配置）
 */
export function createFakeAccount(): SocialAccount {
  const fakeId = `material-fake-${Date.now()}`
  return {
    id: fakeId,
    type: PlatType.Tiktok,
    uid: fakeId,
    account: 'material-account',
    avatar: '',
    nickname: '素材账号',
    status: 1,
    fansCount: 0,
    readCount: 0,
    likeCount: 0,
    collectCount: 0,
    forwardCount: 0,
    commentCount: 0,
    workCount: 0,
    income: 0,
    rank: 1,
    groupId: '',
    loginTime: new Date().toISOString(),
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    lastStatsTime: new Date().toISOString(),
  }
}
