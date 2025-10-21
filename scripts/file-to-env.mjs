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
    const envLines = []

    envLines.push(`\n# --- 文件索引 ${fileIndex}: ${filePath} ---`)

    envLines.push(`export ${prefix}PATH="${filePath}"`)
    envLines.push(`export ${prefix}ENCODING="base64"`)

    const fileBuffer = readFileSync(filePath)
    const base64Content = fileBuffer.toString('base64')

    console.log(`  - 文件大小: ${fileBuffer.length} 字节`)
    console.log(`  - Base64 编码后长度: ${base64Content.length} 字符`)

    let chunkIndex = 0
    for (let i = 0; i < base64Content.length; i += chunkSize) {
      const chunk = base64Content.substring(i, i + chunkSize)
      envLines.push(`export ${prefix}CONTENT_${chunkIndex}="${chunk}"`)
      chunkIndex++
    }

    console.log(`  - 内容被分割为 ${chunkIndex} 个块`)

    envLines.push('')
    const outputString = envLines.join('\n')

    if (options.output) {
      appendFileSync(options.output, outputString)

      const exportedVarsCount = 2 + chunkIndex
      console.log(`成功将 ${exportedVarsCount} 条环境变量追加到文件: ${options.output}`)
    }
    else {
      console.log(outputString.trim())
    }
  })

program.parse(process.argv)
