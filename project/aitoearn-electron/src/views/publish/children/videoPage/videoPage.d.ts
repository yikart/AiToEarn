import { AccountInfo } from '@/views/account/comment';
import { IVideoFile } from '@/components/Choose/VideoChoose';
import { IImgFile } from '@/components/Choose/ImgChoose';
import { VisibleTypeEnum } from '@@/publish/PublishEnum';
import {
  DiffParmasType,
  ILableValue,
} from '../../../../../electron/db/models/video';
import { ILocationDataItem } from '../../../../../electron/main/plat/plat.type';

export interface IPubParams {
  // 视频标题
  title?: string;
  // 视频描述
  describe?: string;
  // 视频封面
  cover?: IImgFile;
  // 查看权限
  visibleType?: VisibleTypeEnum;
  // 视频话题
  topics?: string[];
  // 每个平台的差异性参数
  diffParams?: DiffParmasType;
  // 位置
  location?: ILocationDataItem;
  // 定时发布日期
  timingTime?: Date;
  // @用户
  mentionedUserInfo?: ILableValue[];
  // 合集
  mixInfo?: ILableValue;
}

// 选择视频的每项数据
export interface IVideoChooseItem {
  // 选择的视频
  video?: IVideoFile;
  // 选择的账户
  account?: AccountInfo;
  // 发布参数
  pubParams: IPubParams;
  // 唯一id
  id: string;
}
