import type { PlatformInfo } from '@/api/channels/channel.types'
import type { PlatType } from '@/app/config/platConfig'
import type { PluginPlatformType } from '@/store/plugin'
import { PLUGIN_SUPPORTED_PLATFORMS } from '@/store/plugin'

type PlatformFansRefreshInfo = Pick<PlatformInfo, 'capabilities'>

const pluginFansRefreshPlatformSet = new Set<PlatType>(PLUGIN_SUPPORTED_PLATFORMS)

export function isPluginFansRefreshPlatform(platform: PlatType): platform is PluginPlatformType {
  return pluginFansRefreshPlatformSet.has(platform)
}

export function isPlatformFansRefreshSupported(
  platform: PlatType,
  platformInfo?: PlatformFansRefreshInfo | null,
) {
  if (isPluginFansRefreshPlatform(platform))
    return true

  return platformInfo?.capabilities.analytics.account === true
}
