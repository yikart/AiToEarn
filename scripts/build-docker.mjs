#!/usr/bin/env node

import { Command } from 'commander'
import { $, chalk, fs, path } from 'zx'

async function cleanOutputDir(contextDir, verbose = false) {
  if (await fs.pathExists(contextDir)) {
    if (verbose)
      console.info(chalk.yellow(`清理输出目录: ${contextDir}`))
    await fs.remove(contextDir)
    if (verbose)
      console.info(chalk.green('输出目录清理完成'))
  }
}

async function prepareContext(projectName, options = {}) {
  const { output = 'tmp/docker-context', verbose = false, contextOnly = false } = options
  const contextDir = path.resolve(output)

  console.info(chalk.blue(`准备 Docker 构建上下文: ${projectName}`))
  if (verbose) {
    console.info(chalk.gray(`输出目录: ${contextDir}`))
    console.info(chalk.gray(`构建 Docker: ${contextOnly ? '否' : '是'}`))
  }

  // 清理输出目录
  await cleanOutputDir(contextDir, verbose)

  const { dependencies: projects, graph } = await getDependencies(projectName, verbose)
  await fs.ensureDir(contextDir)
  if (verbose)
    console.info(chalk.gray(`创建输出目录: ${contextDir}`))

  // 先创建依赖专用的 workspace
  const depsDir = await createDepsWorkspace(projects, graph, contextDir, verbose)

  await copyArtifacts(projects, graph, contextDir, verbose)
  await copyDockerfile(projectName, contextDir, verbose)
  await resetDependencies(projects, contextDir, verbose)
  await generateConfig(projects, graph, contextDir, verbose)
  await copyAssets(contextDir, verbose)

  return {
    projectName,
    outputDir: contextDir,
    depsDir,
    projects,
  }
}

async function getDependencies(appName, verbose = false) {
  if (verbose)
    console.info(chalk.yellow(`分析 ${appName} 的依赖关系...`))

  await $`npx nx graph --file=temp-graph.json`
  const graphData = await fs.readJson('temp-graph.json')
  const graph = graphData.graph

  const dependencies = new Set([appName])
  const queue = [appName]

  while (queue.length > 0) {
    const current = queue.shift()
    const projectDeps = graph.dependencies[current] || []

    for (const dep of projectDeps) {
      if (dep.target) {
        const depName = dep.target
        if (!dependencies.has(depName)) {
          dependencies.add(depName)
          queue.push(depName)
        }
      }
    }
  }

  await fs.remove('temp-graph.json')

  if (verbose)
    console.info(chalk.green(`发现依赖: ${Array.from(dependencies).join(', ')}`))
  return { dependencies: Array.from(dependencies), graph }
}

async function copyArtifacts(projects, graph, contextDir, verbose = false) {
  if (verbose)
    console.info(chalk.yellow('复制构建产物...'))

  const missing = []

  for (const project of projects) {
    const node = graph.nodes[project]
    const isApp = node && node.type === 'app'
    const src = isApp ? `dist/apps/${project}` : `dist/libs/${project}`
    const dest = isApp ? path.join(contextDir, 'apps', project) : path.join(contextDir, 'libs', project)

    if (await fs.pathExists(src)) {
      await fs.copy(src, dest)
      if (verbose)
        console.info(chalk.gray(`  ${src} -> ${dest}`))
    }
    else {
      missing.push({ project, src })
    }
  }

  if (missing.length > 0) {
    console.info(chalk.yellow('发现缺失的构建产物，正在自动构建...'))

    for (const { project, src } of missing) {
      console.info(chalk.blue(`正在构建: ${project}`))

      try {
        await $`npx nx build ${project}`
        console.info(chalk.green(`${project} 构建完成`))

        if (!(await fs.pathExists(src))) {
          throw new Error(`构建完成但产物仍不存在: ${src}`)
        }

        const node = graph.nodes[project]
        const isApp = node && node.type === 'app'
        const dest = isApp ? path.join(contextDir, 'apps', project) : path.join(contextDir, 'libs', project)

        await fs.copy(src, dest)
        if (verbose)
          console.info(chalk.gray(`  ${src} -> ${dest}`))
      }
      catch (error) {
        console.error(chalk.red(`${project} 构建失败:`))
        console.error(chalk.red(`  ${error.message}`))
        throw new Error(`项目 ${project} 构建失败，脚本终止执行`)
      }
    }

    console.info(chalk.green('所有缺失的构建产物已自动构建完成'))
  }
}

