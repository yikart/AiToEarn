/**
 * Footer - 页脚布局组件
 * 包含 CTA 区块、链接导航、支持平台展示
 * 三列布局版本，视觉优化
 */

'use client'

import { ArrowRight, Github, Mail } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { AccountPlatInfoArr } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import logo from '@/assets/images/logo.png'

import {
  footerAccount,
  footerContact,
  footerCTA,
  footerLegal,
  footerResources,
} from '../../data/footer'

export function Footer() {
  const { t } = useTransClient('welcome')

  return (
    <div className="w-full">
      {/* CTA 区块 */}
      <div
        className="relative rounded-t-3xl bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'url(https://cdn.prod.website-files.com/66643a14df53b71d1ed72d08/68137c03673002ba44186929_e9df3c48529db552c48678c7d93816d2_footer-bg_new.avif)',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16 lg:px-8">
          <h2 className="w-1/2 text-2xl font-bold text-white md:w-auto md:max-w-md md:text-3xl lg:max-w-2xl lg:text-4xl">
            {t('footer.ctaTitle')}
          </h2>
          <Link
            href={footerCTA.href}
            className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            <span>{t('footer.startTrial')}</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      {/* Footer 主体 - 3 列布局 */}
      <div className="bg-[#fafafa]">
        <footer className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16 lg:px-8">
          {/* 主体内容 - 3 列布局 */}
          <div className="grid gap-12 md:grid-cols-3">
            {/* 第一列: Logo + GitHub + 邮箱 */}
            <div className="space-y-6">
              <Link href="/" className="inline-flex items-center gap-2">
                <Image
                  src={logo}
                  alt="AiToEarn"
                  width={32}
                  height={32}
                  className="size-8 rounded-md"
                />
                <span className="text-lg font-semibold">AiToEarn</span>
              </Link>
              <div className="flex items-center gap-4">
                <a
                  href={footerContact.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                  title="GitHub"
                >
                  <Github className="size-5" />
                </a>
                <a
                  href={footerContact.emailHref}
                  className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                  title={footerContact.email}
                >
                  <Mail className="size-5" />
                </a>
              </div>
            </div>

            {/* 第二列: 资源 + 账户 */}
            <div className="grid grid-cols-2 gap-8">
              {/* 资源 */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('footer.resources')}
                </h4>
                <ul className="space-y-3">
                  {footerResources.map(link => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noopener noreferrer' : undefined}
                        className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                      >
                        {t(`footer.${link.label}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 账户 */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('footer.account')}
                </h4>
                <ul className="space-y-3">
                  {footerAccount.map(link => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                      >
                        {t(`footer.${link.label}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 第三列: 法律协议 */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('footer.legal')}
              </h4>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-3">
                {footerLegal.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {t(`footer.${link.label}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 渐变分割线 */}
          <div className="mt-12 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* 支持平台区域 */}
          <div className="mt-8">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('footer.supportedPlatforms')}
            </h4>
            <div className="mt-4 flex flex-wrap gap-3">
              {AccountPlatInfoArr.map(([type, info]) => (
                <Image
                  key={type}
                  src={info.icon}
                  alt={info.name}
                  width={24}
                  height={24}
                  className="size-6"
                  title={info.name}
                />
              ))}
            </div>
          </div>

          {/* 渐变分割线 */}
          <div className="mt-8 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* 底部版权 */}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>{t('footer.copyright')}</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
