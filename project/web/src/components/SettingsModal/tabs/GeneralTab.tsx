/**
 * GeneralTab - 通用设置 Tab
 */

'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
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

// 主题图片
import lightColorImg from '../images/lightColor.png'
import darkColorImg from '../images/darkColor.png'
import followSystemImg from '../images/followSystem.png'

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'zh-CN', label: '简体中文' },
]

/** 主题选项配置 */
const themeOptions: { value: string; labelKey: string; image: typeof lightColorImg }[] = [
  { value: 'light', labelKey: 'general.themeLight', image: lightColorImg },
  { value: 'dark', labelKey: 'general.themeDark', image: darkColorImg },
  { value: 'system', labelKey: 'general.themeSystem', image: followSystemImg },
]

export function GeneralTab() {
  const { t } = useTransClient('settings')
  const router = useRouter()
  const lng = useGetClientLng()

  // 使用 next-themes 管理主题
  const { theme, setTheme } = useTheme()

  const handleLanguageChange = (newLng: string) => {
    const currentPath = location.pathname
    const pathWithoutLang = currentPath.replace(`/${lng}`, '') || '/'
    const newPath = `/${newLng}${pathWithoutLang}`
    router.push(newPath)
  }

  return (
    <div className="w-full space-y-8">
      {/* 外观主题 */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-1">{t('general.theme')}</h4>
        <p className="text-sm text-muted-foreground mb-4">{t('general.themeDesc')}</p>
        <div className="flex flex-wrap gap-3 md:gap-4">
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
                    'relative w-16 h-11 md:w-20 md:h-14 rounded-lg overflow-hidden border-2 transition-all',
                    isActive
                      ? 'border-primary shadow-sm'
                      : 'border-border hover:border-muted-foreground'
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
                    isActive ? 'text-primary font-medium' : 'text-muted-foreground'
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium text-foreground">{t('general.language')}</h4>
          <p className="mt-0.5 text-sm text-muted-foreground">{t('general.languageDesc')}</p>
        </div>
        <Select value={lng} onValueChange={handleLanguageChange}>
          <SelectTrigger className="h-9 w-full sm:w-[140px]">
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

