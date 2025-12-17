/**
 * GeneralTab - 通用设置 Tab
 */

'use client'

import { useRouter } from 'next/navigation'
import { useTransClient } from '@/app/i18n/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGetClientLng } from '@/hooks/useSystem'

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'zh-CN', label: '简体中文' },
]

export function GeneralTab() {
  const { t } = useTransClient('settings')
  const router = useRouter()
  const lng = useGetClientLng()

  const handleLanguageChange = (newLng: string) => {
    const currentPath = location.pathname
    const pathWithoutLang = currentPath.replace(`/${lng}`, '') || '/'
    const newPath = `/${newLng}${pathWithoutLang}`
    router.push(newPath)
  }

  return (
    <div className="space-y-6">
      {/* 网站语言 */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-900">{t('general.language')}</h4>
          <p className="mt-0.5 text-sm text-gray-500">{t('general.languageDesc')}</p>
        </div>
        <Select value={lng} onValueChange={handleLanguageChange}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languageOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

