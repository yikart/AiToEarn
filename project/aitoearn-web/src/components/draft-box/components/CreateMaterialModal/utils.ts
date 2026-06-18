import type { SocialAccount } from '@/api/accounts/account.types'
import { PlatType } from '@/app/config/platConfig'
import { PubType } from '@/app/config/publishConfig'
import { getPlatformInfoSync } from '@/store/platformMetadata'
import { parseTopicString } from '@/utils/common'

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

function normalizeTopicText(topic: string) {
  return topic.replace(/^#+/, '').trim()
}

function getTopicKey(topic: string) {
  return normalizeTopicText(topic).toLowerCase()
}

export function appendMaterialTopicsToDescription(description: string, topics?: string[]) {
  if (!topics?.length)
    return description

  const { topics: descriptionTopics } = parseTopicString(description)
  const existingTopicKeys = new Set(descriptionTopics.map(getTopicKey))
  const appendedTopicKeys = new Set<string>()
  const topicText = topics
    .flatMap((topic) => {
      const topicLabel = normalizeTopicText(topic)
      const topicKey = getTopicKey(topicLabel)
      if (!topicLabel || existingTopicKeys.has(topicKey) || appendedTopicKeys.has(topicKey))
        return []

      appendedTopicKeys.add(topicKey)
      return [`#${topicLabel}`]
    })
    .join(' ')

  if (!topicText)
    return description.trim()

  return `${description}\n${topicText}`.trim()
}

export function getMaterialUploadPlatType(selectedPlatforms: PlatType[]) {
  const mediaPlatform = selectedPlatforms.find((platType) => {
    const pubTypes = getPlatformInfoSync(platType)?.pubTypes
    return pubTypes?.has(PubType.ImageText) && pubTypes.has(PubType.VIDEO)
  }) ?? selectedPlatforms.find((platType) => {
    const pubTypes = getPlatformInfoSync(platType)?.pubTypes
    return pubTypes?.has(PubType.ImageText) || pubTypes?.has(PubType.VIDEO)
  })

  return mediaPlatform ?? selectedPlatforms[0] ?? PlatType.Tiktok
}
