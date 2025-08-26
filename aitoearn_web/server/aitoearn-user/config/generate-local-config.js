#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')

/**
 * 深度合并两个对象，local 对象中的值优先
 * @param {object} dev - dev.config.js 的配置对象
 * @param {object} local - local.config.js 的配置对象
 * @returns {object} 合并后的配置对象
 */
function deepMerge(dev, local) {
  const result = { ...dev }

  for (const key in local) {
    if (local.hasOwnProperty(key)) {
      if (typeof local[key] === 'object' && local[key] !== null && !Array.isArray(local[key])) {
        // 如果是对象，递归合并
        result[key] = deepMerge(dev[key] || {}, local[key])
      }
      else {
        // 如果是基本类型或数组，local 优先
        result[key] = local[key]
      }
    }
  }

  return result
}

/**
 * 将对象转换为格式化的 JavaScript 代码字符串
 * @param {object} obj - 要转换的对象
 * @param {number} indent - 缩进级别
 * @returns {string} 格式化的 JavaScript 代码
 */
function objectToString(obj, indent = 0) {
  const spaces = '  '.repeat(indent)
  const entries = []

  for (const [key, value] of Object.entries(obj)) {
    let valueStr

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      valueStr = `{\n${objectToString(value, indent + 1)}\n${spaces}  }`
    }
    else if (Array.isArray(value)) {
      if (value.length === 0) {
        valueStr = '[]'
      }
      else {
        const arrayItems = value.map((v) => {
          if (typeof v === 'string') {
            return `'${v}'`
          }
          else if (typeof v === 'object' && v !== null) {
            return JSON.stringify(v)
          }
          else {
            return String(v)
          }
        })
        valueStr = `[${arrayItems.join(', ')}]`
      }
    }
    else if (typeof value === 'string') {
      valueStr = `'${value}'`
    }
    else if (typeof value === 'boolean') {
      valueStr = String(value)
    }
    else if (typeof value === 'number') {
      valueStr = String(value)
    }
    else {
      valueStr = String(value)
    }

    entries.push(`${spaces}  ${key}: ${valueStr}`)
  }

  return entries.join(',\n')
}

/**
 * 生成 local config 文件
 */
function generateLocalConfig() {
  const configDir = __dirname
  const devConfigPath = path.join(configDir, 'dev.config.js')
  const localConfigPath = path.join(configDir, 'local.config.js')

  try {
    console.log('📖 正在读取 dev.config.js...')

    // 读取 dev.config.js
    if (!fs.existsSync(devConfigPath)) {
      console.error('❌ dev.config.js 文件不存在')
      process.exit(1)
    }

    const devConfig = require(devConfigPath)

    // 读取现有的 local.config.js（如果存在）
    let localConfig = {}
    if (fs.existsSync(localConfigPath)) {
      console.log('📖 正在读取现有的 local.config.js...')
      localConfig = require(localConfigPath)
    }
    else {
      console.log('📝 local.config.js 不存在，将创建新文件')
    }

    // 合并配置
    console.log('🔧 正在合并配置...')
    const mergedConfig = deepMerge(devConfig, localConfig)

    // 生成新的 local.config.js 内容
    const configContent = `module.exports = {\n${objectToString(mergedConfig, 0)}\n};\n`

    // 写入文件
    fs.writeFileSync(localConfigPath, configContent, 'utf8')

    console.log('✅ local.config.js 已成功生成/更新')
    console.log(`📄 文件路径: ${localConfigPath}`)
  }
  catch (error) {
    console.error('❌ 生成 local.config.js 时发生错误:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  generateLocalConfig()
}

module.exports = {
  generateLocalConfig,
  deepMerge,
  objectToString,
}
