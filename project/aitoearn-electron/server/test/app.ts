import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';
import { setupTestData } from './setupTestData';
import { WeChatPayModule } from 'nest-wechatpay-node-v3';
import { mockWxPayModule } from './mocks/wx.mock';

export async function initApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideModule(WeChatPayModule)
    .useModule(mockWxPayModule.module)
    .compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  // 初始化测试数据
  await setupTestData(app);

  return app;
}
