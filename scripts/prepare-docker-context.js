#!/usr/bin/env zx

import { $, chalk, fs, path } from 'zx'

/**
 * 为指定应用准备 Docker 构建上下文
 * @param {string} appName - 应用名称
 * @param {string} outputDir - 输出目录
 */
async function prepareDockerContext(appName, outputDir = 'dist/docker-context') {
  console.log(chalk.blue(`🚀 准备 ${appName} 的 Docker 构建上下文...`))

  // 1. 获取项目依赖图
  const projectGraph = await getProjectDependencies(appName)

  // 2. 创建输出目录
  const contextDir = path.join(outputDir, appName)
  await fs.ensureDir(contextDir)

  // 3. 复制应用和依赖的构建产物
  await copyBuildArtifacts(projectGraph, contextDir)

  // 4. 生成迷你 Monorepo 的配置文件
  await generateMiniMonorepoConfig(projectGraph, contextDir)

  console.log(chalk.green(`✅ Docker 构建上下文已准备完成: ${contextDir}`))
  return contextDir
}

/**
 * 获取项目依赖图
 */
async function getProjectDependencies(appName) {
  console.log(chalk.yellow(`📊 分析 ${appName} 的依赖关系...`))

  // 使用 Nx 获取项目图
  await $`npx nx graph --file=temp-graph.json`
  const graph = await fs.readJson('temp-graph.json')

  // 递归获取所有依赖
  const dependencies = new Set([appName])
  const queue = [appName]

  while (queue.length > 0) {
    const current = queue.shift()
    const projectDeps = graph.dependencies[current] || []

    for (const dep of projectDeps) {
      if (dep.target && (dep.target.startsWith('@') || dep.target.startsWith('libs/'))) {
        const depName = dep.target.replace('libs/', '').replace('@my-org/', '')
        if (!dependencies.has(depName)) {
          dependencies.add(depName)
          queue.push(depName)
        }
      }
    }
  }

  // 清理临时文件
  await fs.remove('temp-graph.json')

  console.log(chalk.green(`📦 发现依赖: ${Array.from(dependencies).join(', ')}`))
  return Array.from(dependencies)
}

/**
 * 复制构建产物
 */
async function copyBuildArtifacts(projects, contextDir) {
  console.log(chalk.yellow('📁 复制构建产物...'))

  for (const project of projects) {
    const isApp = !project.includes('/')
    const sourcePath = isApp
      ? `dist/apps/${project}`
      : `dist/libs/${project}`

    const targetPath = isApp
      ? path.join(contextDir, 'apps', project)
      : path.join(contextDir, 'libs', project)

    if (await fs.pathExists(sourcePath)) {
      await fs.copy(sourcePath, targetPath)
      console.log(chalk.gray(`  ✓ ${sourcePath} -> ${targetPath}`))
    }
    else {
      console.log(chalk.red(`  ✗ 构建产物不存在: ${sourcePath}`))
      console.log(chalk.yellow(`    提示: 请先运行 'npx nx build ${project}'`))
    }
  }
}

/**
 * 生成迷你 Monorepo 配置
 */
async function generateMiniMonorepoConfig(projects, contextDir) {
  console.log(chalk.yellow('⚙️  生成迷你 Monorepo 配置...'))

  // 1. 复制根目录配置文件
  const rootFiles = [
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    '.npmrc',
  ]

  for (const file of rootFiles) {
    if (fs.pathExists(file)) {
      await fs.copy(file, path.join(contextDir, file))
      console.log(chalk.gray(`  ✓ 复制配置文件: ${file}`))
    }
  }

  // 2. 生成简化的 package.json
  const rootPackage = await fs.readJson('package.json')
  const miniPackage = {
    name: rootPackage.name,
    version: rootPackage.version,
    private: true,
    workspaces: [],
    dependencies: {},
    devDependencies: {},
  }

  // 3. 收集工作区包信息
  for (const project of projects) {
    const isApp = !project.includes('/')
    const packagePath = isApp
      ? `apps/${project}/package.json`
      : `libs/${project}/package.json`

    if (await fs.pathExists(packagePath)) {
      const pkg = await fs.readJson(packagePath)

      // 添加到工作区
      const workspacePath = isApp ? `apps/${project}` : `libs/${project}`
      miniPackage.workspaces.push(workspacePath)

      // 收集生产依赖
      Object.assign(miniPackage.dependencies, pkg.dependencies || {})

      console.log(chalk.gray(`  ✓ 添加工作区: ${workspacePath}`))
    }
  }

  await fs.writeJson(path.join(contextDir, 'package.json'), miniPackage, { spaces: 2 })

  // 4. 生成 pnpm-workspace.yaml
  const yaml = `packages:\n${miniPackage.workspaces.map(ws => `  - "${ws}"`).join('\n')}\n`
  await fs.writeFile(path.join(contextDir, 'pnpm-workspace.yaml'), yaml)

  console.log(chalk.green('✅ 迷你 Monorepo 配置生成完成'))
}

// CLI 接口
if (process.argv[2]) {
  const appName = process.argv[2]
  const outputDir = process.argv[3] || 'dist/docker-context'

  try {
    await prepareDockerContext(appName, outputDir)
  }
  catch (error) {
    console.error(chalk.red('❌ 准备 Docker 上下文失败:'), error)
    process.exit(1)
  }
}
else {
  console.log(chalk.red('❌ 请指定应用名称'))
  console.log('用法: node prepare-docker-context.js <app-name> [output-dir]')
  console.log('示例: node prepare-docker-context.js aitoearn-ai')
  process.exit(1)
}
