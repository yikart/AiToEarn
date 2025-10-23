import { startApplication } from '@yikart/common'
import { config } from '@/config'
import { AppModule } from './app.module'

startApplication(AppModule, config, {
  setupApp(app) {
    app.setGlobalPrefix('api', { exclude: ['/'] }) // 路由添加api开头
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      preflightContinue: false,
      optionsSuccessStatus: 200,
    })
  },
})
