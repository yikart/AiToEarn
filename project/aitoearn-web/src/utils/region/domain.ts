/**
 * regionDomain - 区域域名切换工具
 * 获取并跳转到当前站点对应的区域切换目标域名。
 */

import { isChina } from '@/constant'

/** 获取当前区域对应的切换目标域名 */
function getRegionSwitchDomain() {
  return isChina
    ? process.env.NEXT_PUBLIC_ABROAD_DOMAIN || 'https://aitoearn.ai/'
    : process.env.NEXT_PUBLIC_CHINA_DOMAIN || 'https://aitoearn.cn/'
}

/** 跳转到当前区域对应的切换目标域名 */
export function switchRegionDomain() {
  if (typeof window === 'undefined')
    return

  window.location.href = getRegionSwitchDomain()
}
