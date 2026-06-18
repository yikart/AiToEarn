/**
 * MaterialValidationAlert - 创建草稿提交后的平台兼容性问题列表
 */
'use client'

import type { MaterialValidationIssue } from '../useMaterialValidation'
import { TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PlatformIcon } from '@/components/common/PlatformIcon'

interface MaterialValidationAlertProps {
  issues: MaterialValidationIssue[]
}

export function MaterialValidationAlert({ issues }: MaterialValidationAlertProps) {
  const { t } = useTranslation('brandPromotion')

  if (issues.length === 0)
    return null

  return (
    <div
      className="rounded-lg border border-warning/40 bg-warning/10 text-foreground"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 border-b border-warning/30 px-3 py-2 text-sm font-medium text-foreground">
        <TriangleAlert className="h-4 w-4 shrink-0 text-warning" />
        {t('createMaterial.validationIssueTitle', { count: issues.length })}
      </div>

      <div className="divide-y divide-warning/30">
        {issues.map(issue => (
          <div key={issue.platform} className="flex gap-3 px-3 py-3">
            <PlatformIcon
              platform={issue.platform}
              width={28}
              height={28}
              className="mt-0.5 rounded-full"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">{issue.platformName}</div>
              <ul className="mt-1 space-y-1 text-xs text-foreground">
                {issue.messages.map(message => (
                  <li key={message} className="flex gap-1.5">
                    <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
                    <span>{message}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t('createMaterial.platformIssueHint', { platform: issue.platformName })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
