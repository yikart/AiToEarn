import { join } from 'node:path'
import { startApplication } from '@yikart/common'
import { AppModule } from './app.module'
import { config } from './config'

startApplication(AppModule, config, {
  setupApp: (app) => {
    const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? []
    app.enableCors({
      origin: corsOrigins.length > 0 ? corsOrigins : false,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: false,
    })

    app.setViewEngine('ejs')
    app.setBaseViewsDir(join(__dirname, 'views'))
    app.useStaticAssets(join(__dirname, 'public'))
  },
})
