import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createZodDto, ResponseCode } from '@yikart/common'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { ConfigEditorConfig } from './config-editor.config'
import { ConfigEditorService } from './config-editor.service'
import { ConfigFileFormat } from './config-editor.vo'

const configSchema = z.object({
  name: z.string(),
  count: z.number().int(),
})

function createConfig(filePath: string) {
  return {
    meta: {
      configPath: filePath,
    },
  }
}

describe('configEditorService', () => {
  let workspace: string

  beforeEach(async () => {
    workspace = await mkdtemp(join(tmpdir(), 'config-editor-'))
  })

  afterEach(async () => {
    await rm(workspace, { recursive: true, force: true })
  })

  it('读取 yaml 配置文件并返回结构化配置', async () => {
    const filePath = join(workspace, 'config.yaml')
    await writeFile(filePath, 'name: demo\ncount: 1\n', 'utf-8')

    const service = new ConfigEditorService(new ConfigEditorConfig({
      schema: configSchema,
      config: createConfig(filePath),
    }))

    await expect(service.getConfig()).resolves.toEqual({
      config: {
        name: 'demo',
        count: 1,
      },
      format: ConfigFileFormat.Yaml,
    })
  })

  it('读取 json 配置文件并返回结构化配置', async () => {
    const filePath = join(workspace, 'config.json')
    await writeFile(filePath, '{ "name": "demo", "count": 1 }\n', 'utf-8')

    const service = new ConfigEditorService(new ConfigEditorConfig({
      schema: configSchema,
      config: createConfig(filePath),
    }))

    await expect(service.getConfig()).resolves.toEqual({
      config: {
        name: 'demo',
        count: 1,
      },
      format: ConfigFileFormat.Json,
    })
  })

  it('保存 json 时由后端序列化结构化配置', async () => {
    const filePath = join(workspace, 'config.json')
    const ConfigDto = createZodDto(configSchema)

    const service = new ConfigEditorService(new ConfigEditorConfig({
      schema: ConfigDto,
      config: createConfig(filePath),
    }))

    await service.saveConfig({
      name: 'saved',
      count: 2,
    })

    await expect(readFile(filePath, 'utf-8')).resolves.toBe('{\n  "name": "saved",\n  "count": 2\n}\n')
  })

  it('保存 yaml 时由后端序列化结构化配置', async () => {
    const filePath = join(workspace, 'config.yaml')

    const service = new ConfigEditorService(new ConfigEditorConfig({
      schema: configSchema,
      config: createConfig(filePath),
    }))

    await service.saveConfig({
      name: 'saved',
      count: 3,
    })

    await expect(readFile(filePath, 'utf-8')).resolves.toBe('name: saved\ncount: 3\n')
  })

  it('校验失败时不会写入配置文件', async () => {
    const filePath = join(workspace, 'config.json')
    const originalContent = '{ "name": "original", "count": 1 }\n'
    await writeFile(filePath, originalContent, 'utf-8')

    const service = new ConfigEditorService(new ConfigEditorConfig({
      schema: configSchema,
      config: createConfig(filePath),
    }))

    await expect(service.saveConfig({
      name: 'bad',
      count: 'wrong',
    }))
      .rejects
      .toMatchObject({
        code: ResponseCode.ConfigEditorValidationFailed,
      })
    await expect(readFile(filePath, 'utf-8')).resolves.toBe(originalContent)
  })

  it('拒绝不支持的配置文件扩展名', async () => {
    const service = new ConfigEditorService(new ConfigEditorConfig({
      schema: configSchema,
      config: createConfig(join(workspace, 'config.txt')),
    }))

    await expect(service.saveConfig({
      name: 'demo',
      count: 1,
    }))
      .rejects
      .toMatchObject({
        code: ResponseCode.ConfigEditorUnsupportedFormat,
      })
  })
})
