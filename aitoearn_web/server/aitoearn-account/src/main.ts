import { NestApplication, NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { NestExpressApplication } from '@nestjs/platform-express'
import { Logger } from 'nestjs-pino'
import z from 'zod/v4'
import { config } from '@/config'
import { AppModule } from './app.module'

// 设置zod的国际化
z.config(z.locales.zhCN())

async function bootstrap() {
  const app = await NestFactory.create<
    NestApplication & NestExpressApplication
  >(AppModule)
  app.useLogger(app.get(Logger))
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      name: config.nats.name,
      servers: config.nats.servers,
      user: config.nats.user,
      pass: config.nats.pass,
    },
  }, {
    inheritAppConfig: true,
  })
  await app.startAllMicroservices()

  // if (config.docs?.enabled) {
  //   const asyncApiOptions = new AsyncApiDocumentBuilder()
  //     .setTitle('哎呦赚-user')
  //     .setDescription('哎呦赚user微服务接口')
  //     .setVersion('1.0')
  //     .setDefaultContentType('application/json')
  //     .addServer('nats', {
  //       url: config.nats.servers[0],
  //       protocol: 'nats',
  //     })
  //     .build()

  //   const asyncapiDocument = AsyncApiModule.createDocument(
  //     app,
  //     asyncApiOptions,
  //   )
  //   await AsyncApiModule.setup(config.docs.path, app, asyncapiDocument)
  // }

  await app.listen(config.port, () => {
    // 获取文件package.json里的版本号的值
    // Logger.log(`---(^_^) nats server start---: ${name}[${version}]`)
    // Logger.log(
    //   `---(^_^) http server start---: ${name}[${version}]-- http://localhost:${config.port}`,
    // )
    // if (config.docs?.enabled) {
    //   Logger.log(
    //     `---(^_^) nats docs start---: ${name}[${version}]-- http://localhost:${config.port}${config.docs.path}`,
    //   )
    // }
  })
}
bootstrap()
