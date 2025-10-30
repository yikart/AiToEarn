import {
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  joinPathFragments,
  names,
  Tree,
} from '@nx/devkit'
import { AppGeneratorSchema } from './schema'

interface NormalizedSchema extends AppGeneratorSchema {
  projectName: string
  projectRoot: string
  projectDirectory: string
}

function normalizeOptions(
  tree: Tree,
  options: AppGeneratorSchema,
): NormalizedSchema {
  const name = names(options.name).fileName
  const projectDirectory = name
  const projectName = projectDirectory.replace(/\//g, '-')
  const { appsDir } = getWorkspaceLayout(tree)
  const projectRoot = joinPathFragments(appsDir, projectDirectory)

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory: name,
  }
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    template: '', // EJS removes this
  }

  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'),
    options.projectRoot,
    templateOptions,
  )
}

export default async function (tree: Tree, options: AppGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options)

  addFiles(tree, normalizedOptions)

  await formatFiles(tree)

  return () => {
    console.log(`✅ Application "${normalizedOptions.projectName}" has been generated successfully!`)
    console.log(`📁 Location: ${normalizedOptions.projectRoot}`)
    console.log(`🚀 To serve the application, run: pnpm nx serve ${normalizedOptions.projectName}`)
    console.log(`🏗️  To build the application, run: pnpm nx build ${normalizedOptions.projectName}`)
  }
}
