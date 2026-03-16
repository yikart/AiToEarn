import { MailerModule } from '@nestjs-modules/mailer'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import { DynamicModule, Global, Module } from '@nestjs/common'
import { MailConfig } from './mail.config'
import { MailService } from './mail.service'

@Global()
@Module({})
export class MailModule {
  static forRoot(config: MailConfig): DynamicModule {
    return {
      module: MailModule,
      imports: [
        MailerModule.forRoot({
          ...config,
          template: {
            dir: config.template.dir,
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        }),
      ],
      providers: [
        { provide: MailConfig, useValue: config },
        MailService,
      ],
      exports: [MailService],
    }
  }
}
