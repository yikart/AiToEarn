import type { ForwardedRef } from 'react'
import { CloseOutlined, MenuOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { forwardRef, memo, useState } from 'react'
import styles from '@/app/[lng]/styles/difyHome.module.scss'
import { useTransClient } from '@/app/i18n/client'
import { removeLocalePrefix } from '@/app/layout/layout.utils'
import { homeHeaderRouterData } from '@/app/layout/routerData'
import logo from '@/assets/images/logo.png'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import { useUserStore } from '@/store/user'

export interface IHomeHeaderRef { }

export interface IHomeHeaderProps { }

const HomeHeader = memo(
  forwardRef(({ }: IHomeHeaderProps, ref: ForwardedRef<IHomeHeaderRef>) => {
    const pathname = usePathname()
    const { t } = useTransClient('home')
    const router = useRouter()
    const userStore = useUserStore()
    const currentPath = removeLocalePrefix(pathname).replace(/\/+$/, '') || '/'
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    /**
     * 切换移动端菜单显示状态
     */
    const toggleMobileMenu = () => {
      setIsMobileMenuOpen(!isMobileMenuOpen)
    }

    /**
     * 关闭移动端菜单
     */
    const closeMobileMenu = () => {
      setIsMobileMenuOpen(false)
    }

    /**
     * 判断链接是否为当前激活状态
     */
    const isActive = (href: string) => {
      if (!href.startsWith('/'))
        return false
      const normalizedHref = href.replace(/\/+$/, '') || '/'
      if (normalizedHref === '/')
        return currentPath === '/'
      if (currentPath === normalizedHref)
        return true
      return currentPath.startsWith(`${normalizedHref}/`)
    }

    return (
      <>
        <header className={styles.header}>
          <div className={styles.headerContainer}>
            <div
              className={styles.logo}
              style={{ cursor: 'pointer' }}
              onClick={() => router.push('/')}
            >
              <Image src={logo} alt="logo" width={50} />
              <span className={styles.logoText}>{t('header.logo')}</span>
            </div>

            {/* 桌面端导航 */}
            <nav className={styles.nav}>
              {homeHeaderRouterData.value.map((v) => {
                if (v.href === '/') {
                  return null
                }
                return (
                  <Link
                    key={v.title}
                    className={`${styles.navLink} ${isActive(v.href) ? styles.active : ''}`}
                    href={v.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ paddingTop: '3px' }}
                  >
                    {v.title}
                  </Link>
                )
              })}
            </nav>

            <div className={styles.headerRight}>
              <LanguageSwitcher
                className={styles.languageButton}
                size="small"
              />

              {/* 移动端菜单按钮 */}
              <button
                className={styles.mobileMenuButton}
                onClick={toggleMobileMenu}
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
              </button>

              <button
                onClick={() => {
                  router.push('/accounts')
                }}
                className={styles.getStartedBtn}
              >
                {t('header.getStarted')}
              </button>
            </div>
          </div>
        </header>

        {/* 移动端菜单遮罩层 */}
        {isMobileMenuOpen && (
          <div className={styles.mobileMenuOverlay} onClick={closeMobileMenu} />
        )}

        {/* 移动端侧边菜单 */}
        <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
          <div className={styles.mobileMenuHeader}>
            <Image src={logo} alt="logo" width={40} />
            <span className={styles.mobileMenuTitle}>{t('header.logo')}</span>
            <button
              className={styles.mobileMenuClose}
              onClick={closeMobileMenu}
              aria-label="Close mobile menu"
            >
              <CloseOutlined />
            </button>
          </div>

          <nav className={styles.mobileMenuNav}>
            {homeHeaderRouterData.value.map((v) => {
              if (v.href === '/') {
                return null
              }
              return (
                <Link
                  key={v.title}
                  className={`${styles.mobileNavLink} ${isActive(v.href) ? styles.active : ''}`}
                  href={v.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMobileMenu}
                >
                  {v.title}
                </Link>
              )
            })}
          </nav>

          <div className={styles.mobileMenuFooter}>
            <LanguageSwitcher
              className={styles.mobileLanguageButton}
              size="small"
            />
          </div>
        </div>
      </>
    )
  }),
)

export default HomeHeader
