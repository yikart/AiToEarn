/**
 * ShortLink 中转页
 * 用于 PC 端抖音发布后，扫码通过深度链接唤起抖音 App
 * API 返回 302 重定向到 snssdk1128:// scheme URL
 * 采用多策略唤起：iframe + location.href + 超时降级
 *
 * 注意：layout.tsx 创建了独立的 <html><body>，未引入全局 CSS，
 * 因此本页面所有样式必须使用内联 style，不可使用 Tailwind 类名。
 */
'use client'

import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'

import logo from '@/assets/images/logo.png'
import douyinIcon from '@/assets/svgs/plat/douyin.svg'
import { openApp } from '@/utils/appLaunch'

type LaunchStatus = 'loading' | 'launching' | 'failed'

/* ─── 色彩常量（Tailwind 中性灰风格） ─── */
const colors = {
  bg: '#f8fafc',
  card: '#ffffff',
  border: '#e2e8f0',
  text: '#1e293b',
  textMuted: '#64748b',
  error: '#ef4444',
  errorBg: 'rgba(239,68,68,0.1)',
  warning: '#f97316',
  warningBg: 'rgba(249,115,22,0.1)',
  btnBg: '#0f172a',
  btnText: '#ffffff',
  iconCircleBg: 'rgba(148,163,184,0.15)',
}

/* ─── 内联 SVG 图标 ─── */
function CircleAlertIcon({ color, size = 40 }: { color: string, size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function LoaderIcon({ color, size = 24 }: { color: string, size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ animation: 'shortlink-spin 1s linear infinite' }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function RefreshIcon({ color, size = 16 }: { color: string, size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}

/** 注入 keyframes 动画的 style 标签 */
function AnimationStyles() {
  return (
    <style>
      {`
        @keyframes shortlink-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}
    </style>
  )
}

/** 品牌 Logo 区域 */
function BrandHeader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <Image src={logo} alt="AiToEarn" width={32} height={32} style={{ borderRadius: 8 }} />
      <span style={{ fontSize: 18, fontWeight: 600, color: colors.text, letterSpacing: '-0.025em' }}>AiToEarn</span>
    </div>
  )
}

/** 抖音平台图标 */
function DouyinIcon() {
  return (
    <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: colors.iconCircleBg }} />
      <Image src={douyinIcon} alt="抖音" width={48} height={48} style={{ position: 'relative', zIndex: 1 }} />
    </div>
  )
}

/** 页面外壳：居中卡片布局 */
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bg,
        padding: '32px 16px',
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <AnimationStyles />
      <div
        style={{
          width: '100%',
          maxWidth: 384,
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.card,
          padding: 32,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function ShortLinkContent() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string>()
  const [status, setStatus] = useState<LaunchStatus>('loading')
  const apiLinkRef = useRef<string>('')

  const handleLaunch = useCallback((apiUrl: string) => {
    setStatus('launching')
    openApp(apiUrl, () => setStatus('failed'))
  }, [])

  const handleRetry = useCallback(() => {
    if (apiLinkRef.current) {
      handleLaunch(apiLinkRef.current)
    }
  }, [handleLaunch])

  useEffect(() => {
    const apiLink = searchParams.get('apiLink')
    if (!apiLink) {
      setError('缺少链接参数')
      return
    }

    apiLinkRef.current = apiLink
    handleLaunch(apiLink)
  }, [searchParams, handleLaunch])

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
  }

  const iconCircleStyle = (bgColor: string): React.CSSProperties => ({
    display: 'flex',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: bgColor,
  })

  const titleStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 500,
    color: colors.text,
    margin: 0,
  }

  const subtitleStyle: React.CSSProperties = {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 6,
  }

  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    padding: '0 24px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: colors.btnBg,
    color: colors.btnText,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  }

  // Error 状态
  if (error) {
    return (
      <PageShell>
        <div style={containerStyle}>
          <BrandHeader />
          <div style={iconCircleStyle(colors.errorBg)}>
            <CircleAlertIcon color={colors.error} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={titleStyle}>{error}</p>
            <p style={subtitleStyle}>请检查链接是否正确</p>
          </div>
        </div>
      </PageShell>
    )
  }

  // Failed 状态
  if (status === 'failed') {
    return (
      <PageShell>
        <div style={containerStyle}>
          <BrandHeader />
          <div style={iconCircleStyle(colors.warningBg)}>
            <CircleAlertIcon color={colors.warning} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={titleStyle}>唤起抖音失败</p>
            <p style={subtitleStyle}>请手动打开抖音 App</p>
          </div>
          <button onClick={handleRetry} style={buttonStyle}>
            <RefreshIcon color={colors.btnText} />
            重试
          </button>
        </div>
      </PageShell>
    )
  }

  // Loading / Launching 状态
  return (
    <PageShell>
      <div style={containerStyle}>
        <BrandHeader />
        <DouyinIcon />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <LoaderIcon color={colors.textMuted} />
          <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>
            {status === 'loading' ? '正在加载...' : '正在唤起抖音...'}
          </p>
        </div>
      </div>
    </PageShell>
  )
}

export default function ShortLinkPage() {
  return (
    <Suspense
      fallback={(
        <PageShell>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <BrandHeader />
            <DouyinIcon />
            <LoaderIcon color={colors.textMuted} />
          </div>
        </PageShell>
      )}
    >
      <ShortLinkContent />
    </Suspense>
  )
}
