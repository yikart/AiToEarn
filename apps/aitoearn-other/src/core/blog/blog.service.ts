import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { Blog, BlogRepository } from '@yikart/mongodb'
import { GetBlogListDto } from './blog.dto'

@Injectable()
export class BlogService {
  constructor(
    private readonly blogRepository: BlogRepository,
  ) {}

  async createBlog(newData: Blog) {
    return await this.blogRepository.create(newData)
  }

  /**
   * 获取列表
   * @param pageInfo
   * @param query
   * @returns
   */
  async getBlogList(pageInfo: TableDto, query: GetBlogListDto) {
    return await this.blogRepository.listWithPagination({
      page: pageInfo.pageNo,
      pageSize: pageInfo.pageSize,
      createdAt: query.time,
    })
  }

  // 根据ID获取信息
  async getBlogInfo(id: string) {
    return await this.blogRepository.getById(id)
  }

  // 根据ID删除
  async delBlog(id: string) {
    return await this.blogRepository.deleteById(id)
  }
}
