import { DynamicModule, Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { AitoearnAuthConfig } from './aitoearn-auth.config'
import { AitoearnAuthGuard } from './aitoearn-auth.guard'
import { AitoearnAuthService } from './aitoearn-auth.service'

@Module({})
export class AitoearnAuthModule {
  static forRoot(config: AitoearnAuthConfig): DynamicModule {
    return {
      global: true,
      module: AitoearnAuthModule,
      imports: [
        JwtModule.register({
          secret: config.secret,
          signOptions: { expiresIn: config.expiresIn },
        }),
      ],
      providers: [
        {
          provide: AitoearnAuthConfig,
          useValue: config,
        },
        AitoearnAuthService,
        {
          provide: APP_GUARD,
          useClass: AitoearnAuthGuard,
        },
      ],
      exports: [AitoearnAuthService],
    }
  }
}
