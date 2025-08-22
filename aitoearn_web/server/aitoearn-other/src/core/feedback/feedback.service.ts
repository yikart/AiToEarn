/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description:
 */
import { Feedback } from '@/libs';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<Feedback>,
  ) {}

  async createFeedback(newData: Feedback) {
    return await this.feedbackModel.create(newData);
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
    const data = await this.feedbackModel.findOne({ _id: id });
    return data;
  }

  // 根据ID删除
  async delFeedback(id: string) {
    const data = await this.feedbackModel.deleteOne({ _id: id });
    return data;
  }
}
