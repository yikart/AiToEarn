/*
 * @Author: nevin
 * @Date: 2025-01-24 17:10:35
 * @LastEditors: nevin
 * @Description: 发布
 */
import { AppDataSource } from '../../db';
import { Injectable } from '../core/decorators';
import { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { CorrectQuery, backPageData } from '../../global/table';
import { PubRecordModel, PubStatus } from '../../db/models/pubRecord';
import { EtEvent } from '../../global/event';
import { getUserInfo } from '../user/comment';
@Injectable()
export class PublishService {
  private pubRecordRepository: Repository<PubRecordModel>;
  constructor() {
    this.pubRecordRepository = AppDataSource.getRepository(PubRecordModel);
    console.log('PublishService constructor');
  }

  // 创建发布记录
  async createPubRecord(pubRecord: PubRecordModel) {
    return await this.pubRecordRepository.save(pubRecord);
  }

  // 获取发布记录列表
  async getPubRecordList(
    userId: string,
    page: CorrectQuery,
    query?: FindOptionsWhere<PubRecordModel>,
  ) {
    const file: FindManyOptions<PubRecordModel> = {
      where: { userId: userId, ...query },
      order: { publishTime: 'DESC' },
      skip: (page.page_no - 1) * page.page_size,
    };
    const [list, totalCount] =
      await this.pubRecordRepository.findAndCount(file);
    return backPageData(list, totalCount, page);
  }

  // 获取发布记录信息
  async getPubRecordInfo(id: number) {
    const userInfo = getUserInfo();
    const pubRecordInfo = await this.pubRecordRepository.findOne({
      where: { id },
    });
    if (!pubRecordInfo || pubRecordInfo.userId !== userInfo.id) {
      console.error('发布记录不存在');
    }
    return pubRecordInfo;
  }

  // 更新发布记录的状态
  async updatePubRecordStatus(id: number, status: PubStatus) {
    return await this.pubRecordRepository.update(id, { status });
  }

  // 删除发布记录
  async deletePubRecordById(id: number): Promise<boolean> {
    const { affected } = await this.pubRecordRepository.delete(id);
    const res = affected ? true : false;
    if (res) EtEvent.emit('ET_DEL_PUB_RECORD_ITEM', id);
    return res;
  }
}
