/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 反馈
 */
import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { NatsMessagePattern } from 'src/common/decorators/custom-message-pattern.decorator'
import { Blog } from '@/libs'
import { BlogService } from './blog.service'
import { CreateFeedBackDto } from './dto/blog.dto'

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