async function copyDockerfile(projectName, contextDir, verbose = false) {
  if (verbose)
    console.info(chalk.yellow('复制 Dockerfile...'))

  const appDockerfile = `apps/${projectName}/Dockerfile`
  if (await fs.pathExists(appDockerfile)) {
    await fs.copy(appDockerfile, path.join(contextDir, 'Dockerfile'))
    if (verbose)
      console.info(chalk.gray(`  应用 Dockerfile: ${appDockerfile} -> Dockerfile`))
    return
  }

  const rootDockerfile = 'Dockerfile'
  if (await fs.pathExists(rootDockerfile)) {
    await fs.copy(rootDockerfile, path.join(contextDir, 'Dockerfile'))
    if (verbose)
      console.info(chalk.gray(`  根目录 Dockerfile: ${rootDockerfile} -> Dockerfile`))
    return
  }

  console.warn(chalk.yellow(`警告: 未找到 ${projectName} 的 Dockerfile`))
}

async function createDepsWorkspace(projects, graph, contextDir, verbose = false) {
  if (verbose)
    console.info(chalk.yellow('创建依赖专用 workspace...'))

  const depsDir = path.join(contextDir, 'deps')
  await fs.ensureDir(depsDir)

  // 复制根目录配置文件
  const rootFiles = ['package.json', 'pnpm-workspace.yaml', '.npmrc']
  for (const file of rootFiles) {
    if (await fs.pathExists(file)) {
      await fs.copy(file, path.join(depsDir, file))
      if (verbose)
        console.info(chalk.gray(`  复制配置文件: ${file}`))
    }
  }

  // 为每个项目创建仅包含 package.json 的目录结构
  for (const project of projects) {
    const node = graph.nodes[project]
    const isApp = node && node.type === 'app'
    const srcPkgPath = isApp ? `apps/${project}/package.json` : `libs/${project}/package.json`
    const destDir = isApp ? path.join(depsDir, 'apps', project) : path.join(depsDir, 'libs', project)
    const destPkgPath = path.join(destDir, 'package.json')

    if (await fs.pathExists(srcPkgPath)) {
      await fs.ensureDir(destDir)
      await fs.copy(srcPkgPath, destPkgPath)
      if (verbose)
        console.info(chalk.gray(`  复制 package.json: ${srcPkgPath} -> ${path.relative(contextDir, destPkgPath)}`))
    }
  }

  if (verbose)
    console.info(chalk.green('依赖专用 workspace 创建完成'))

  return depsDir
}

async function buildImage(projectName, contextDir, verbose = false) {
  if (verbose)
    console.info(chalk.yellow(`构建 Docker 镜像: ${projectName}`))

  // 获取当前日期 (YYYYMMDD 格式)
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')

  // 获取 Git 短提交哈希
  const gitHash = await $({ cwd: contextDir })`git rev-parse --short HEAD`
  const shortHash = gitHash.stdout.trim()

  // 生成与 GitHub Actions 一致的标签格式
  const tag = `${date}-${shortHash}`
  const imageName = `${projectName}:${tag}`

  try {
    await $({ cwd: contextDir })`docker build -t ${imageName} .`
    console.info(chalk.green(`Docker 镜像构建完成: ${imageName}`))
  }
  catch (error) {
    console.error(chalk.red(`Docker 镜像构建失败: ${error.message}`))
    throw error
  }
}

