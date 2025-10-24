import { startApplication } from '@yikart/common'
import { AppModule } from './app.module'
import { config } from './config'

startApplication(AppModule, config, {
  setupApp(app) {
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      preflightContinue: false,
      optionsSuccessStatus: 200,
    })
  },
})
