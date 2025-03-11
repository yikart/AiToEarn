/*
 * @Author: nevin
 * @Date: 2025-01-24 16:33:22
 * @LastEditTime: 2025-02-20 22:11:44
 * @LastEditors: nevin
 * @Description:
 */
import { Module } from './core/decorators';
import { AccountModule } from './account/module';
import { initSqlite3Db } from '../db';
import { PublishModule } from './publish/module';
import { UserModule } from './user/module';
import { BackupModule } from './backup/module';
import { DataCenterModule } from './dataCenter/module';
import { TestModule } from './test/module';
import { ToolsModule } from './tools/module';
import { AppController } from './controller';
import { AppService } from './service';
import { ReplyModule } from './reply/module';

@Module({
  imports: [
    ToolsModule,
    UserModule,
    AccountModule,
    PublishModule,
    BackupModule,
    DataCenterModule,
    TestModule,
    ReplyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class App {
  constructor() {
    initSqlite3Db();
  }
}

export default App;
