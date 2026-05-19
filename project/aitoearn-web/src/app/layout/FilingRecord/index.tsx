/**
 * FilingRecord - 中文环境底部备案信息
 * 在主内容滚动区域末尾轻量展示公安备案号
 */

'use client'

import Image from 'next/image'
import { useTransClient } from '@/app/i18n/client'
import beianPoliceIcon from '@/app/layout/images/beian-police.png'
import { useNavigationLogic } from '@/app/layout/shared/hooks/useNavigationLogic'
import { isChineseLanguage } from '@/lib/i18n/languageConfig'

const POLICE_BEIAN_URL = 'https://beian.mps.gov.cn/#/query/webSearch?code=11010502060417'
const HIDDEN_FILING_ROUTES = new Set(['draft-box', 'accounts', 'brand-promotion'])

export function FilingRecord() {
  const { t, i18n } = useTransClient('common')
  const { route } = useNavigationLogic()

  if (!isChineseLanguage(i18n.language) || HIDDEN_FILING_ROUTES.has(route[0] ?? ''))
    return null

  return (
    <div className="relative z-10 mt-auto flex shrink-0 justify-center px-4 py-4 text-xs text-muted-foreground/60">
      <a
        href={POLICE_BEIAN_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 transition-colors hover:text-muted-foreground"
      >
        <Image
          src={beianPoliceIcon}
          alt=""
          width={14}
          height={16}
          className="h-3.5 w-auto shrink-0 opacity-70"
          aria-hidden
        />
        <span>{t('filing.policeRecord')}</span>
      </a>
    </div>
  )
}
