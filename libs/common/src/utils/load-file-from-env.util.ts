import fs from 'node:fs'
import path from 'node:path'
import { debuglog } from 'node:util'

const log = debuglog('app:preload-files')

/**
 * 同步地从环境变量中读取配置并创建文件。
 */
function loadFilesFromEnvSync(): void {
  log('开始同步检查并创建文件...')

  const indexSet = new Set<number>()
  for (const key of Object.keys(process.env)) {
    const m = key.match(/^WRITE_FILE_(\d+)_PATH$/)
    if (m && process.env[key]) {
      indexSet.add(Number(m[1]))
    }
  }

  const indices = Array.from(indexSet).sort((a, b) => a - b)

  if (indices.length === 0) {
    log('未找到任何需要创建的文件环境变量 (例如 \'WRITE_FILE_0_PATH\')。')
    return
  }

  for (const index of indices) {
    const prefix = `WRITE_FILE_${index}_`
    const filePath = process.env[`${prefix}PATH`]

    if (!filePath) {
      log(`[警告] 索引 %d 缺少 PATH，已跳过。`, index)
      continue
    }

    const encoding = (process.env[`${prefix}ENCODING`] || 'utf8').toLowerCase()

    if (!(['ascii', 'utf8', 'utf-8', 'utf16le', 'utf-16le', 'ucs2', 'ucs-2', 'base64', 'base64url', 'latin1', 'binary', 'hex']).includes(encoding)) {
      log(`[警告] 不支持的编码方式 '%s'，已跳过文件 '%s'。`, encoding, filePath)
      continue
    }
    let content = process.env[`${prefix}CONTENT`]
    if (content === undefined) {
      const contentChunks: string[] = []
      let chunkIndex = 0
      while (true) {
        const chunk = process.env[`${prefix}CONTENT_${chunkIndex}`]
        if (chunk === undefined) {
          break
        }
        contentChunks.push(chunk)
        chunkIndex++
      }

      if (contentChunks.length > 0) {
        content = contentChunks.join('')
      }
    }

    if (content === undefined) {
      log(`[警告] 找到文件路径 '%s' 但缺少内容 (缺少 %s)，已跳过。`, filePath, `${prefix}CONTENT`)
      continue
    }

    log(`正在处理文件索引 %d: '%s' (编码: %s)`, index, filePath, encoding)

    try {
      const parentDir = path.dirname(filePath)
      if (parentDir && parentDir !== '.') {
        fs.mkdirSync(parentDir, { recursive: true })
      }

      const bufferContent = Buffer.from(content, encoding as BufferEncoding)
      log(`${JSON.stringify(fs.readdirSync('./'), null, 2)}`)
      fs.rmSync(filePath, { force: true })
      fs.writeFileSync(filePath, bufferContent)

      log(`  -> 文件 '%s' 已成功创建。`, filePath)
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log(`[错误] 创建文件 '%s' 时出错: %s`, filePath, message)
    }
  }
}

loadFilesFromEnvSync()
