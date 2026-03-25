/**
 * Agent 素材工具函数
 * 提供 Agent 素材的类型判断和数据转换功能
 */

import type { MediaItem } from '@/api/types/media'
import type { AssetType, AssetVo } from '@/types/agent-asset'
import { IMAGE_ASSET_TYPES, VIDEO_ASSET_TYPES } from '@/types/agent-asset'

/**
 * 判断是否为视频类型的 Asset
 * @param type - Asset 类型
 * @returns 是否为视频类型
 */
export function isVideoAssetType(type: AssetType): boolean {
  return VIDEO_ASSET_TYPES.includes(type)
}

/**
 * 判断是否为图片类型的 Asset
 * @param type - Asset 类型
 * @returns 是否为图片类型
 */
export function isImageAssetType(type: AssetType): boolean {
  return IMAGE_ASSET_TYPES.includes(type)
}

/**
 * 将 AssetVo 转换为 MediaItem 格式
 * 用于在素材选择器等组件中统一使用 MediaItem 类型
 * @param asset - Agent 素材
 * @returns MediaItem 格式的数据
 */
export function convertAssetToMediaItem(asset: AssetVo): MediaItem {
  const isVideo = isVideoAssetType(asset.type)

  return {
    _id: asset.id,
    userId: asset.userId || '',
    userType: 'user',
    groupId: 'agent-assets', // 虚拟分组 ID
    type: isVideo ? 'video' : 'img',
    url: asset.url,
    // 缩略图：视频使用 cover（无封面则为空字符串），图片使用原图
    thumbUrl: isVideo ? asset.metadata?.cover || '' : asset.url,
    title: asset.filename || '',
    desc: '',
    useCount: 0,
    metadata: {
      size: 0,
      mimeType: asset.mimeType || '',
    },
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt || asset.createdAt,
  }
}

/**
 * 批量将 AssetVo 数组转换为 MediaItem 数组
 * @param assets - Agent 素材列表
 * @returns MediaItem 格式的列表
 */
export function convertAssetsToMediaItems(assets: AssetVo[]): MediaItem[] {
  return assets.map(convertAssetToMediaItem)
}

/**
 * 媒体类型
 */
export type MediaType = 'video' | 'img'

/**
 * 根据媒体类型过滤 Asset 列表
 * @param assets - Agent 素材列表
 * @param mediaTypes - 媒体类型，可以是单个类型或类型数组
 * @returns 过滤后的素材列表
 */
export function filterAssetsByMediaType(
  assets: AssetVo[],
  mediaTypes: MediaType | MediaType[],
): AssetVo[] {
  const types = Array.isArray(mediaTypes) ? mediaTypes : [mediaTypes]

  return assets.filter((asset) => {
    // 判断 asset 是视频还是图片
    const isVideo = isVideoAssetType(asset.type)
    const assetMediaType: MediaType = isVideo ? 'video' : 'img'

    return types.includes(assetMediaType)
  })
}

/**
 * 根据媒体类型过滤并转换为 MediaItem
 * @param assets - Agent 素材列表
 * @param mediaTypes - 媒体类型，可以是单个类型或类型数组
 * @returns 过滤后的 MediaItem 列表
 */
export function filterAndConvertAssets(
  assets: AssetVo[],
  mediaTypes: MediaType | MediaType[],
): MediaItem[] {
  const filtered = filterAssetsByMediaType(assets, mediaTypes)
  return convertAssetsToMediaItems(filtered)
}

/**
 * 获取素材的缩略图 URL
 * @param asset - Agent 素材
 * @returns 缩略图 URL，视频无封面时返回空字符串
 */
export function getAssetThumbUrl(asset: AssetVo): string {
  if (isVideoAssetType(asset.type)) {
    return asset.metadata?.cover || '' // 视频无封面时返回空字符串，由调用方处理占位图
  }
  return asset.url
}

/**
 * 获取素材的媒体类型
 * @param asset - Agent 素材
 * @returns 媒体类型 'video' | 'img'
 */
export function getAssetMediaType(asset: AssetVo): MediaType {
  return isVideoAssetType(asset.type) ? 'video' : 'img'
}
