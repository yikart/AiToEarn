/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 反馈
 */
import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { ApiTags } from '@nestjs/swagger'
import { NatsMessagePattern } from '@yikart/common'
import { Blog } from '@yikart/mongodb'
import { CreateFeedBackDto } from './blog.dto'
import { BlogService } from './blog.service'

@ApiTags('反馈')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @NatsMessagePattern('other.blog.create')
  async createBlog(@Payload() data: CreateFeedBackDto) {
    const { content } = data
    const newData = new Blog()
    newData.content = content

    const res = await this.blogService.createBlog(newData)
    return res
  }
}
