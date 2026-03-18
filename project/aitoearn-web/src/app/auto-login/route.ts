/**
 * auto-login API Route - 读取 init 服务生成的自动登录 token
 */

import { readFileSync } from 'fs'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET() {
  const tokenPath = process.env.AUTO_LOGIN_TOKEN_PATH
  if (!tokenPath) return NextResponse.json({ token: null })
  try {
    const token = readFileSync(tokenPath, 'utf-8').trim()
    return NextResponse.json({ token })
  } catch {
    return NextResponse.json({ token: null })
  }
}
