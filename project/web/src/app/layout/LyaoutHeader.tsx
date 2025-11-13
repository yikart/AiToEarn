'use client'

import type {
  ForwardedRef,
} from 'react'
import {
  ArrowLeftOutlined,
  BellOutlined,
  BookOutlined,
  CrownOutlined,
  FileTextOutlined,
  GithubOutlined,
  LogoutOutlined,
  QuestionCircleOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { NoSSR } from '@kwooshung/react-no-ssr'
import { Badge, Button, Popover } from 'antd'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  forwardRef,
  memo,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTransClient } from '@/app/i18n/client'
import LayoutNav from '@/app/layout/layoutNav'
import logo from '@/assets/images/logo.png'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import PointsDetailModal from '@/components/modals/PointsDetailModal'
import VipContentModal from '@/components/modals/VipContentModal'
import NotificationPanel from '@/components/notification/NotificationPanel'
import SignInCalendar from '@/components/SignInCalendar'
import { useNotification } from '@/hooks/useNotification'
import { useGetClientLng } from '@/hooks/useSystem'
import { useUserStore } from '@/store/user'

import styles from './styles/lyaoutHeader.module.scss'

export interface ILyaoutHeaderRef { }

export interface ILyaoutHeaderProps { }

function UserInfo() {
  const userInfo = useUserStore(state => state.userInfo)!
  const router = useRouter()
  const { t } = useTransClient('common')

  const menuItems = useMemo(() => {
    return [
      {
        href: `/profile`,
        label: t('profile'),
        icon: <UserOutlined />,
      },
      {
        href: `/income`,
        label: t('header.income'),
        icon: <FileTextOutlined />,
        border: true,
      },
      {
        href: `https://docs.aitoearn.ai/`,
        label: t('docs'),
        icon: <BookOutlined />,
      },
      {
        label: t('support'),
        icon: <QuestionCircleOutlined />,
        href: 'https://github.com/yikart/AiToEarn/issues',
      },
      {
        label: 'Github',
        icon: <GithubOutlined />,
        href: `https://github.com/yikart/AiToEarn`,
        subtitle: (
          <img src="https://img.shields.io/github/stars/yikart/AiToEarn.svg" />
        ),
      },
      {
        onClick: () => {
          useUserStore.getState().logout()
          router.push(`/`)
        },
        label: t('logout'),
        icon: <LogoutOutlined />,
      },
    ]
  }, [router, t])

  const avatar = (
    <Image
      className={styles['layoutHeader-userinfo-avatar']}
      src={userInfo?.avatar || logo}
      alt={t('profile')}
      width={35}
      height={35}
      style={{
        borderRadius: '50%',
        backgroundColor: '#e9d5ff',
        padding: '3px',
      }}
    />
  )

  return (
    <div className={styles['layoutHeader-userinfo__wrapper']}>
      <Popover
        placement="bottomLeft"
        arrow={false}
        styles={{ body: { padding: '0' } }}
        content={(
          <div className={styles.layoutHeaderMenu}>
            <div className="layoutHeaderMenu-head">
              <div className="layoutHeaderMenu-head-info">
                <span className="layoutHeaderMenu-head-info-name">
                  {userInfo?.name || t('unknownUser')}
                </span>
                <span className="layoutHeaderMenu-head-info-mail">
                  {userInfo.mail}
                </span>
              </div>
              <div className="layoutHeaderMenu-head-avatar">{avatar}</div>
            </div>
            <div className="layoutHeaderMenu-content">
              {menuItems.map((v) => {
                return (
                  <a
                    className={`layoutHeaderMenu-item ${v.border ? 'layoutHeaderMenu-item--border' : ''}`}
                    href={v.href}
                    key={v.label}
                    title={v.label}
                    target={v.href?.includes('https://') ? '_blank' : '_self'}
                    onClick={v.onClick}
                  >
                    <p className="layoutHeaderMenu-item-label">
                      {v.icon}
                      {v.label}
                    </p>
                    <div className="layoutHeaderMenu-item-subtitle">
                      {v.subtitle
                        ? v.subtitle
                        : v.href && (
                          <ArrowLeftOutlined
                            style={{
                              transform: 'rotate(140deg)',
                              fontSize: '12px',
                            }}
                          />
                        )}
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        )}
      >
        <div className={styles['layoutHeader-userinfo']}>{avatar}</div>
      </Popover>
    </div>
  )
}

const LyaoutHeader = memo(
  forwardRef(({ }: ILyaoutHeaderProps, ref: ForwardedRef<ILyaoutHeaderRef>) => {
    const userStore = useUserStore()
    const layoutHeader = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const { t } = useTransClient('common')
    const { t: tVip } = useTransClient('vip')
    const lng = useGetClientLng()
    const [notificationVisible, setNotificationVisible] = useState(false)
    const [vipModalVisible, setVipModalVisible] = useState(false)
    const [pointsModalVisible, setPointsModalVisible] = useState(false)
    const { unreadCount } = useNotification()

    const [isVisible, setIsVisible] = useState(true)
    const [isClosing, setIsClosing] = useState(false)
    const handleClose = (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsClosing(true)
      // 等待动画完成后再隐藏元素
      setTimeout(() => {
        setIsVisible(false)
      }, 300)
    }

    return (
      <>
        <div ref={layoutHeader} className={styles.layoutHeader}>
          <div className={styles.layoutHeader_wrapper}>
            <div className={styles['layoutHeader_wrapper-left']}>
              <h1 className={styles['layoutHeader_wrapper-logo']}>
                <Link href="/">
                  <Image src={logo} alt="AIToEarn" width={50} />
                </Link>
              </h1>
              <LayoutNav />
            </div>

            <div
              className={styles['layoutHeader_wrapper-right']}
              suppressHydrationWarning={true}
            >
              <LanguageSwitcher
                className={styles.languageButton}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 8px',
                  height: 'auto',
                  fontSize: '12px',
                }}
              />
              <NoSSR>
                {userStore.token && (
                  <SignInCalendar className={styles.signInCalendarButton} />
                )}
                {/* 会员状态显示 */}
                {userStore.token
                  && (() => {
                    // 判断是否为有效会员：有vipInfo且未过期
                    const isVip
                      = userStore.userInfo?.vipInfo
                        && userStore.userInfo.vipInfo.expireTime
                        && new Date(userStore.userInfo.vipInfo.expireTime)
                        > new Date()

                    return (
                      <Button
                        type="text"
                        icon={(
                          <CrownOutlined
                            style={{
                              fontSize: 18,
                              color: isVip ? '#F5AB03' : '#999',
                            }}
                          />
                        )}
                        onClick={() => setVipModalVisible(true)}
                        style={{ position: 'relative', marginTop: -14 }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            top: '28px',
                            width: '55px',
                            right: '-4px',
                            background: 'rgb(245, 171, 3)',
                            color: 'white',
                            fontSize: '8px',
                            fontWeight: 'bold',
                            padding: '1px 4px',
                            borderRadius: '8px',
                            lineHeight: '10px',
                            minWidth: '16px',
                            textAlign: 'center',
                          }}
                        >
                          {isVip
                            ? tVip('membership' as any) || 'Membership'
                            : tVip('upgrade' as any) || 'Upgrade'}
                        </span>
                      </Button>
                    )
                  })()}
                {/* 通知 */}
                {userStore.token && (
                  <Badge count={unreadCount} size="small">
                    <Button
                      type="text"
                      icon={<BellOutlined />}
                      onClick={() => setNotificationVisible(true)}
                      className={styles.notificationButton}
                    />
                  </Badge>
                )}
                {userStore.token
                  ? (
                      <UserInfo />
                    )
                  : (
                      <Button
                        onClick={() => {
                          router.push(`/${lng}/login`)
                        }}
                      >
                        {t('login')}
                      </Button>
                    )}
              </NoSSR>
            </div>
          </div>
        </div>

        <div className={`${styles.releaseBanner} ${isClosing ? styles.bannerClosing : ''}`}>
          <div className={styles.bannerContent} onClick={() => setVipModalVisible(true)}>
            {' '}
            {/* 点击横幅打开VIP弹窗，而不是跳转 */}
            <span className={styles.releaseText}>Join Plus — Enjoy Unlimited Free Sora-2, Nano Banana!</span>
          </div>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="关闭横幅"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Notification Panel */}
        <NotificationPanel
          visible={notificationVisible}
          onClose={() => setNotificationVisible(false)}
        />
        {/* VIP 弹窗 */}
        <VipContentModal
          open={vipModalVisible}
          onClose={() => setVipModalVisible(false)}
        />
        {/* 积分详情弹窗 */}
        <PointsDetailModal
          open={pointsModalVisible}
          onClose={() => setPointsModalVisible(false)}
        />
      </>
    )
  }),
)

export default LyaoutHeader
