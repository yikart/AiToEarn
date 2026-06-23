import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const channelsRoot = resolveChannelsRoot()
const loggerObjectErrorPattern = /logger\.(?:error|warn|fatal)\(\s*\{[\s\S]{0,400}?[,{]\s*(?:error|err|[A-Za-z]+Error)(?:\s*:|\s*[,}])/g
const appExceptionLiteralMessagePattern = /new AppException\([^)\n]*,\s*['"`]/g
const appExceptionLiteralDataPattern = /new AppException\([^)\n]*,\s*\{[^)]{0,500}\b(?:reason|message|detail|error)\s*:\s*['"`]/g

describe('channels error contract', () => {
  it('does not log errors through object fields that bypass pino error handling', () => {
    const violations = listSourceFiles(channelsRoot)
      .flatMap((file) => {
        const content = readFileSync(file, 'utf8')
        return collectMatches(file, content, loggerObjectErrorPattern)
      })

    expect(violations).toEqual([])
  })

  it('does not expose literal messages from AppException in channels', () => {
    const violations = listSourceFiles(channelsRoot)
      .flatMap((file) => {
        const content = readFileSync(file, 'utf8')
        return [
          ...collectMatches(file, content, appExceptionLiteralMessagePattern),
          ...collectMatches(file, content, appExceptionLiteralDataPattern),
        ]
      })

    expect(violations).toEqual([])
  })

  it('does not throw bare Error in channels runtime code', () => {
    const violations = listSourceFiles(channelsRoot)
      .flatMap((file) => {
        const content = readFileSync(file, 'utf8')
        return collectMatches(file, content, /throw new Error\(/g)
      })
      .filter(match => !match.startsWith('platforms/platforms.registry.ts:'))

    expect(violations).toEqual([])
  })
})

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      return listSourceFiles(path)
    }
    if (!name.endsWith('.ts') || name.endsWith('.spec.ts')) {
      return []
    }
    return [path]
  })
}

function collectMatches(file: string, content: string, pattern: RegExp): string[] {
  return Array.from(content.matchAll(pattern), match => `${relative(channelsRoot, file)}:${lineOf(content, match.index ?? 0)}`)
}

function lineOf(content: string, index: number): number {
  return content.slice(0, index).split('\n').length
}

function resolveChannelsRoot(): string {
  const rootFromWorkspace = join(process.cwd(), 'apps/aitoearn-server/src/core/channels')
  if (existsSync(rootFromWorkspace)) {
    return rootFromWorkspace
  }

  return join(process.cwd(), 'src/core/channels')
}
