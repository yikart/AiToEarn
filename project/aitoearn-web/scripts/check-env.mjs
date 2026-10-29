/**
 * dev 环境守卫：NEXT_PUBLIC_API_URL 缺失时启动即报错并打印指引，
 * 避免请求静默打到 /undefined/ 404。
 *
 * 检查顺序：process.env → .env.local → .env.development.local → .env.development → .env
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ENV_FILES = [
  '.env.local',
  '.env.development.local',
  '.env.development',
  '.env',
]

function readEnvFile(file) {
  const content = readFileSync(file, 'utf8')
  for (const line of content.split('\n')) {
    const match = line.match(/^\s*NEXT_PUBLIC_API_URL\s*=\s*(.+?)\s*$/)
    if (match) return match[1].replace(/^['"]|['"]$/g, '')
  }
  return undefined
}

if (!process.env.NEXT_PUBLIC_API_URL) {
  for (const file of ENV_FILES) {
    const path = resolve(process.cwd(), file)
    if (!existsSync(path)) continue
    const value = readEnvFile(path)
    if (value) {
      console.log(`[check-env] 已从 ${file} 读取 NEXT_PUBLIC_API_URL=${value}`)
      process.exit(0)
    }
  }

  console.error(
    [
      '',
      '[check-env] 启动失败：缺少必填环境变量 NEXT_PUBLIC_API_URL。',
      '',
      '所有 API 请求都会以它为 baseURL，缺失时浏览器请求会静默打到 /undefined/ 返回 404。',
      '',
      '修复方式（二选一）：',
      '  1. cp .env.example .env.local，并把 NEXT_PUBLIC_API_URL 改为你本地后端地址',
      '     （本地 aitoearn-server 默认 http://localhost:3002）',
      '  2. 直接在命令行传入：',
      '     NEXT_PUBLIC_API_URL=http://localhost:3002 pnpm dev',
      '',
    ].join('\n'),
  )
  process.exit(1)
}

console.log(`[check-env] NEXT_PUBLIC_API_URL=${process.env.NEXT_PUBLIC_API_URL}`)
