import { Repository } from 'typeorm';
import { ImgTextModel } from '../../../db/models/imgText';
import { AppDataSource } from '../../../db';
import { VideoModel } from '../../../db/models/video';
import { Injectable } from '../../core/decorators';

@Injectable()
export class ImgTextPubService {
  private imgTextRepository: Repository<ImgTextModel>;

  constructor() {
    this.imgTextRepository = AppDataSource.getRepository(VideoModel);
  }

  // 更新数据
  async updateImgTextPul(imgTextModel: ImgTextModel) {
    return await this.imgTextRepository.update(imgTextModel.id!, imgTextModel);
  }

  // 根据发布记录ID获取图文记录列表
  async getImgTextPulListByPubRecordId(pubRecordId: number) {
    return await this.imgTextRepository.find({
      where: { pubRecordId },
    });
  }
}
