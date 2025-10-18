import { MailerModule } from '@nestjs-modules/mailer'
import { DynamicModule, Module } from '@nestjs/common'
import { MailConfig } from './mail.config'
import { MailService } from './mail.service'

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
