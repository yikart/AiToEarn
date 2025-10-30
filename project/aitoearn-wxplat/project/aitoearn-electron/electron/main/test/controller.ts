/*
 * @Author: nevin
 * @Date: 2025-01-20 22:02:54
 * @LastEditTime: 2025-04-01 18:17:38
 * @LastEditors: nevin
 * @Description: Test test
 */
import { Controller, Icp, Inject } from '../core/decorators';
import { TestService } from './service';
import { EtEvent } from '../../global/event';

@Controller()
export class TestController {
  @Inject(TestService)
  private readonly testService!: TestService;

  /**
   * 测试-抖音登录
   */
  @Icp('ICP_GET_FILE_MATE_INFO')
  async testDouyinVideoLogin(event: Electron.IpcMainInvokeEvent): Promise<any> {
    console.log('---- res ----', 1);
    EtEvent.emit('ET_TRACING_ACCOUNT_ADD', {
      id: 111,
      desc: '添加账户',
    });

    return 1;
  }

  /**
   * 每10秒运行一次
   */
  // @Scheduled('0/10 * * * * *')
  async testScheduleJob(): Promise<any> {
    console.log('---- Scheduled test ----');
  }
}
