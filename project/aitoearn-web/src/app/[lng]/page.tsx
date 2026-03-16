/**
 * 首页 - 重定向到内容管理
 */

import { redirect } from 'next/navigation'

export default async function HomePage() {
  redirect('/draft-box')
}
