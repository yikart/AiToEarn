'use client'
import type { MenuProps } from 'antd'
import Icon from '@ant-design/icons'
import { Menu } from 'antd'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { removeLocalePrefix } from '@/app/layout/layout.utils'
import styles from './aiRank.module.scss'
import Ranking from './svgs/ranking.svg'

type MenuItem = Required<MenuProps>['items'][number]

const items: MenuItem[] = [
  {
    key: '/aiRank/aiRanking',
    label: 'AI工具排行榜',
    icon: <Icon component={Ranking} />,
  },
].map((v) => {
  // @ts-ignore
  v.label = <span title={v.label}>{v.label}</span>
  return v
})

export default function AiRankLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [currChooseRoute, setCurrChooseRoute] = useState<string>()

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
