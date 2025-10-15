import { Injectable } from '@nestjs/common'
import { Feedback, FeedbackRepository } from '@yikart/mongodb'
/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description:
 */

@Injectable()
export class FeedbackService {
  constructor(
    private readonly feedbackRepository: FeedbackRepository,
  ) {}

  async createFeedback(newData: Feedback) {
    return await this.feedbackRepository.create(newData)
  }

  /**
   * 获取列表
   * @param pageInfo
   * @param query
   * @returns
   */
  // async getFeedbackList(pageInfo: TableDto, query: GetFeedbackListDto) {
  //   const { skip, take } = TableUtil.GetSqlPaging(pageInfo);
  //   const filter: RootFilterQuery<Feedback> = {
  //     ...(query.time && {
  //       createTime: {
  //         $gte: query.time[0],
  //         $lte: query.time[1],
  //       },
  //     }),
  //     ...(query.userId && { userId: query.userId }),
  //     ...(query.type && { type: query.type }),
  //   };
  //   const tatal = await this.feedbackModel.countDocuments(filter);
  //   const data = await this.feedbackModel
  //     .find(filter)
  //     .sort({ createTime: -1 })
  //     .skip(skip)
  //     .limit(take);

  //   return ResponseUtil.GetCorrectResponse(
  //     pageInfo.pageNo,
  //     pageInfo.pageSize,
  //     tatal,
  //     data,
  //   );
  // }

  // 根据ID获取信息
  async getFeedbackInfo(id: string) {
    return await this.feedbackRepository.getById(id)
  }

  // 根据ID删除
  async delFeedback(id: string) {
    return await this.feedbackRepository.deleteById(id)
  }
}
