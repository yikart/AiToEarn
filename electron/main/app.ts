/*
 * @Author: nevin
 * @Date: 2025-01-24 16:33:22
 * @LastEditTime: 2025-03-18 20:53:15
 * @LastEditors: nevin
 * @Description:
 */
import { Module } from './core/decorators';
import { AccountModule } from './account/module';
import { initSqlite3Db } from '../db';
import { PublishModule } from './publish/module';
import { UserModule } from './user/module';
import { BackupModule } from './backup/module';
import { TestModule } from './test/module';
import { ToolsModule } from './tools/module';
import { AppController } from './controller';
import { AppService } from './service';
import { ReplyModule } from './reply/module';
import { AutoRunModule } from './autoRun/module';
import { InteractionModule } from './interaction/module';
import { TracingModule } from './tracing/module';
import { sleep } from '../../commont/utils';

@Module({
  imports: [
    ToolsModule,
    UserModule,
    AccountModule,
    PublishModule,
    BackupModule,
    TestModule,
    ReplyModule,
    AutoRunModule,
    InteractionModule,
    TracingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class App {
  constructor() {
    this._init();
  }

  async _init() {
    // 初始化数据库
    await initSqlite3Db();
    this.timeingCheckAccount();
  }

  // 轮询检测账户有效性
  async timeingCheckAccount() {
    return new Promise(async () => {
      while (true) {
        // TODO : 轮询检测账户有效性

        // 等待24小时执行，如果用户没有关闭应用
        await sleep(3600000 * 24);
      }
    });
  }
}

export default App;
