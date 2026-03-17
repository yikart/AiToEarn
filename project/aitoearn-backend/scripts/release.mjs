#!/usr/bin/env node
/* eslint-disable no-console */

import { Command } from 'commander'
import { $, chalk, fs, path } from 'zx'

// 默认仓库配置
const DEFAULT_REPO = 'yikart/aitoearn-monorepo'

/**
 * 查找项目路径
 */
async function findProjectPath(projectName) {
  const categories = ['apps', 'tools', 'libs']
  for (const category of categories) {
    const projectPath = path.resolve(category, projectName)
    if (await fs.pathExists(projectPath)) {
      return { category, projectPath }
    }
  }
  return null
}

/**
 * 读取项目配置
 */
async function getProjectConfig(projectName, verbose = false) {
  if (verbose)
    console.info(chalk.yellow(`读取项目配置: ${projectName}...`))

  const projectInfo = await findProjectPath(projectName)
  if (!projectInfo) {
    throw new Error(`找不到项目: ${projectName}，请检查项目名称是否正确`)
  }

  const { category, projectPath } = projectInfo

  // 读取 project.json
  const projectJsonPath = path.join(projectPath, 'project.json')
  let outputPath = `dist/${category}/${projectName}`
  if (await fs.pathExists(projectJsonPath)) {
    const projectJson = JSON.parse(await fs.readFile(projectJsonPath, 'utf-8'))
    if (projectJson.targets?.build?.options?.outputPath) {
      outputPath = projectJson.targets.build.options.outputPath
    }
  }

  // 读取 package.json 获取描述
  const packageJsonPath = path.join(projectPath, 'package.json')
  let description = projectName
  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
    if (packageJson.description) {
      description = packageJson.description
    }
  }

  const config = {
    projectName,
    category,
    projectPath,
    outputPath,
    description,
    zipFile: `${projectName}.zip`,
  }

  if (verbose) {
    console.info(chalk.gray(`  分类: ${category}`))
    console.info(chalk.gray(`  路径: ${projectPath}`))
    console.info(chalk.gray(`  构建输出: ${outputPath}`))
    console.info(chalk.gray(`  描述: ${description}`))
  }

  return config
}

async function getVersion(verbose = false) {
  if (verbose)
    console.info(chalk.yellow('生成版本号...'))

  const result = await $`git rev-parse --short HEAD`
  const version = result.stdout.trim()

  if (verbose)
    console.info(chalk.green(`版本号: ${version}`))

  return version
}

async function buildProject(projectName, _verbose = false) {
  console.info(chalk.blue('📦 Step 1: 构建项目...'))

  try {
    await $`pnpm nx build ${projectName}`
    console.info(chalk.green('✅ 构建完成'))
  }
  catch (error) {
    console.error(chalk.red('❌ 构建失败:'))
    console.error(chalk.red(`  ${error.message}`))
    throw new Error('项目构建失败，脚本终止执行')
  }
}

async function createPackage(config, verbose = false) {
  console.info(chalk.blue('🗜️  Step 2: 创建发布包...'))

  const distPath = path.resolve(config.outputPath)
  const zipPath = path.resolve(config.zipFile)

  // 检查构建产物是否存在
  if (!(await fs.pathExists(distPath))) {
    throw new Error(`构建产物不存在: ${distPath}`)
  }

  // 删除旧的 ZIP 文件
  if (await fs.pathExists(zipPath)) {
    await fs.remove(zipPath)
    if (verbose)
      console.info(chalk.gray(`  删除旧的 ZIP 文件: ${zipPath}`))
  }

  // 创建 ZIP 包
  try {
    await $({ cwd: distPath })`zip -r ${zipPath} .`

    // 检查文件大小
    const stats = await fs.stat(zipPath)
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1)
    console.info(chalk.green(`✅ 包创建完成: ${sizeMB}M`))

    if (verbose) {
      console.info(chalk.gray(`  位置: ${zipPath}`))
      console.info(chalk.gray(`  大小: ${stats.size} bytes`))
    }
  }
  catch (error) {
    console.error(chalk.red('❌ 创建 ZIP 包失败:'))
    console.error(chalk.red(`  ${error.message}`))
    throw error
  }
}

async function getCommitInfo(verbose = false) {
  if (verbose)
    console.info(chalk.yellow('获取 commit 信息...'))

  const shaResult = await $`git rev-parse HEAD`
  const fullSha = shaResult.stdout.trim()

  const msgResult = await $`git log -1 --pretty=%B`
  const message = msgResult.stdout.trim()

  const date = new Date().toISOString()

  if (verbose) {
    console.info(chalk.gray(`  SHA: ${fullSha}`))
    console.info(chalk.gray(`  Message: ${message}`))
    console.info(chalk.gray(`  Date: ${date}`))
  }

  return { fullSha, message, date }
}

