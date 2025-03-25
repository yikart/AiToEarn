/*
 * @Author: nevin
 * @Date: 2025-01-20 22:02:54
 * @LastEditTime: 2025-03-03 13:45:00
 * @LastEditors: nevin
 * @Description: Test test
 */
import { Controller, Icp, Inject } from '../core/decorators';
import { TestService } from './service';
import { douyinService } from '../../plat/douyin/index';
import { xiaohongshuService } from '../../plat/xiaohongshu/index';
import { shipinhaoService } from '../../plat/shipinhao/index';

const videoPath = 'C:\\Users\\Administrator\\Desktop\\测试用的\\相册.mp4';
const coverPath = 'C:\\Users\\Administrator\\Desktop\\测试用的\\gile.jpg';

@Controller()
export class TestController {
  @Inject(TestService)
  private readonly testService!: TestService;

  /**
   * 测试-抖音登录
   */
  @Icp('ICP_TEST_DOUYIN_LOGIN')
  async testDouyinVideoLogin(event: Electron.IpcMainInvokeEvent): Promise<any> {
    const { success, data } = await douyinService.loginOrView('login');
    if (!data) {
      return {
        cookie: '',
        token: '',
      };
    }

    const { cookie, localStorage } = data;
    return {
      cookie,
      token: localStorage,
    };
  }

  /**
   * 每10秒运行一次
   */
  // @Scheduled('0/10 * * * * *')
  async testScheduleJob(): Promise<any> {
    console.log('---- Scheduled test ----');
  }

  @Icp('ICP_DY_Login')
  async dyLogin(event: Electron.IpcMainInvokeEvent): Promise<any> {
    try {
      const result = await douyinService.loginOrView('login');
      return result;
    } catch (error) {
      console.error('Login process failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  @Icp('ICP_DY_PublishVideoWorkApi')
  async dyBlishVideoWorkApi(event: Electron.IpcMainInvokeEvent): Promise<any> {
    try {
      const result = await douyinService.loginOrView('login');
      return result;
    } catch (error) {
      console.error('Login process failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  @Icp('ICP_DY_GetDashboardFunckApi')
  async dyGetDashboardFunckApi(
    event: Electron.IpcMainInvokeEvent,
    cookies: string,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    try {
      const result = await douyinService.getDashboardFunc(
        cookies,
        startDate,
        endDate,
      );
      return result;
    } catch (error) {
      console.error('getDashboardFunc process failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Publish failed',
      };
    }
  }

  @Icp('ICP_XHS_Login')
  async xhsLogin(event: Electron.IpcMainInvokeEvent): Promise<any> {
    try {
      const result = await xiaohongshuService.loginOrView('login');
      return result;
    } catch (error) {
      console.error('ICP_XHS_publishVideoWorkApi process failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Publish failed',
      };
    }
  }

  @Icp('ICP_XHS_GetDashboardFunckApi')
  async xhsGetDashboardFunckApi(
    event: Electron.IpcMainInvokeEvent,
    cookie: any,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    try {
      const result = await xiaohongshuService.getDashboardFunc(
        cookie,
        startDate,
        endDate,
      );
      return result;
    } catch (error) {
      console.error('ICP_XHS_GetDashboardFunckApi process failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Publish failed',
      };
    }
  }

  @Icp('ICP_XHS_PublishVideoWorkApi')
  async xhsPublishVideoWorkApi(
    event: Electron.IpcMainInvokeEvent,
    cookies: string,
    filePath: string,
    platformSetting: any,
  ): Promise<any> {
    try {
      const result = await xiaohongshuService.publishVideoWorkApi(
        cookies,
        filePath,
        platformSetting,
        () => {},
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('ICP_XHS_publishVideoWorkApi process failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Publish failed',
      };
    }
  }

  @Icp('ICP_SPH_Login')
  async sphLogin(event: Electron.IpcMainInvokeEvent): Promise<any> {
    try {
      const result = await shipinhaoService.loginOrView('login');
      return result;
    } catch (error) {
      console.error('Login process failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  @Icp('ICP_SPH_GetDashboardFunckApi')
  async sphGetDashboardFunckApi(
    event: Electron.IpcMainInvokeEvent,
    cookie: any,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    try {
      const result = await shipinhaoService.getDashboardFunc(
        cookie,
        startDate,
        endDate,
      );
      return result;
    } catch (error) {
      console.error('ICP_SPH_GetDashboardFunckApi process failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Publish failed',
      };
    }
  }
}
