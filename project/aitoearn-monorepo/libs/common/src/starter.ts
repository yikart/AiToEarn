import type { DynamicModule, Provider, Type } from '@nestjs/common'
import type { NestApplication } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface'
import type { Request, Response } from 'express'
import type { StreamEntry } from 'pino'
import type { BaseConfig } from './config'
import { HttpStatus, Logger, Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE, NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
import { LoggerModule, Logger as PinoLogger } from 'nestjs-pino'
import pino from 'pino'
import { z } from 'zod'
import { GlobalExceptionFilter } from './filters'
import { PropagationInterceptor, ResponseInterceptor } from './interceptors'
import { CloudWatchLogger, ConsoleLogger, FeishuLogger } from './loggers'
import { ZodValidationPipe } from './pipes'
import { patchNestJsSwagger, zodToJsonSchemaOptions } from './utils'
import './utils/load-file-from-env.util'

z.config(z.locales.zhCN())

patchNestJsSwagger()

const logger = new Logger('Bootstrap')

@Module({})
class RootModule {
  static setup(args: Omit<DynamicModule, 'module'>): DynamicModule {
    return {
      module: RootModule,
      ...args,
    }
  }
}

export interface StartApplicationOptions {
  setupOpenapi?: (builder: DocumentBuilder) => DocumentBuilder
  setupApp?: (app: NestApplication) => void
}
export async function startApplication(Module: Type<unknown>, config: BaseConfig, options: StartApplicationOptions = {}) {
  if (config.enableConfigLogging) {
    logger.log(JSON.stringify(config, null, 2))
  }
  const loggers: StreamEntry[] = []

  if (config.logger?.console?.enable) {
    loggers.push({
      level: config.logger.console.level,
      stream: new ConsoleLogger(config.logger.console),
    })
  }

  if (config.logger?.cloudWatch?.enable) {
    loggers.push({
      level: config.logger.cloudWatch.level,
      stream: new CloudWatchLogger(config.logger.cloudWatch),
    })
  }

  if (config.logger?.feishu?.enable) {
    loggers.push({
      level: config.logger.feishu.level,
      stream: new FeishuLogger(config.logger.feishu),
    })
  }

  const imports: DynamicModule[] = [
    LoggerModule.forRoot({
      pinoHttp: [
        {
          level: 'trace',
        },
        pino.multistream(loggers),
      ],
    }),
  ]
  const providers: Provider[] = [
    /**
     * 传播上下文
     */
    {
      provide: APP_INTERCEPTOR,
      useClass: PropagationInterceptor,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useValue: new GlobalExceptionFilter({
        returnBadRequestDetails: config.enableBadRequestDetails,
      }),
    },
  ]

  const app = await NestFactory.create<
    NestApplication & NestExpressApplication
  >(RootModule.setup({
    imports: [...imports, Module],
    providers,
  }), {
    cors: true,
  })

  app.useLogger(app.get(PinoLogger))

  // setupNatsPattern(app.get(ModulesContainer), new MetadataScanner(), config.nats.prefix)
  // setupNatsPattern(app.get(ModulesContainer), new MetadataScanner())

  // app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.NATS,
  //   options: {
  //     name: config.nats.name,
  //     servers: config.nats.servers,
  //     user: config.nats.user,
  //     pass: config.nats.pass,
  //   },
  // }, {
  //   inheritAppConfig: true,
  // })

  if (config.globalPrefix)
    app.setGlobalPrefix(config.globalPrefix, { exclude: ['/'] })

  if (options.setupApp) {
    options.setupApp(app)
  }

  if (config.openapi?.enable) {
    const builder = new DocumentBuilder()
      .setTitle(config.openapi.title)
      .setDescription(config.openapi.description)
      .setOpenAPIVersion('3.0.0')

    if (options.setupOpenapi) {
      options.setupOpenapi(builder)
    }

    const openApiDocument = SwaggerModule.createDocument(
      app,
      builder.build(),
    )

    if (openApiDocument.components?.schemas) {
      const zodSchemas = z.toJSONSchema(z.globalRegistry, { ...zodToJsonSchemaOptions, io: 'input' }).schemas
      Object.keys(zodSchemas).forEach((key) => {
        const schema = zodSchemas[key]
        delete schema.$id
      })
      openApiDocument.components.schemas = {
        ...openApiDocument.components.schemas,
        ...zodSchemas as Record<string, SchemaObject>,
      }
    }
    app.use(
      `${config.openapi.path}/openapi.json`,
      (_req: Request, res: Response) => { res.json(openApiDocument) },
    )

    app.use(
      config.openapi.path,
      apiReference({
        persistAuth: true,
        content: openApiDocument,
      }),
    )
  }

  app.enableShutdownHooks()

  app.getHttpAdapter().get('/health', (_req, res) => res.status(HttpStatus.OK).send('OK'))

  app.useBodyParser('json', { limit: '50mb' })
  app.useBodyParser('urlencoded', { limit: '50mb', extended: true })
  app.set('query parser', 'extended')

  app.disable('x-powered-by')

  app.enable('trust proxy')

  process.on('uncaughtException', (reason) => {
    logger.error(reason)
  })

  await app.startAllMicroservices()
  await app.listen(config.port, () => {
    logger.log(`app started at port ${config.port}`)
    if (config.openapi?.enable)
      logger.log(`swagger docs: http://localhost:${config.port}${config.openapi.path}`)
  })
}
