'use client'
import type { MenuProps } from 'antd'
import Icon from '@ant-design/icons'
import { Menu } from 'antd'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { removeLocalePrefix } from '@/app/layout/layout.utils'
import styles from './aiRank.module.scss'
import Ranking from './svgs/ranking.svg'

type MenuItem = Required<MenuProps>['items'][number]

export default function AiRankLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { t } = useTransClient('aiRank')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [currChooseRoute, setCurrChooseRoute] = useState<string>()

  const items: MenuItem[] = [
    {
      key: '/aiRank/aiRanking',
      label: <span title={t('menu.aiToolRanking')}>{t('menu.aiToolRanking')}</span>,
      icon: <Icon component={Ranking} />,
    },
  ]

  useEffect(() => {
    setCurrChooseRoute(removeLocalePrefix(pathname))
  }, [pathname, searchParams])

  return (
    <div className={styles.aiRank}>
      <Menu
        selectedKeys={[currChooseRoute || '']}
        style={{ width: 200 }}
        inlineIndent={15}
        mode="inline"
        items={items}
        onClick={(e) => {
          router.push(e.key as string)
        }}
      />
      {children}
    </div>
  )
}
