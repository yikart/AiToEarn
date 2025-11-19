'use client'

import type {
  IRouterDataItem,
} from '@/app/layout/routerData'
import { MenuFoldOutlined, RightOutlined, UpOutlined } from '@ant-design/icons'
import { Badge, Drawer, Menu } from 'antd'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSelectedLayoutSegments } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { apiGetNotViewCount } from '@/api/task'
import {
  MILESTONE_STATUS_EVENT,
  MILESTONE_UNREAD_STORAGE_KEY,
} from '@/app/[lng]/dataStatistics/useDataStatistics'
import { useTransClient } from '@/app/i18n/client'
import {
  peRouterData,
  routerData,
} from '@/app/layout/routerData'
import styles from '@/app/layout/styles/layoutNav.module.scss'
import { useGetClientLng } from '@/hooks/useSystem'
import { useUserStore } from '@/store/user'

function getMilestoneNotifyFromStorage() {
  if (typeof window === 'undefined')
    return false
  return window.localStorage.getItem(MILESTONE_UNREAD_STORAGE_KEY) === 'true'
}

/**
 *
 * @param child
 * @param iconLoca 0=上，1=右
 * @param unreadCount 未读任务数量
 */
function getNameTag(
  child: IRouterDataItem,
  iconLoca: number = 1,
  unreadCount?: number,
  milestoneNotify?: boolean,
) {
  const { t } = useTransClient('route')
  const lng = useGetClientLng()
  const path = child.path || '/'

  // 确保路径包含语言前缀
  const fullPath = path.startsWith('/') ? `/${lng}${path}` : `/${lng}/${path}`

  // 判断是否是任务中心
  const isTasksRoute = child.path === '/tasks'
  const showBadge = isTasksRoute && unreadCount && unreadCount > 0
  const isDataStatisticsRoute = child.path === '/dataStatistics'
  const showMilestoneDot = isDataStatisticsRoute && milestoneNotify

  const baseLabel = <span>{t(child.translationKey as any)}</span>
  const labelWithMilestone = showMilestoneDot
    ? (
        <Badge dot offset={[4, 0]} color="#ff4d4f">
          {baseLabel}
        </Badge>
      )
    : baseLabel

  return (
    <>
      {!child.children ? (
        <Link href={fullPath} target={path[0] === '/' ? '_self' : '_blank'}>
          {showBadge
            ? (
                <Badge count={unreadCount} offset={[10, 0]} style={{ backgroundColor: '#ff4d4f' }}>
                  <span>{t(child.translationKey as any)}</span>
                </Badge>
              )
            : (
                labelWithMilestone
              )}
        </Link>
      ) : (
        <span>
          {showBadge ? (
            <Badge count={unreadCount} offset={[10, 0]} style={{ backgroundColor: '#ff4d4f' }}>
              {/* <span>{t(child.translationKey as any)}</span> */}
            </Badge>
          ) : (
            labelWithMilestone
          )}
          {child.children
            && (iconLoca === 0 ? <UpOutlined /> : <RightOutlined />)}
        </span>
      )}
    </>
  )
}

/**
 * 递归级联
 * @param child
 * @param unreadCount 未读任务数量
 */
function RecursionNav({
  child,
  unreadCount,
  milestoneNotify,
}: {
  child: IRouterDataItem
  unreadCount?: number
  milestoneNotify?: boolean
}) {
  return (
    child.children && (
      <ul className={styles.recursionNav}>
        {child.children.map((v) => {
          return (
            <li key={v.name}>
              {getNameTag(v, 1, unreadCount, milestoneNotify)}
              {v.children && (
                <RecursionNav
                  child={v}
                  unreadCount={unreadCount}
                  milestoneNotify={milestoneNotify}
                />
              )}
            </li>
          )
        })}
      </ul>
    )
  )
}

function ParcelTag({
  child,
  children,
}: {
  child: IRouterDataItem
  children: React.ReactNode
}) {
  if (child.children) {
    return <>{children}</>
  }
  else {
    const lng = useGetClientLng()
    const path = child.path || '/'
    const fullPath = path.startsWith('/') ? `/${lng}${path}` : `/${lng}/${path}`
    return <Link href={fullPath}>{children}</Link>
  }
}

