/**
 * GeneralTab - 通用设置 Tab
 */

'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTransClient } from '@/app/i18n/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useGetClientLng } from '@/hooks/useSystem'
import { useSystemStore, type ThemeType } from '@/store/system'
import { useShallow } from 'zustand/react/shallow'

// 主题图片
import lightColorImg from '../images/lightColor.png'
import darkColorImg from '../images/darkColor.png'
import followSystemImg from '../images/followSystem.png'

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'zh-CN', label: '简体中文' },
]

/** 主题选项配置 */
const themeOptions: { value: ThemeType; labelKey: string; image: typeof lightColorImg }[] = [
  { value: 'light', labelKey: 'general.themeLight', image: lightColorImg },
  { value: 'dark', labelKey: 'general.themeDark', image: darkColorImg },
  { value: 'system', labelKey: 'general.themeSystem', image: followSystemImg },
]

export function GeneralTab() {
  const { t } = useTransClient('settings')
  const router = useRouter()
  const lng = useGetClientLng()

  const { theme, setTheme } = useSystemStore(
    useShallow(state => ({
      theme: state.theme,
      setTheme: state.setTheme,
    }))
  )

  const handleLanguageChange = (newLng: string) => {
    const currentPath = location.pathname
    const pathWithoutLang = currentPath.replace(`/${lng}`, '') || '/'
    const newPath = `/${newLng}${pathWithoutLang}`
    router.push(newPath)
  }

  return (
    <div className="space-y-8">
      {/* 外观主题 */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-1">{t('general.theme')}</h4>
        <p className="text-sm text-gray-500 mb-4">{t('general.themeDesc')}</p>
        <div className="flex gap-4">
          {themeOptions.map(option => {
            const isActive = theme === option.value
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className="flex flex-col items-center gap-2 group"
              >
                {/* 图片容器 */}
                <div
                  className={cn(
                    'relative w-20 h-14 rounded-lg overflow-hidden border-2 transition-all',
                    isActive
                      ? 'border-(--primary-color) shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <Image
                    src={option.image}
                    alt={t(option.labelKey)}
                    fill
                    className="object-cover"
                  />
                </div>
                {/* 标签 */}
                <span
                  className={cn(
                    'text-xs transition-colors',
                    isActive ? 'text-(--primary-color) font-medium' : 'text-gray-600'
                  )}
                >
                  {t(option.labelKey)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

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

