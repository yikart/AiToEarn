/*
 * @Author: nevin
 * @Date: 2025-02-06 17:09:35
 * @LastEditTime: 2025-02-14 18:31:12
 * @LastEditors: nevin
 * @Description:
 */

import { dialog } from 'electron';
import { Controller, Et, Icp, Inject } from '../../core/decorators';
import { VideoPubService } from './service';
import { getUserInfo } from '../../user/comment';
import { VideoModel } from '../../../db/models/video';
import { Between, FindOptionsWhere } from 'typeorm';
import type { CorrectQuery } from '../../../global/table';
import { PubStatus } from '../../../db/models/pubRecord';
import { PublishService } from '../service';
import platController from '../../plat';
import { AccountService } from '../../account/service';
import { AccountType } from '../../../../commont/AccountEnum';

@Controller()
export class VideoPubController {
  @Inject(VideoPubService)
  private readonly videoPubService!: VideoPubService;

  @Inject(PublishService)
  private readonly publishService!: PublishService;

  @Inject(AccountService)
  private readonly accountService!: AccountService;

  // 上传视频
  @Icp('ICP_ACCOUNT_UPLOAD_VIDEO')
  async uploadVideo(event: Electron.IpcMainInvokeEvent): Promise<any> {
    // 打开文件选择对话框
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: '所有文件', extensions: ['*'] }],
    });

    if (result.filePaths.length === 0) return;
    return result.filePaths[0];
  }

  // 发布视频记录获取
  @Icp('ICP_PUB_GET_VIDEO_RECORD')
  async getVideoRecord(
    event: Electron.IpcMainInvokeEvent,
    pubRecordId: number,
  ) {
    return this.videoPubService.getVideoPulListByPubRecordId(pubRecordId);
  }

  // 发布视频
  @Icp('ICP_PUB_VIDEO')
  async pubVideo(
    event: Electron.IpcMainInvokeEvent,
    pubRecordId: number,
  ): Promise<any> {
    const res = {
      code: 0,
      msg: '发布失败',
    };

    const userInfo = getUserInfo();
    const pubRecordInfo =
      await this.publishService.getPubRecordInfo(pubRecordId);

    if (!pubRecordInfo || pubRecordInfo.userId !== userInfo.id) {
      res.msg = '发布记录不存在';
      return res;
    }
    if (pubRecordInfo.status === PubStatus.RELEASED) {
      res.msg = '发布记录已发布';
      return res;
    }

    // 获取视频发布记录列表
    const videoList =
      await this.videoPubService.getVideoPulListByPubRecordId(pubRecordId);
    // 获取用到的账户信息
    const accountList = await this.accountService.getAccountsByIds(
      videoList.map((v) => v.accountId),
    );
    // 发布
    const pubRes = await platController.videoPublish(videoList, accountList);

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

  /**
   * 获取视频发布列表
   */
  @Icp('ICP_PUBLISH_GET_VIDEO_PUL_LIST')
  async getVideoPulList(
    event: Electron.IpcMainInvokeEvent,
    page: CorrectQuery,
    query: {
      pubRecardId?: number;
      type?: AccountType;
      time?: [string, string];
      title?: string;
    },
  ): Promise<any> {
    const userInfo = getUserInfo();
    const where: FindOptionsWhere<VideoModel> = {
      userId: userInfo.id,
      ...(query.pubRecardId && { pubRecordId: query.pubRecardId }),
      ...(query.title && { title: query.title }),
      ...(query.time &&
        query.time.length === 2 &&
        Between(new Date(query.time[0]), new Date(query.time[1]))),
    };

    return await this.videoPubService.getVideoPulList(userInfo.id, page, where);
  }

  /**
   * 获取视频发布信息
   */
  @Icp('ICP_PUBLISH_GET_VIDEO_PUL_INFO')
  async getVideoPulInfo(
    event: Electron.IpcMainInvokeEvent,
    id: number,
  ): Promise<any> {
    return await this.videoPubService.getVideoPulInfo(id);
  }

  /**
   * 创建视频发布记录
   */
  @Icp('ICP_PUBLISH_CREATE_VIDEO_PUL')
  async createVideoPub(
    event: Electron.IpcMainInvokeEvent,
    video: VideoModel,
  ): Promise<any> {
    return await this.videoPubService.newVideoPul(video);
  }

  /**
   * 获取不同类型的视频发布的总数
   */
  @Icp('ICP_PUBLISH_GET_VIDEO_PUL_TYPE_COUNT')
  async getVideoPulTypeCount(
    event: Electron.IpcMainInvokeEvent,
    type?: AccountType,
  ): Promise<any> {
    const userInfo = getUserInfo();
    return await this.videoPubService.getVideoPulTypeCount(userInfo.id, type);
  }

  // 更新视频发布数据
  @Et('ET_PUBLISH_UPDATE_VIDEO_PUL')
  async updateVideoPul(videoModel: VideoModel): Promise<any> {
    await this.videoPubService.updateVideoPul(videoModel);
  }

  @Et('ET_DEL_PUB_RECORD_ITEM')
  async delVideoPul(pulRecordId: number) {
    await this.videoPubService.deleteVideoPulByPubRecordId(pulRecordId);
  }

  // 删除发布记录
  @Icp('ICP_PUBLISH_DEL_PUB_RECORD_ITEM_VIDEO')
  async delPubRecordItem(
    event: Electron.IpcMainInvokeEvent,
    id: number,
    accountId: number,
  ) {
    return await this.videoPubService.deleteByPubRecordAndAccount(
      id,
      accountId,
    );
  }
}