/**
 * 二级导航
 * @param child
 * @param visible
 * @param unreadCount 未读任务数量
 */
function ChildNav({
  child,
  visible,
  unreadCount,
  milestoneNotify,
}: {
  child: IRouterDataItem
  visible: boolean
  unreadCount?: number
  milestoneNotify?: boolean
}) {
  const elRef = useRef<HTMLUListElement | null>(null)
  const [height, setHeight] = useState('auto')
  const animaTime = 0.3
  const timer = useRef<NodeJS.Timeout>()
  const { t } = useTransClient('route')

  useEffect(() => {
    if (!elRef.current)
      return
    const h = elRef.current!.offsetHeight
    if (h === 0)
      return
    setHeight(`${h}px`)
  }, [])

  useEffect(() => {
    if (height !== 'auto') {
      setTimeout(() => {
        elRef.current!.style.visibility = 'visible'
        elRef.current!.style.transition = `${animaTime}s`
      }, 1)
    }
  }, [height])

  useEffect(() => {
    if (!elRef.current)
      return
    if (visible) {
      timer.current = setTimeout(() => {
        elRef.current!.style.overflow = 'visible'
      }, animaTime * 1000)
    }
    else {
      elRef.current!.style.overflow = 'hidden'
      clearTimeout(timer.current)
    }
  }, [visible])

  return (
    child.children && (
      <ul
        ref={elRef}
        className={styles['layoutNavPC-one']}
        style={
          visible || height === 'auto'
            ? { height }
            : { height: 0, padding: 0 }
        }
      >
        {child.children.map((v1) => {
          return (
            <li key={v1.name}>
              <div
                className={styles['layoutNavPC-one-item']}
                style={{ backgroundImage: v1.backColor }}
              >
                <ParcelTag child={v1}>
                  <div className={styles['layoutNavPC-one-icon']}>
                    {v1.icon
                      ? (
                          <Image src={v1.icon!} alt="icon" width={20} />
                        )
                      : (
                          ''
                        )}
                  </div>
                  <span className={styles['layoutNavPC-one-text']}>
                    {t(v1.translationKey as any)}
                  </span>
                  {v1.children && <RightOutlined />}
                </ParcelTag>
              </div>
              <RecursionNav
                child={v1}
                unreadCount={unreadCount}
                milestoneNotify={milestoneNotify}
              />
            </li>
          )
        })}
      </ul>
    )
  )
}

function NavPC({ milestoneNotify }: { milestoneNotify: boolean }) {
  const [activeNav, setActiveNav] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const timer = useRef<NodeJS.Timeout>()
  const route = useSelectedLayoutSegments()
  const { t } = useTransClient('route')
  const token = useUserStore(state => state.token)

  // 获取未读任务数量
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!token)
        return
      try {
        const response: any = await apiGetNotViewCount()
        if (response) {
          setUnreadCount(response.data || 0)
        }
      }
      catch (error) {
        console.error('获取未读任务数量失败:', error)
      }
    }

    fetchUnreadCount()

    // 每30秒刷新一次未读数量
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [token])

  let currRouter = '/'
  if (route.length === 1) {
    currRouter = route[0]
    currRouter = currRouter === '/' ? currRouter : `/${currRouter}`
  }
  else {
    currRouter = `/${route.slice(0, 2).join('/')}`
  }

  return (
    <ul className={styles.layoutNavPC}>
      {routerData.map((v1) => {
        return (
          <li
            key={v1.name}
            className={
              activeNav === v1.name || v1.path === currRouter
                ? styles['layoutNavPC-item-active']
                : ''
            }
            onMouseEnter={() => {
              setActiveNav(v1.children ? v1.name : '')
              clearTimeout(timer.current)
            }}
            onMouseLeave={() => {
              timer.current = setTimeout(() => {
                setActiveNav('')
              }, 300)
            }}
          >
            {getNameTag(v1, 0, unreadCount, milestoneNotify)}
            <ChildNav
              key={v1.name}
              child={v1}
              visible={activeNav === v1.name}
              unreadCount={unreadCount}
              milestoneNotify={milestoneNotify}
            />
          </li>
        )
      })}
    </ul>
  )
}

