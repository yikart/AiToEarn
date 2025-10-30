#!/usr/bin/env node
import { appendFileSync, existsSync, readFileSync } from 'node:fs'
import { Command } from 'commander'

const program = new Command()

program
  .name('env-builder')
  .description('一个将文件转换为分块环境变量的CLI工具')
  .version('1.0.0')
  .description('添加一个文件并将其转换为环境变量')
  .argument('<index>', '文件索引 (从0开始的整数)')
  .argument('<filePath>', '要转换的文件的路径')
  .option('-o, --output <file>', '将环境变量追加到指定文件 (默认为输出到终端)')
  .option('-c, --chunk-size <number>', '每个内容块的最大字符数', 50000)
  .option('-j, --json', '以 JSON 格式输出环境变量')
  .option('-t, --target-path <path>', '目标环境中的文件路径 (默认使用源文件路径)')
  .action(async (index, filePath, options) => {
    console.log(`开始处理文件: ${filePath} (索引: ${index})`)

    const fileIndex = Number.parseInt(index, 10)
    const chunkSize = Number.parseInt(options.chunkSize, 10)

    if (Number.isNaN(fileIndex) || Number.isNaN(chunkSize)) {
      console.error('错误: 文件索引和块大小必须是数字。')
      process.exit(1)
    }

    if (!existsSync(filePath)) {
      console.error(`错误: 文件 '${filePath}' 不存在。`)
      process.exit(1)
    }

    const prefix = `WRITE_FILE_${fileIndex}_`
    const envVars = {}

    // 统一使用 envVars 存储环境变量
    const pathKey = `${prefix}PATH`
    const encodingKey = `${prefix}ENCODING`

    // 使用目标路径或源文件路径
    const targetPath = options.targetPath || filePath
    envVars[pathKey] = targetPath
    envVars[encodingKey] = 'base64'

    if (options.targetPath) {
      console.log(`  - 目标路径: ${targetPath}`)
    }

    const fileBuffer = readFileSync(filePath)
    const base64Content = fileBuffer.toString('base64')

    console.log(`  - 文件大小: ${fileBuffer.length} 字节`)
    console.log(`  - Base64 编码后长度: ${base64Content.length} 字符`)

    let chunkIndex = 0
    for (let i = 0; i < base64Content.length; i += chunkSize) {
      const chunk = base64Content.substring(i, i + chunkSize)
      const chunkKey = `${prefix}CONTENT_${chunkIndex}`
      envVars[chunkKey] = chunk
      chunkIndex++
    }

    console.log(`  - 内容被分割为 ${chunkIndex} 个块`)

    const exportedVarsCount = 2 + chunkIndex

    // 根据选项决定输出格式
    let outputString
    if (options.json) {
      const jsonOutput = {
        env_vars: envVars,
      }
      outputString = JSON.stringify(jsonOutput, null, 2)
    }
    else {
      const envLines = []
      const displayPath = options.targetPath ? `${filePath} -> ${options.targetPath}` : filePath
      envLines.push(`\n# --- 文件索引 ${fileIndex}: ${displayPath} ---`)

      for (const [key, value] of Object.entries(envVars)) {
        envLines.push(`export ${key}="${value}"`)
      }

      envLines.push('')
      outputString = envLines.join('\n')
    }

    // 统一输出处理
    if (options.output) {
      appendFileSync(options.output, outputString + (options.json ? '\n' : ''))
      const formatType = options.json ? 'JSON 格式' : ''
      console.log(`成功将 ${exportedVarsCount} 条环境变量${formatType ? `以 ${formatType}` : ''}追加到文件: ${options.output}`)
    }
    else {
      console.log(options.json ? outputString : outputString.trim())
    }
  })

program.parse(process.argv)
