/*
 * @Author: nevin
 * @Date: 2025-01-24 17:10:35
 * @LastEditors: nevin
 * @Description: 视频发布服务
 */
import { VideoModel } from '../../../db/models/video';
import { AppDataSource } from '../../../db';
import { Injectable } from '../../core/decorators';
import { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { CorrectQuery, backPageData } from '../../../global/table';
import { getUserInfo } from '../../user/comment';
import { AccountType } from '../../../../commont/AccountEnum';

@Injectable()
export class VideoPubService {
  private videoRepository: Repository<VideoModel>;
  constructor() {
    this.videoRepository = AppDataSource.getRepository(VideoModel);
    console.log('VideoPubService constructor');
  }

  // 创建视频发布数据
  async newVideoPul(video: VideoModel) {
    video.userId = getUserInfo().id;
    return await this.videoRepository.save(video);
  }

  // 更新视频数据
  async updateVideoPul(videoModel: VideoModel) {
    return await this.videoRepository.update(videoModel.id!, videoModel);
  }

  // 获取视频发布信息
  async getVideoPulInfo(id: number) {
    return await this.videoRepository.findOne({ where: { id } });
  }

  // 获取发布记录相关的视频发布列表
  async getVideoPulListByPubRecordId(pubRecordId: number) {
    const file: FindManyOptions<VideoModel> = {
      where: { pubRecordId: pubRecordId },
    };
    return await this.videoRepository.find(file);
  }

  // 获取发布记录相关的视频发布列表
  async getVideoPulListByPubRecordIdToShow(
    pubRecordId: number,
    page: CorrectQuery,
  ) {
    const file: FindManyOptions<VideoModel> = {
      where: { pubRecordId: pubRecordId },
      order: { publishTime: 'DESC' },
      skip: (page.page_no - 1) * page.page_size,
      take: page.page_size,
    };
    const [list, totalCount] = await this.videoRepository.findAndCount(file);
    return backPageData(list, totalCount, page);
  }

  // 视频发布列表
  async getVideoPulList(
    userId: string,
    page: CorrectQuery,
    query?: FindOptionsWhere<VideoModel>,
  ) {
    const file: FindManyOptions<VideoModel> = {
      where: { userId: userId, ...query },
      order: { publishTime: 'DESC' },
      skip: (page.page_no - 1) * page.page_size,
      take: page.page_size,
    };
    const [list, totalCount] = await this.videoRepository.findAndCount(file);
    return backPageData(list, totalCount, page);
  }

  // 删除视频发布
  async deleteVideoPul(id: number) {
    return await this.videoRepository.delete(id);
  }

  // 获取不同类型的视频发布的总数
  async getVideoPulTypeCount(userId: string, type?: AccountType) {
    return await this.videoRepository.count({
      where: { userId: userId, type: type },
    });
  }

  // 删除
  async deleteVideoPulByPubRecordId(pubRecordId: number): Promise<boolean> {
    const res = await this.videoRepository.delete({ pubRecordId });
    return res.affected ? true : false;
  }

  // 删除
  async deleteByPubRecordAndAccount(
    pubRecordId: number,
    accountId: number,
  ): Promise<boolean> {
    const res = await this.videoRepository.delete({ pubRecordId, accountId });
    return res.affected ? true : false;
  }
}
