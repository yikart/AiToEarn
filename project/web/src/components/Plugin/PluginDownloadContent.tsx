/**
 * PluginDownloadContent - 插件下载内容组件（可复用）
 * 用于在不同弹框中显示插件下载或授权内容
 * 兼容旧接口，根据 pluginStatus 参数显示不同状态
 */

'use client'

import { PluginNoPermission } from './PluginNoPermission'
import { PluginNotInstalled } from './PluginNotInstalled'

/**
 * 组件属性
 */
export interface PluginDownloadContentProps {
  /** 插件状态 */
  pluginStatus: 'not_installed' | 'no_permission' | 'ready'
  /** 检查权限回调 */
  onCheckPermission?: () => void | Promise<void>
}

/**
 * 插件下载内容组件
 */
export function PluginDownloadContent({
  pluginStatus,
}: PluginDownloadContentProps) {
  // 已安装但未授权
  if (pluginStatus === 'no_permission') {
    return <PluginNoPermission />
  }

  // 未安装
  return <PluginNotInstalled />
}
