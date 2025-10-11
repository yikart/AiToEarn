import { WeChatPayModule } from 'nest-wechatpay-node-v3';
import { DynamicModule } from '@nestjs/common';

const mockWxPayService = {
  pay: () => Promise.resolve({}),
  refund: () => Promise.resolve({}),
};

export const mockWxPayModule: DynamicModule = {
  module: WeChatPayModule,
  providers: [
    {
      provide: WeChatPayModule,
      useValue: mockWxPayService,
    },
  ],
  exports: [WeChatPayModule],
};
