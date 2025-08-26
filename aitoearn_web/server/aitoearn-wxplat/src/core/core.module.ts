import { Module } from '@nestjs/common';
import { TestModule } from './test/test.module';
import { WxPlatModule } from './wxPlat/wxPlat.module';

@Module({
  imports: [
    TestModule,
    WxPlatModule,
  ],
  providers: [],
})
export class CoreModule {}
