import { tracingApi } from '../api/tracing';
import { Controller, Et, Inject } from '../core/decorators';
import { TracingService } from './service';

@Controller()
export class TracingController {
  @Inject(TracingService)
  private readonly tracingService!: TracingService;

  // 创建跟踪记录-账号添加
  @Et('ET_TRACING_ACCOUNT_ADD')
  async tracingAccountAdd(data: { id: number; desc?: string }): Promise<any> {
    tracingApi.createTracing(data);
  }

  // 创建跟踪记录-视频发布
  @Et('ET_TRACING_VIDEO_PUL')
  async tracingVideoPul(data: {
    accountId: number;
    dataId: string; // 视频发布数据ID
    desc?: string;
  }): Promise<any> {
    tracingApi.createTracingVideoPul(data);
  }

  // 创建跟踪记录-开源项目调用
  @Et('ET_TRACING_OPENPROJECT_USE')
  async tracingOpenProjectUse(data: { desc?: string }): Promise<any> {
    tracingApi.createTracingOpenProjectUse(data);
  }
}
