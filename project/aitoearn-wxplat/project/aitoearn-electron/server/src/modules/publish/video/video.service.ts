/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description: Video
 */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery } from 'mongoose';
import { AccountType } from 'src/db/schema/account.schema';
import { Video } from 'src/db/schema/video.schema';
import { TableDto } from 'src/global/dto/table.dto';
import { VideoPulListDto } from '../dto/video.dto';

@Injectable()
export class VideoService {
  constructor(
    @InjectModel(Video.name)
    private readonly videoModel: Model<Video>,
  ) {}

  /**
   * 创建视频发布数据
   * @param userId
   * @param video
   * @returns
   */
  async newVideoPul(userId: string, video: Partial<Video>) {
    video.userId = userId;
    return await this.videoModel.create(video);
  }

  /**
   * 更新视频数据
   * @param id
   * @param video
   * @returns
   */
  async updateVideoPul(id: number, video: Partial<Video>): Promise<boolean> {
    const res = await this.videoModel.updateOne({ id }, video);
    return res.modifiedCount > 0;
  }

  /**
   * 获取视频发布信息
   * @param id
   * @returns
   */
  async getVideoPulInfo(id: number): Promise<Video> {
    return await this.videoModel.findOne({ id });
  }

  /**
   * 获取发布记录相关的视频发布列表
   * @param pubRecordId
   * @returns
   */
  async getVideoPulListByPubRecordId(pubRecordId: number): Promise<Video[]> {
    const list = await this.videoModel.find({ pubRecordId });
    return list;
  }

  // 获取发布记录相关的视频发布列表
  async getVideoPulListByPubRecordIdToShow(
    pubRecordId: number,
    page: {
      page_size: number;
      page_no: number;
    },
  ) {
    const list = await this.videoModel
      .find({ pubRecordId })
      .skip((page.page_no - 1) * page.page_size)
      .limit(page.page_size)
      .sort({ createdAt: -1 });

    const totalCount = await this.videoModel.countDocuments({ pubRecordId });

    return {
      list,
      totalCount,
    };
  }

  // 视频发布列表
  async getVideoPulList(
    userId: string,
    page: TableDto,
    query: VideoPulListDto,
  ) {
    const filter: RootFilterQuery<Video> = {
      userId,
      ...(query.pubRecordId && { pubRecordId: query.pubRecordId }),
      ...(query.title && { title: query.title }),
      ...(query.time !== undefined &&
        query.time.length === 2 && {
          createdAt: { $gte: query.time[0], $lte: query.time[1] },
        }),
    };
    const list = await this.videoModel
      .find(filter)
      .skip((page.pageNo - 1) * page.pageSize)
      .limit(page.pageSize)
      .sort({ createdAt: -1 });

    return {
      list,
      totalCount: await this.videoModel.countDocuments(filter),
    };
  }

  // 删除视频发布
  async deleteVideoPul(id: number): Promise<boolean> {
    const res = await this.videoModel.deleteOne({ id });
    return res.deletedCount > 0;
  }

  // 获取不同类型的视频发布的总数
  async getVideoPulTypeCount(
    userId: string,
    type?: AccountType,
  ): Promise<number> {
    return await this.videoModel.countDocuments({ userId, type });
  }

  // 删除
  async deleteVideoPulByPubRecordId(pubRecordId: number): Promise<boolean> {
    const res = await this.videoModel.deleteMany({ pubRecordId });
    return res.deletedCount > 0;
  }

  // 删除
  async deleteByPubRecordAndAccount(
    pubRecordId: number,
    accountId: number,
  ): Promise<boolean> {
    const res = await this.videoModel.deleteMany({
      pubRecordId,
      accountId,
    });
    return res.deletedCount > 0;
  }
}
