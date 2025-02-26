import { AccountInfo } from '@/views/account/comment';
import { IVideoFile } from '@/components/Choose/VideoChoose';
import { IImgFile } from '@/components/Choose/ImgChoose';
import { VisibleTypeEnum } from '@@/publish/PublishEnum';
import {
  DiffParmasType,
  TopicsArrType,
} from '../../../../../electron/db/models/video';

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
  topics?: TopicsArrType;
  // 每个平台的差异性参数
  diffParams?: DiffParmasType;
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
