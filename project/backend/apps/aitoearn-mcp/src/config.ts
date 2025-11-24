import { resolve } from 'node:path'
import { program } from 'commander'
import { fileLoader, selectConfig, TypedConfigModule } from 'nest-typed-config'
import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { mongodbConfigSchema } from './libs/mongodb/mongodb.config'

export const s3ConfigSchema = z.object({
  region: z.string(),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  bucketName: z.string(),
  endpoint: z.string(),
  signExpires: z.number().default(5 * 60).describe('sign expires in seconds'),
})

export class S3Config extends createZodDto(s3ConfigSchema) {}

const logLevel = z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])

export const cloudWatchLoggerConfig = z.object({
  enable: z.boolean().default(false),
  level: logLevel.default('debug'),
  region: z.string(),
  group: z.string(),
  stream: z.string().optional(),
  entity: z.object({
    keyAttributes: z.record(z.string(), z.string()).optional(),
    attributes: z.record(z.string(), z.string()).optional(),
  }).optional(),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
})

export const consoleLoggerConfig = z.object({
  enable: z.boolean().default(true),
  level: logLevel.default('info'),
  singleLine: z.boolean().default(false),
  translateTime: z.boolean().default(true),
})

export const loggerConfig = z.object({
  cloudWatch: cloudWatchLoggerConfig.optional(),
  console: consoleLoggerConfig.optional(),
})

export const baseConfig = z.object({
  globalPrefix: z.string().optional(),
  port: z.number().int().default(3000),
  enableBadRequestDetails: z.boolean().default(false),
  logger: loggerConfig.optional(),
})

export const appConfigSchema = z.object({
  ...baseConfig.shape,
  mongodb: mongodbConfigSchema,
  awsS3: s3ConfigSchema,
  environment: z.string().default('development'),
  enableConfigLogging: z.boolean().default(false),
})

export class ServiceConfig extends createZodDto(appConfigSchema) {}
export const configModule = TypedConfigModule.forRoot({
  schema: ServiceConfig,
  validate(config) {
    const result = appConfigSchema.safeParse(config)
    return result.success
      ? result.data
      : (() => {
          throw new Error(`Configuration is not valid:\n${result.error.message}\n`)
        })()
  },
  load: fileLoader({
    absolutePath: resolve(
      process.cwd(),
      program
        .requiredOption('-c --config <config>', 'config path')
        .parse(process.argv)
        .opts()['config'],
    ),
  }),
})

export const config = selectConfig(configModule, ServiceConfig)
