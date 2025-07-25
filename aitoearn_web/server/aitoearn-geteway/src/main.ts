import { join } from 'node:path'
import { patchNestJsSwagger } from '@common/utils'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { config } from '@/config'
import { AppModule } from './app.module'

patchNestJsSwagger()

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    preflightContinue: false,
    optionsSuccessStatus: 200,
  })

  app.setGlobalPrefix('api', { exclude: ['/'] }) // 路由添加api开头
  app.useBodyParser('json', { limit: '50mb' })
  app.useBodyParser('urlencoded', { limit: '50mb', extended: true })

  if (config.docs?.enabled) {
    const docConfig = new DocumentBuilder()
      .setTitle('aitoearn-gateway')
      .setDescription(`aitoearn-gateway API`)
      .setVersion('')
      .addBearerAuth()
      .build()

    const document = SwaggerModule.createDocument(app, docConfig, {})
    SwaggerModule.setup(config.docs.path, app, document, {
      customSiteTitle: 'aitoearn-gateway',
      jsonDocumentUrl: `${config.docs.path}/openapi.json`, // 文档JSON
      swaggerOptions: {
        persistAuthorization: true, // 保持登录
      },
    })
  }

  app.useStaticAssets(join(__dirname, '..', 'public'))
  app.setBaseViewsDir(join(__dirname, '..', 'views'))
  app.setViewEngine('ejs')

  await app.listen(config.port)
  Logger.log(`---(^_^) http server start--- http://localhost:${config.port}`)

  if (config.docs?.enabled) {
    Logger.log(
      `---(^_^) swagger docs start--- http://localhost:${config.port}${config.docs.path}`,
    )
  }
}
bootstrap()
