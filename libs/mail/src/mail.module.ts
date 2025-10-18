import { MailerModule } from '@nestjs-modules/mailer'
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
        MailerModule.forRoot(config),
      ],
      providers: [
        { provide: MailConfig, useValue: config },
        MailService,
      ],
      exports: [MailService],
    }
  }
}
