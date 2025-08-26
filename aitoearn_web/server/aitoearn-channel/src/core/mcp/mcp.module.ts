import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SkKey, SkKeySchema } from '@/libs/database/schema/skKey.schema';
import {
  SkKeyRefAccount,
  SkKeyRefAccountSchema,
} from '@/libs/database/schema/skKeyRefAccount.schema';
import { BilibiliModule } from '../plat/bilibili/bilibili.module';
import { PublishModule } from '../publish/publish.module';
import { BilibiliController } from './bilibili.controller';
import { McpController } from './mcp.controller';
import { PluginController } from './plugin.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SkKey.name, schema: SkKeySchema },
      { name: SkKeyRefAccount.name, schema: SkKeyRefAccountSchema },
    ]),
    BilibiliModule,
    PublishModule,
  ],
  providers: [],
  controllers: [McpController, PluginController, BilibiliController],
  exports: [],
})
export class McpModule {}