function NavPE({ milestoneNotify }: { milestoneNotify: boolean }) {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()
  const { t } = useTransClient('route')
  const lng = useGetClientLng()
  const token = useUserStore(state => state.token)

  // 获取未读任务数量
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!token)
        return
      try {
        const response: any = await apiGetNotViewCount()
        if (response && response.code === 0 && response.data) {
          setUnreadCount(response.data || 0)
        }
      }
      catch (error) {
        console.error('获取未读任务数量失败:', error)
      }
    }

    // fetchUnreadCount();

    // 每30秒刷新一次未读数量
    const interval = setInterval(fetchUnreadCount, 50000)

    return () => clearInterval(interval)
  }, [token])

  const translatedMenuItems = routerData.map((item) => {
    // 判断是否是任务中心，需要显示徽章
    const isTasksRoute = item.path === '/tasks'
    const showBadge = isTasksRoute && unreadCount > 0
    const isDataStatisticsRoute = item.path === '/dataStatistics'
    const showMilestoneDot = isDataStatisticsRoute && milestoneNotify
    const baseLabel = <span style={{ marginRight: '20px' }}>{t(item.translationKey as any)}</span>
    const labelWithMilestone = showMilestoneDot
      ? (
          <Badge dot color="#ff4d4f">
            {baseLabel}
          </Badge>
        )
      : baseLabel

    return {
      key: item.path || item.name,
      label: showBadge
        ? (
            <Badge count={unreadCount} style={{ backgroundColor: '#ff4d4f' }}>
              <span style={{ marginRight: '20px' }}>{t(item.translationKey as any)}</span>
            </Badge>
          )
        : (
            labelWithMilestone
          ),
      children: item.children?.map(child => ({
        key: child.path || child.name,
        label: t(child.translationKey as any),
      })),
    }
  })

  const handleMenuClick = (e: { key: string }) => {
    // 确保使用当前语言前缀
    const targetPath = e.key.startsWith('/') ? e.key : `/${e.key}`
    const fullPath = `/${lng}${targetPath}`

    // 调试信息
    console.log('Menu click debug:', {
      key: e.key,
      lng,
      targetPath,
      fullPath,
      currentPath: window.location.pathname,
    })

    // 先关闭菜单
    setOpen(false)

    // 使用 window.location.href 进行跳转，确保完全重新加载页面
    // 这样可以避免路由状态混乱的问题
    window.location.href = fullPath
  }

  return (
    <div className={styles.layoutNavPE}>
      <div onClick={() => setOpen(true)} className={styles['layoutNavPE-menu']}>
        <MenuFoldOutlined />
      </div>
      <Drawer
        title={t('navigation')}
        placement="right"
        onClose={() => setOpen(false)}
        width="85%"
        open={open}
      >
        <Menu
          className="layoutNavPE-menu"
          selectable={false}
          onClick={handleMenuClick}
          style={{ width: '100%' }}
          mode="inline"
          items={translatedMenuItems}
        />
      </Drawer>
    </div>
  )
}

function LayoutNav() {
  const [milestoneNotify, setMilestoneNotify] = useState(false)

  useEffect(() => {
    const updateNotify = () => {
      setMilestoneNotify(getMilestoneNotifyFromStorage())
    }

    updateNotify()

    window.addEventListener('storage', updateNotify)
    window.addEventListener(MILESTONE_STATUS_EVENT, updateNotify)

    return () => {
      window.removeEventListener('storage', updateNotify)
      window.removeEventListener(MILESTONE_STATUS_EVENT, updateNotify)
    }
  }, [])

  return (
    <div className={styles.navContainer}>
      <NavPC milestoneNotify={milestoneNotify} />
      <NavPE milestoneNotify={milestoneNotify} />
    </div>
  )
}

export default LayoutNav
