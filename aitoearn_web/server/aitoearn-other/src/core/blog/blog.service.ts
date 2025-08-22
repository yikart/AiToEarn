import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, RootFilterQuery } from 'mongoose'
import { TableDto } from '@/common/global/dto/table.dto'
import { Blog } from '@/libs'
import { GetBlogListDto } from './dto/blog.dto'

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(Blog.name)
    private readonly blogModel: Model<Blog>,
  ) {}

  async createBlog(newData: Blog) {
    return await this.blogModel.create(newData)
  }

  /**
   * 获取列表
   * @param pageInfo
   * @param query
   * @returns
   */
  async getBlogList(pageInfo: TableDto, query: GetBlogListDto) {
    const filter: RootFilterQuery<Blog> = {
      ...(query.time && {
        createTime: {
          $gte: query.time[0],
          $lte: query.time[1],
        },
      }),
      ...(query.userId && { userId: query.userId }),
    }
    const tatal = await this.blogModel.countDocuments(filter)
    const data = await this.blogModel
      .find(filter)
      .sort({ createTime: -1 })
      .skip((pageInfo.pageNo - 1) * pageInfo.pageSize)
      .limit(pageInfo.pageSize)

    return { count: tatal, list: data }
  }

  // 根据ID获取信息
  async getBlogInfo(id: string) {
    const data = await this.blogModel.findOne({ _id: id })
    return data
  }

  // 根据ID删除
  async delBlog(id: string) {
    const data = await this.blogModel.deleteOne({ _id: id })
    return data
  }
}
