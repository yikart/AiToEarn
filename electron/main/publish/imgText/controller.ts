import { Controller, Et, Inject } from '../../core/decorators';
import { VideoPubService } from '../video/service';
import { PublishService } from '../service';
import { AccountService } from '../../account/service';
import { ImgTextPubService } from './service';
import { ImgTextModel } from '../../../db/models/imgText';

@Controller()
export class ImgTextPubController {
  @Inject(VideoPubService)
  private readonly imgTextRepository!: ImgTextPubService;

  @Inject(PublishService)
  private readonly publishService!: PublishService;

  @Inject(AccountService)
  private readonly accountService!: AccountService;

  // 更新视频发布数据
  @Et('ET_PUBLISH_UPDATE_IMG_TEXT_PUL')
  async updateImgTextPul(imgTextModel: ImgTextModel): Promise<any> {
    await this.imgTextRepository.updateImgTextPul(imgTextModel);
  }
}
