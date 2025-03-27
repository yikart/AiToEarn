import { Controller, Et, Icp, Inject } from '../../core/decorators';
import { VideoPubService } from '../video/service';
import { PublishService } from '../service';
import { AccountService } from '../../account/service';
import { ImgTextPubService } from './service';
import { ImgTextModel } from '../../../db/models/imgText';
import { PubStatus } from '../../../db/models/pubRecord';
import platController from '../../plat';

@Controller()
export class ImgTextPubController {
  @Inject(VideoPubService)
  private readonly imgTextService!: ImgTextPubService;

  @Inject(PublishService)
  private readonly publishService!: PublishService;

  @Inject(AccountService)
  private readonly accountService!: AccountService;

  // 创建图文发布记录
  @Icp('ICP_PUBLISH_CREATE_IMG_TEXT_PUL')
  async createVideoPub(
    event: Electron.IpcMainInvokeEvent,
    imgText: ImgTextModel,
  ): Promise<any> {
    return await this.imgTextService.createImgTextPul(imgText);
  }

  // 更新视频发布数据
  @Et('ET_PUBLISH_UPDATE_IMG_TEXT_PUL')
  async updateImgTextPul(imgTextModel: ImgTextModel): Promise<any> {
    await this.imgTextService.updateImgTextPul(imgTextModel);
  }

  // 发布图文
  @Icp('ICP_PUBLISH_IMG_TEXT')
  async pubImgText(event: Electron.IpcMainInvokeEvent, pubRecordId: number) {
    const pubRecordInfo =
      await this.publishService.getPubRecordInfo(pubRecordId);

    if (pubRecordInfo?.status === PubStatus.RELEASED) {
      console.error('发布记录已发布');
    }

    // 获取图文发布记录列表
    const imgTextModels =
      await this.imgTextService.getImgTextPulListByPubRecordId(pubRecordId);
    // 获取用到的账户信息
    const accountList = await this.accountService.getAccountsByIds(
      imgTextModels.map((v) => v.accountId),
    );

    // 发布
    const pubRes = await platController.imgTextPublish(
      imgTextModels,
      accountList,
    );

    let successCount = 0;
    pubRes.map((v) => {
      if (v.code === 1) successCount++;
    });
    // 更改记录状态
    await this.publishService.updatePubRecordStatus(
      pubRecordId,
      successCount === 0
        ? PubStatus.FAIL
        : successCount === pubRes.length
          ? PubStatus.RELEASED
          : PubStatus.PartSuccess,
    );
    return pubRes;
  }
}
