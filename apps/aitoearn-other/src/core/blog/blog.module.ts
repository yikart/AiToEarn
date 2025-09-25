/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:07
 * @LastEditTime: 2025-04-14 19:22:41
 * @LastEditors: nevin
 * @Description: 博客模块
 */
import { Global, Module } from '@nestjs/common'
import { MongodbModule } from '@yikart/mongodb'
import { BlogController } from './blog.controller'
import { BlogService } from './blog.service'

@Global()
@Module({
  imports: [
    MongodbModule,
  ],
  providers: [BlogService],
  controllers: [BlogController],
})
export class BlogModule {}
