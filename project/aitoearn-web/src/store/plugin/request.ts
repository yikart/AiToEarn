/**
 * 插件通用代理请求封装
 */

import type { PluginProxyRequestParams, PluginProxyResponse } from './types/baseTypes'

const PLUGIN_PROXY_REQUEST_UNAVAILABLE = 'PLUGIN_PROXY_REQUEST_UNAVAILABLE'

function getPluginProxyMethod() {
  const plugin = typeof window !== 'undefined' ? window.AIToEarnPlugin : undefined

  if (!plugin?.proxyRequest) {
    throw new Error(PLUGIN_PROXY_REQUEST_UNAVAILABLE)
  }

  return plugin.proxyRequest.bind(plugin)
}

export async function proxyRequest(params: PluginProxyRequestParams): Promise<PluginProxyResponse> {
  return getPluginProxyMethod()(params)
}
