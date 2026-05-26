import type { UserInfo } from '@/store/user'

function normalizeEmails(value?: string) {
  return (value || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
}

export function getSystemAdminEmails() {
  const configuredEmails = normalizeEmails(process.env.NEXT_PUBLIC_SYSTEM_ADMIN_EMAILS)
  return configuredEmails
}

export function isSystemAdminUser(userInfo?: Partial<UserInfo>) {
  const mail = userInfo?.mail?.trim().toLowerCase()
  return Boolean(mail && getSystemAdminEmails().includes(mail))
}
