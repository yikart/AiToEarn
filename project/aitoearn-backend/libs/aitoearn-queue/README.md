# @yikart/aitoearn-queue

统一的队列管理模块，基于 BullMQ 实现。

## 功能

- 统一的队列服务（QueueService）
- 集中的队列名称管理（QueueName 枚举）
- 内置 Redis 连接管理
- 类型安全的任务数据定义

## 使用方法

### 在应用中导入模块

```typescript
import { AitoearnQueueModule } from '../src/queue.module'

@Module({
  imports: [
    AitoearnQueueModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
      prefix: '{bull}',
    }),
  ],
})
export class AppModule {}
```

### 使用队列服务

```typescript
import { QueueService } from '../src/queue.module'

@Injectable()
export class MyService {
  constructor(private readonly queueService: QueueService) {}

  async addJob() {
    await this.queueService.addMaterialGenerateJobs([
      { taskId: '123' }
    ])
  }
}
```

## 注意事项

- 不要直接使用 `@InjectQueue` 装饰器，请使用 `QueueService`
- 不要直接导入 `bullmq` 的类型，队列模块已提供所需接口
- Consumer（队列消费者）仍然保留在各应用中
