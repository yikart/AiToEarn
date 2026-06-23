/**
 * regionRedirect - 平台区域限制跳转工具
 * 当用户点击当前区域不支持的平台时，弹出确认提示并跳转到对应域名
 */

import { directTrans } from '@/app/i18n/client'
import { isChina } from '@/constant'
import { confirm } from '@/utils/ui/confirm'
import { switchRegionDomain } from './domain'

/** 弹出平台区域限制提示，确认后跳转到对应域名 */
export async function confirmPlatformRegionRedirect(platformName: string): Promise<void> {
  const title = directTrans('common', 'platformRegionPrompt.title')
  const rawContent = isChina
    ? directTrans('common', 'platformRegionPrompt.abroadContent')
    : directTrans('common', 'platformRegionPrompt.chinaContent')
  const content = rawContent.replace('{{platform}}', platformName)
  const okText = directTrans('common', 'platformRegionPrompt.ok')
  const cancelText = directTrans('common', 'platformRegionPrompt.cancel')

  await confirm({
    title,
    content,
    okText,
    cancelText,
    onOk: async () => {
      switchRegionDomain()
    },
  })
}
