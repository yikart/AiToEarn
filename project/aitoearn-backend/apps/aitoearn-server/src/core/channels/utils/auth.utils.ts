import type { Locale } from '@yikart/common'
import type { CookieOptions, Response } from 'express'
import { CookieName } from '@yikart/common'
import { config } from '../../../config'

export interface AuthViewMessages {
  title: string
  selectTitle: string
  selectDescription: string
  accountCount: string
  selectedCount: string
  noAccountsTitle: string
  noAccountsDescription: string
  continueButton: string
  selectRequired: string
  connectedTitle: string
  redirectingDescription: string
  closeDescription: string
  connectedAccounts: string
  accountId: string
  platformUid: string
  account: string
  failedTitle: string
  failedDescription: string
  errorCode: string
}

export const authViewMessages: Record<Locale, AuthViewMessages> = {
  'en-US': {
    title: 'Authorization',
    selectTitle: 'Choose accounts to connect',
    selectDescription: 'Select the accounts you want AiToEarn to manage for publishing and analytics.',
    accountCount: 'Available accounts',
    selectedCount: 'Selected',
    noAccountsTitle: 'No accounts available',
    noAccountsDescription: 'This authorization did not return any accounts that can be connected.',
    continueButton: 'Continue',
    selectRequired: 'Select at least one account to continue.',
    connectedTitle: 'Authorization completed',
    redirectingDescription: 'Redirecting you back now.',
    closeDescription: 'You can close this page now.',
    connectedAccounts: 'Connected accounts',
    accountId: 'Account ID',
    platformUid: 'Platform ID',
    account: 'Account',
    failedTitle: 'Authorization failed',
    failedDescription: 'Please close this page and try authorizing again.',
    errorCode: 'Error code',
  },
  'zh-CN': {
    title: '授权',
    selectTitle: '选择要连接的账号',
    selectDescription: '请选择需要交给 AiToEarn 管理发布和数据的账号。',
    accountCount: '可连接账号',
    selectedCount: '已选择',
    noAccountsTitle: '没有可连接的账号',
    noAccountsDescription: '本次授权没有返回可连接的账号。',
    continueButton: '继续',
    selectRequired: '请至少选择一个账号后继续。',
    connectedTitle: '授权已完成',
    redirectingDescription: '正在跳转回应用。',
    closeDescription: '现在可以关闭此页面。',
    connectedAccounts: '已连接账号',
    accountId: '账号 ID',
    platformUid: '平台 ID',
    account: '账号',
    failedTitle: '授权失败',
    failedDescription: '请关闭此页面后重新发起授权。',
    errorCode: '错误码',
  },
}

export function setChannelAuthSessionCookie(res: Response, sessionId: string, expiresAt?: Date) {
  const maxAge = expiresAt
    ? Math.max(expiresAt.getTime() - Date.now(), 1000)
    : 5 * 60 * 1000

  res.cookie(CookieName.ChannelAuthSession, sessionId, {
    ...getChannelSessionCookieOptions(),
    maxAge,
  })
}

export function clearChannelAuthSessionCookie(res: Response) {
  res.clearCookie(CookieName.ChannelAuthSession, getChannelSessionCookieOptions())
}

function getChannelSessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.environment === 'production',
    path: '/api/v2/channels',
  }
}
