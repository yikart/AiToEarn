import { tracingApi } from '../api/tracing';
import { Controller, Et, Inject } from '../core/decorators';
import { TracingService } from './service';

@Controller()
export class TracingController {
  @Inject(TracingService)
  private readonly tracingService!: TracingService;

  // 创建跟踪记录-账号添加
  @Et('ET_TRACING_ACCOUNT_ADD')
  async updateVideoPul(videoModel: {
    id: number;
    desc?: string;
  }): Promise<any> {
    tracingApi.createTracing(videoModel);
  }
}
