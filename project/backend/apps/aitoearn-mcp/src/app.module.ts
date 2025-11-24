import { Module } from '@nestjs/common'
import { config } from './config'
import { McpModule } from './core/mcp/mcp.module'
import { MongodbModule } from './libs/mongodb'

@Module({
  imports: [
    MongodbModule.forRoot(config.mongodb),
    McpModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
