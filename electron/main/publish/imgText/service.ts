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

  async updateImgTextPul(imgTextModel: ImgTextModel) {
    return await this.imgTextRepository.update(imgTextModel.id!, imgTextModel);
  }
}
