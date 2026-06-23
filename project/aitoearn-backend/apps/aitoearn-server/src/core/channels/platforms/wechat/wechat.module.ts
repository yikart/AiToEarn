import type { DynamicModule } from '@nestjs/common'
import { Module } from '@nestjs/common'
import { WeChatChannelsModule } from './wechat-channels/wechat-channels.module'
import { WeChatOfficialModule } from './wechat-official/wechat-official.module'
import { WechatConfig } from './wechat.config'
import { WeChatService } from './wechat.service'

/**
 * Root WeChat module.
 *
 * Accepts the full WeChat config (official + channels) via `forRoot()`,
 * imports sub-modules with their respective sub-configs, and provides
 * shared services (WeChatService).
 *
 * Registers two platform integrations:
 * - AccountType.WeChatOfficial (auth + publish)
 * - AccountType.WeChatChannels (work)
 */
@Module({})
export class WechatModule {
  static forRoot(config: WechatConfig | undefined): DynamicModule {
    if (!config) {
      return { module: WechatModule }
    }

    return {
      module: WechatModule,
      imports: [
        WeChatOfficialModule.forRoot(config.official, config),
        WeChatChannelsModule.forRoot(config.channels, config),
      ],
      providers: [
        { provide: WechatConfig, useValue: config },
        WeChatService,
      ],
      exports: [
        WeChatService,
        WeChatOfficialModule,
        WeChatChannelsModule,
      ],
    }
  }
}
