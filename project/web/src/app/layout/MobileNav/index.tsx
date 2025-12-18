/**
 * MobileNav - 移动端顶部导航组件
 * 在移动端显示，包含 Logo 和抽屉式导航菜单
 */
'use client'

import { FileText, Menu, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSelectedLayoutSegments } from 'next/navigation'
import { useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { routerData } from '@/app/layout/routerData'
import logo from '@/assets/images/logo.png'
import { Button } from '@/components/ui/button'
import { useGetClientLng } from '@/hooks/useSystem'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store/user'

/**
 * 移动端导航项组件
 */
function MobileNavItem({
  path,
  translationKey,
  icon,
  isActive,
  onClose,
}: {
  path: string
  translationKey: string
  icon?: React.ReactNode
  isActive: boolean
  onClose: () => void
}) {
  const { t } = useTransClient('route')
  const lng = useGetClientLng()
  const fullPath = path.startsWith('/') ? `/${lng}${path}` : `/${lng}/${path}`

  return (
    <Link
      href={fullPath}
      onClick={onClose}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all',
        'text-muted-foreground hover:bg-muted hover:text-foreground',
        isActive && 'bg-primary/10 text-primary',
      )}
    >
      <span className={cn('flex items-center justify-center', isActive && 'text-primary')}>
        {icon || <FileText size={20} />}
      </span>
      <span>{t(translationKey as any)}</span>
    </Link>
  )
}

/**
 * 移动端导航主组件
 */
const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { t } = useTransClient('common')
  const lng = useGetClientLng()
  const token = useUserStore(state => state.token)
  const route = useSelectedLayoutSegments()

  // 获取当前路由
  let currRouter = '/'
  if (route.length === 1) {
    currRouter = route[0]
    currRouter = currRouter === '/' ? currRouter : `/${currRouter}`
  }
  else if (route.length >= 2) {
    currRouter = `/${route.slice(0, 2).join('/')}`
  }

  const handleClose = () => setIsOpen(false)

  const handleLogin = () => {
    handleClose()
    router.push(`/auth/login`)
  }

  return (
    <>
      {/* 移动端顶部栏 */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-14 px-4 bg-background border-b border-border">
        <Link href={`/${lng}`} className="flex items-center gap-2">
          <Image src={logo} alt="AIToEarn" width={32} height={32} />
          <span className="text-base font-semibold text-foreground">AIToEarn</span>
        </Link>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* 抽屉遮罩 */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 transition-opacity"
          onClick={handleClose}
        />
      )}

      {/* 抽屉导航 */}
      <div
        className={cn(
          'md:hidden fixed top-0 right-0 z-50 w-[280px] h-full bg-background shadow-xl transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* 抽屉头部 */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-border">
          <span className="text-base font-semibold text-foreground">Menu</span>
          <button
            onClick={handleClose}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 导航列表 */}
        <nav className="flex flex-col gap-1 p-4">
          {routerData.map(item => (
            <MobileNavItem
              key={item.path || item.name}
              path={item.path || '/'}
              translationKey={item.translationKey}
              icon={item.icon}
              isActive={item.path === currRouter}
              onClose={handleClose}
            />
          ))}
        </nav>

        {/* 底部登录按钮 */}
        {!token && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
            <Button
              onClick={handleLogin}
              className="w-full"
            >
              {t('login')}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

export default MobileNav
