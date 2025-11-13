'use client'

import type { MenuProps } from 'antd'
import { CaretDownOutlined } from '@ant-design/icons'
import { Button, Dropdown } from 'antd'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import enLang from '@/assets/images/us.png'
import zhLang from '@/assets/images/zh.png'
import { useGetClientLng } from '@/hooks/useSystem'

export interface LanguageSwitcherProps {
  className?: string
  style?: React.CSSProperties
  size?: 'small' | 'middle' | 'large'
}

function LanguageSwitcher({
  className,
  style,
  size = 'middle',
}: LanguageSwitcherProps) {
  const lang = useGetClientLng()
  const router = useRouter()

  const handleLanguageChange = (newLng: string) => {
    // 获取当前路径并替换语言前缀
    const currentPath = location.pathname
    const pathWithoutLang = currentPath.replace(`/${lang}`, '') || '/'
    const newPath = `/${newLng}${pathWithoutLang}`

    router.push(newPath)
  }

  // 语言选项配置
  const languageOptions = [
    {
      key: 'en',
      label: 'English',
      flag: enLang,
      current: lang === 'en',
    },
    {
      key: 'zh-CN',
      label: '简体中文',
      flag: zhLang,
      current: lang === 'zh-CN',
    },
  ]

  const currentLanguage
    = languageOptions.find(lang => lang.current) || languageOptions[0]

  const languageMenuItems: MenuProps['items'] = languageOptions.map(
    option => ({
      key: option.key,
      label: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Image
              src={option.flag}
              alt={option.label}
              width={16}
              height={16}
              style={{ borderRadius: '50%' }}
            />
            <span style={{ color: option.current ? '#52c41a' : '#000' }}>
              {option.label}
            </span>
          </div>
          {option.current && <span style={{ color: '#52c41a' }}>✓</span>}
        </div>
      ),
      onClick: () => handleLanguageChange(option.key),
    }),
  )

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return {
          padding: '2px 6px',
          fontSize: '10px',
          iconSize: 12,
        }
      case 'large':
        return {
          padding: '6px 12px',
          fontSize: '14px',
          iconSize: 16,
        }
      default:
        return {
          padding: '4px 8px',
          fontSize: '12px',
          iconSize: 14,
        }
    }
  }

  const buttonConfig = getButtonSize()

  return (
    <Dropdown
      menu={{ items: languageMenuItems }}
      trigger={['click']}
      placement="bottomRight"
    >
      <Button
        type="text"
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px',
          height: 'auto',
          fontSize: '12px',
          backgroundColor: '#fff',
          border: '1px solid #EBEDEC',
          borderRadius: '30px',
          ...style,
        }}
      >
        <Image
          src={currentLanguage.flag}
          alt={currentLanguage.label}
          width={buttonConfig.iconSize}
          height={buttonConfig.iconSize}
          style={{ borderRadius: '50%' }}
        />
        <span style={{ fontSize: '12px' }}>{currentLanguage.label}</span>
        <CaretDownOutlined style={{ fontSize: buttonConfig.fontSize }} />
      </Button>
    </Dropdown>
  )
}

export default LanguageSwitcher
