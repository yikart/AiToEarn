/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:07
 * @LastEditTime: 2025-04-14 19:22:41
 * @LastEditors: nevin
 * @Description: 反馈模块
 */
import { Global, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Blog, BlogSchema } from '@/libs'
import { BlogController } from './blog.controller'
import { BlogService } from './blog.service'

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
    ]),
  ],
  providers: [BlogService],
  controllers: [BlogController],
})
export class BlogModule {}