async function resetDependencies(projects, contextDir, verbose = false) {
  if (verbose)
    console.info(chalk.yellow('重置工作区依赖版本为 workspace:* 协议...'))

  const packages = new Set()
  for (const project of projects) {
    const appPath = path.join(contextDir, 'apps', project, 'package.json')
    const libPath = path.join(contextDir, 'libs', project, 'package.json')

    if (await fs.pathExists(appPath)) {
      const pkg = await fs.readJson(appPath)
      if (pkg.name)
        packages.add(pkg.name)
    }

    if (await fs.pathExists(libPath)) {
      const pkg = await fs.readJson(libPath)
      if (pkg.name)
        packages.add(pkg.name)
    }
  }

  if (verbose)
    console.info(chalk.gray(`  发现工作区包: ${Array.from(packages).join(', ')}`))

  const processPackage = async (pkgPath) => {
    if (!(await fs.pathExists(pkgPath)))
      return

    const pkg = await fs.readJson(pkgPath)
    let modified = false

    const depTypes = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']

    for (const depType of depTypes) {
      if (pkg[depType]) {
        for (const [name, version] of Object.entries(pkg[depType])) {
          if (packages.has(name) && version !== 'workspace:*') {
            pkg[depType][name] = 'workspace:*'
            modified = true
            if (verbose)
              console.info(chalk.gray(`    ${path.relative(contextDir, pkgPath)}: ${name} -> workspace:*`))
          }
        }
      }
    }

    if (modified) {
      await fs.writeJson(pkgPath, pkg, { spaces: 2 })
    }
  }

  await processPackage(path.join(contextDir, 'package.json'))

  for (const project of projects) {
    await processPackage(path.join(contextDir, 'apps', project, 'package.json'))
    await processPackage(path.join(contextDir, 'libs', project, 'package.json'))
  }

  if (verbose)
    console.info(chalk.green('工作区依赖版本重置完成'))
}

async function copyAssets(contextDir, verbose = false) {
  if (verbose)
    console.info(chalk.yellow('复制 assets 目录...'))

  const assetsDir = 'assets'
  if (await fs.pathExists(assetsDir)) {
    const destPath = path.join(contextDir, 'assets')
    await fs.copy(assetsDir, destPath)
    if (verbose)
      console.info(chalk.gray(`  ${assetsDir} -> ${destPath}`))
    if (verbose)
      console.info(chalk.green('assets 目录复制完成'))
  }
  else if (verbose) {
    console.info(chalk.gray('未找到 assets 目录，跳过'))
  }
}

async function generateConfig(projects, graph, contextDir, verbose = false) {
  if (verbose)
    console.info(chalk.yellow('生成 Monorepo 配置...'))

  const rootFiles = ['package.json', 'pnpm-workspace.yaml', '.npmrc']

  for (const file of rootFiles) {
    if (await fs.pathExists(file)) {
      await fs.copy(file, path.join(contextDir, file))
      if (verbose)
        console.info(chalk.gray(`  复制配置文件: ${file}`))
    }
  }

  await resetDependencies(projects, contextDir, verbose)

  if (verbose)
    console.info(chalk.green('Monorepo 配置生成完成'))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const program = new Command()

  program
    .name('build-docker')
    .description('为 Nx 应用准备 Docker 构建上下文并构建镜像，使用 --context-only 可仅准备上下文')
    .version('1.0.0')
    .argument('<app-name>', '应用名称')
    .option('-o, --output <dir>', '输出目录', 'tmp/docker-context')
    .option('-v, --verbose', '显示详细日志', false)
    .option('--context-only', '仅准备 Docker 上下文，不构建镜像', false)
    .action(async (appName, options) => {
      try {
        const finalOptions = { ...options, contextOnly: options.contextOnly }

        const result = await prepareContext(appName, finalOptions)

        if (!options.contextOnly) {
          await buildImage(result.projectName, result.outputDir, options.verbose)
        }
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