async function createRelease(config, version, repo, options = {}) {
  const { verbose = false, dryRun = false } = options

  console.info(chalk.blue('🏷️  Step 3: 创建 GitHub Release...'))

  const tagName = `${config.projectName}-${version}`
  const releaseName = `${config.description} ${version}`
  const { date } = await getCommitInfo(verbose)

  // 检查 tag 是否已存在
  const tagCheckResult = await $`git tag -l ${tagName}`.quiet()
  const tagExists = tagCheckResult.stdout.trim() !== ''

  if (tagExists) {
    console.warn(chalk.yellow(`⚠️  Tag ${tagName} 已存在`))

    // 询问是否删除
    if (!dryRun) {
      console.info(chalk.yellow('删除现有 tag 和 release...'))
      try {
        await $`gh release delete ${tagName} -y`.quiet()
      }
      catch {
        // Release 可能不存在，忽略错误
      }
      await $`git tag -d ${tagName}`
      await $`git push origin :refs/tags/${tagName}`.quiet()
      console.info(chalk.green('✅ 旧 tag 已删除'))
    }
  }

  // 生成 Release Notes
  const releaseNotes = `## ${config.description}

**Commit**: ${version}
**Build Date**: ${date}
`

  if (dryRun) {
    console.info(chalk.yellow('\n[Dry Run] 将要创建的 Release:'))
    console.info(chalk.gray('─'.repeat(60)))
    console.info(chalk.cyan(`Tag: ${tagName}`))
    console.info(chalk.cyan(`Title: ${releaseName}`))
    console.info(chalk.gray('─'.repeat(60)))
    console.info(releaseNotes)
    console.info(chalk.gray('─'.repeat(60)))
    return
  }

  // 创建 Release
  try {
    // 写入临时文件用于 release notes
    const notesFile = 'release-notes.tmp'
    await fs.writeFile(notesFile, releaseNotes)

    await $`gh release create ${tagName} ${config.zipFile} --title ${releaseName} --notes-file ${notesFile}`

    // 删除临时文件
    await fs.remove(notesFile)

    // 获取 release 信息和 asset ID
    const releaseInfo = await $`gh api repos/${repo}/releases/tags/${tagName}`
    const releaseData = JSON.parse(releaseInfo.stdout)
    const asset = releaseData.assets.find(a => a.name === config.zipFile)

    if (!asset) {
      throw new Error('无法找到上传的 asset')
    }

    const assetId = asset.id
    const apiUrl = `https://api.github.com/repos/${repo}/releases/assets/${assetId}`

    console.info(chalk.green('✅ Release 创建成功!\n'))
    console.info(chalk.cyan(`📦 Version: ${version}`))
    console.info(chalk.cyan(`🏷️  Tag: ${tagName}`))
    console.info(chalk.cyan(`🔗 Release URL: https://github.com/${repo}/releases/tag/${tagName}`))
    console.info(chalk.cyan(`📥 Asset ID: ${assetId}`))
    console.info(chalk.cyan(`📥 API URL: ${apiUrl}`))
    console.info(chalk.gray(`   使用方式: curl -L -H "Authorization: token YOUR_TOKEN" -H "Accept: application/octet-stream" "${apiUrl}" -o ${config.zipFile}`))
  }
  catch (error) {
    console.error(chalk.red('❌ 创建 Release 失败:'))
    console.error(chalk.red(`  ${error.message}`))
    throw error
  }
}

async function cleanup(config, verbose = false) {
  if (verbose)
    console.info(chalk.yellow('\n清理临时文件...'))

  const zipPath = path.resolve(config.zipFile)
  if (await fs.pathExists(zipPath)) {
    await fs.remove(zipPath)
    if (verbose)
      console.info(chalk.gray(`  删除: ${zipPath}`))
  }

  if (verbose)
    console.info(chalk.green('✅ 清理完成'))
}

async function releaseProcess(options = {}) {
  const { verbose = false, buildOnly = false, dryRun = false, project, repo = DEFAULT_REPO } = options

  // 参数验证
  if (!project) {
    console.error(chalk.red('❌ 错误: 必须指定项目名称'))
    console.error(chalk.yellow('使用方式: node release.mjs -p <project-name>'))
    console.error(chalk.gray('示例: node release.mjs -p opensource-sync'))
    process.exit(1)
  }

  try {
    // 0. 读取项目配置
    const config = await getProjectConfig(project, verbose)

    // 1. 生成版本号
    const version = await getVersion(verbose)

    // 2. 构建
    await buildProject(config.projectName, verbose)

    // 3. 打包
    await createPackage(config, verbose)

    if (buildOnly) {
      console.info(chalk.green(`\n✅ 构建完成（仅构建模式）`))
      console.info(chalk.gray(`ZIP 文件: ${config.zipFile}`))
      return
    }

    // 4. 创建 Release
    await createRelease(config, version, repo, { verbose, dryRun })

    // 5. 清理
    if (!dryRun) {
      await cleanup(config, verbose)
    }

    console.info(chalk.green('\n✅ 发布流程完成!'))
  }
  catch (error) {
    console.error(chalk.red(`\n❌ 发布失败: ${error.message}`))
    process.exit(1)
  }
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const program = new Command()

  program
    .name('release')
    .description('构建并发布项目到 GitHub Release（支持 monorepo 内的任意项目）')
    .version('1.0.0')
    .requiredOption('-p, --project <name>', '项目名称（如 opensource-sync, apprunner-monitor）')
    .option('-v, --verbose', '显示详细日志', false)
    .option('--build-only', '仅构建和打包，不发布', false)
    .option('--dry-run', '模拟运行，不实际创建 Release', false)
    .option('--repo <owner/name>', 'GitHub 仓库', DEFAULT_REPO)
    .action(async (options) => {
      try {
        await releaseProcess(options)
      }
      catch (error) {
        console.error(chalk.red(`错误: ${error.message}`))
        process.exit(1)
      }
    })

  program.parseAsync(process.argv).catch((error) => {
    console.error(chalk.red(`错误: ${error.message}`))
    process.exit(1)
  })
}

export { buildProject, createPackage, createRelease, getProjectConfig, releaseProcess }
