import { join } from 'node:path'
import { startApplication } from '@yikart/common'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module'
import { config } from './config'

startApplication(AppModule, config, {
  setupApp: (app) => {
    app.enableCors()
    app.use(cookieParser())

    app.setViewEngine('ejs')
    app.setBaseViewsDir(join(__dirname, 'views'))
    app.useStaticAssets(join(__dirname, 'public'))
  },
})
