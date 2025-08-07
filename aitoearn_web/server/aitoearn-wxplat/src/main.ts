import { join } from 'node:path'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import * as bodyParser from 'body-parser'
import z from 'zod/v4'
import { config } from '@/config'
import { AppModule } from './app.module'

// 设置zod的国际化
z.config(z.locales.zhCN())

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  app.use(bodyParser.text({ type: 'application/xml' }))
  app.use(bodyParser.text({ type: 'text/xml' }))

  app.setBaseViewsDir(join(__dirname, 'views'))
  app.useStaticAssets(join(__dirname, 'public'))
  app.setViewEngine('hbs');

  await app.listen(config.port, () => {
    Logger.log(`---(^_^) nats server start---`)
    Logger.log(
      `---(^_^) http server start--- http://localhost:${config.port}`,
    )
  })
}
bootstrap()
