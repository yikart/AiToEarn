/**
 * LogoSection - 侧边栏 Logo 区域
 */

'use client'

import type { LogoSectionProps } from '../types'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import logo from '@/assets/images/logo.png'
import { useGetClientLng } from '@/hooks/useSystem'
import { cn } from '@/lib/utils'

export function LogoSection({ collapsed, onToggle }: LogoSectionProps) {
  const lng = useGetClientLng()

  return (
    <div
      className={cn(
        'mb-3 flex items-center',
        collapsed ? 'justify-center px-1 py-2' : 'justify-between px-2 py-2',
      )}
    >
      {collapsed ? (
        // 收起状态：默认显示 logo，hover 时显示展开按钮
        <div className="relative flex h-8 w-8 items-center justify-center">
          {/* Logo - 默认显示，hover 时隐藏 */}
          <Link
            href={`/${lng}`}
            className="flex items-center justify-center transition-opacity group-hover:opacity-0"
          >
            <Image src={logo} alt="Aitoearn" width={32} height={32} />
          </Link>
          {/* 展开按钮 - 默认隐藏，hover 时显示 */}
          <button
            onClick={onToggle}
            className="absolute inset-0 flex items-center justify-center rounded-md border-none bg-transparent text-muted-foreground/70 opacity-0 transition-opacity hover:bg-accent hover:text-muted-foreground group-hover:opacity-100"
          >
            <PanelLeftOpen size={18} />
          </button>
        </div>
      ) : (
        <>
          <Link
            href={`/${lng}`}
            className="flex items-center gap-2 text-foreground no-underline hover:opacity-85"
          >
            <Image src={logo} alt="Aitoearn" width={32} height={32} />
            <span className="text-base font-semibold tracking-tight">Aitoearn</span>
          </Link>
          <button
            onClick={onToggle}
            className="flex h-8 w-8 items-center justify-center rounded-md border-none bg-transparent text-muted-foreground/70 transition-colors hover:bg-accent hover:text-muted-foreground"
          >
            <PanelLeftClose size={18} />
          </button>
        </>
      )}
    </div>
  )
}
