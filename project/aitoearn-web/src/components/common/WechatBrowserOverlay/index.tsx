/**
 * WechatBrowserOverlay - 全局 App 内置浏览器打开提示蒙版
 * 在微信、支付宝内置浏览器打开页面时，引导用户切换到系统浏览器继续使用。
 */

'use client'

import { Ellipsis, Globe } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { isBrowserOpenGuideWebView } from '@/utils/browser'

interface WechatBrowserOverlayProps {
  variant?: 'themed' | 'standalone'
}

interface WechatBrowserOverlayCopy {
  cornerHint: string
  bubbleLine1: string
  bubbleLine2: string
  openInBrowser: string
  description: string
}

export function WechatBrowserOverlay({ variant = 'themed' }: WechatBrowserOverlayProps) {
  const { t } = useTransClient('common')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(isBrowserOpenGuideWebView())
  }, [])

  if (!open)
    return null

  const copy = {
    cornerHint: t('wechatBrowserMask.cornerHint'),
    bubbleLine1: t('wechatBrowserMask.bubbleLine1'),
    bubbleLine2: t('wechatBrowserMask.bubbleLine2'),
    openInBrowser: t('wechatBrowserMask.openInBrowser'),
    description: t('wechatBrowserMask.description'),
  }

  if (variant === 'standalone')
    return <StandaloneWechatBrowserOverlay copy={copy} />

  return (
    <div
      aria-label={copy.openInBrowser}
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-[1200] bg-slate-900/92 text-slate-50"
    >
      <div className="pointer-events-none absolute right-6 top-3 flex flex-col items-end gap-1.5 md:right-8 md:top-5">
        <div className="rounded-full border border-slate-200/20 bg-slate-800/70 px-2.5 py-1 text-[11px] font-medium tracking-[0.08em] text-slate-100">
          {copy.cornerHint}
        </div>

        <div className="relative h-16 w-16 text-slate-50 md:h-20 md:w-20">
          <svg
            aria-hidden="true"
            viewBox="0 0 96 96"
            className="h-full w-full overflow-visible drop-shadow-lg"
          >
            <defs>
              <marker
                id="wechat-browser-arrow-head"
                markerWidth="10"
                markerHeight="10"
                refX="8"
                refY="5"
                orient="auto-start-reverse"
              >
                <path d="M0 0L9 5L0 10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
            </defs>
            <path
              d="M14 74C28 71 42 62 54 47C64 35 71 23 78 11"
              fill="none"
              stroke="currentColor"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="7 7"
              markerEnd="url(#wechat-browser-arrow-head)"
            />
          </svg>
        </div>
      </div>

      <div className="flex min-h-full flex-col items-center justify-center px-6 pb-20 pt-24">
        <div className="pointer-events-none flex w-full max-w-sm flex-col items-center">
          <div className="rounded-[28px] border border-dashed border-slate-200/70 px-6 py-5 text-center text-lg leading-8 text-slate-50">
            <p>{copy.bubbleLine1}</p>
            <p>{copy.bubbleLine2}</p>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-900 shadow-lg">
              <Ellipsis className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-2 rounded-md bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg">
              <Globe className="h-4 w-4" />
              <span>{copy.openInBrowser}</span>
            </div>
          </div>

          <p className="mt-6 max-w-xs text-center text-sm leading-6 text-slate-200/90">
            {copy.description}
          </p>
        </div>
      </div>
    </div>
  )
}

function StandaloneWechatBrowserOverlay({ copy }: { copy: WechatBrowserOverlayCopy }) {
  return (
    <div
      aria-label={copy.openInBrowser}
      aria-modal="true"
      role="dialog"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        backgroundColor: 'rgb(15 23 42 / 0.92)',
        color: 'rgb(248 250 252)',
      }}
    >
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          top: 12,
          right: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 6,
        }}
      >
        <div
          style={{
            borderRadius: 999,
            border: '1px solid rgb(226 232 240 / 0.2)',
            backgroundColor: 'rgb(30 41 59 / 0.7)',
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: 'rgb(241 245 249)',
          }}
        >
          {copy.cornerHint}
        </div>

        <svg
          aria-hidden="true"
          viewBox="0 0 96 96"
          style={{
            width: 72,
            height: 72,
            overflow: 'visible',
            color: 'rgb(248 250 252)',
          }}
        >
          <defs>
            <marker
              id="wechat-browser-standalone-arrow-head"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="5"
              orient="auto-start-reverse"
            >
              <path d="M0 0L9 5L0 10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
          </defs>
          <path
            d="M14 74C28 71 42 62 54 47C64 35 71 23 78 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="7 7"
            markerEnd="url(#wechat-browser-standalone-arrow-head)"
          />
        </svg>
      </div>

      <div
        style={{
          display: 'flex',
          minHeight: '100%',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '96px 24px 80px',
          boxSizing: 'border-box',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        }}
      >
        <div style={{ pointerEvents: 'none', width: '100%', maxWidth: 384, textAlign: 'center' }}>
          <div
            style={{
              borderRadius: 28,
              border: '1px dashed rgb(226 232 240 / 0.7)',
              padding: '20px 24px',
              fontSize: 18,
              lineHeight: 1.75,
            }}
          >
            <p style={{ margin: 0 }}>{copy.bubbleLine1}</p>
            <p style={{ margin: 0 }}>{copy.bubbleLine2}</p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              marginTop: 32,
            }}
          >
            <div
              style={{
                display: 'flex',
                width: 56,
                height: 56,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                backgroundColor: 'rgb(248 250 252)',
                color: 'rgb(15 23 42)',
                fontSize: 28,
                fontWeight: 700,
                boxShadow: '0 10px 24px rgb(2 6 23 / 0.35)',
              }}
            >
              ⋯
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 8,
                backgroundColor: 'rgb(241 245 249)',
                color: 'rgb(15 23 42)',
                padding: '12px 16px',
                fontSize: 14,
                fontWeight: 700,
                boxShadow: '0 10px 24px rgb(2 6 23 / 0.35)',
              }}
            >
              <span aria-hidden="true">🌐</span>
              <span>{copy.openInBrowser}</span>
            </div>
          </div>

          <p style={{ margin: '24px auto 0', maxWidth: 320, color: 'rgb(226 232 240 / 0.9)', fontSize: 14, lineHeight: 1.7 }}>
            {copy.description}
          </p>
        </div>
      </div>
    </div>
  )
}
