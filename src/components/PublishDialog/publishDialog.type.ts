import { IImgFile } from "@/app/[lng]/publish/components/Choose/ImgChoose";
import { IVideoFile } from "@/app/[lng]/publish/components/Choose/VideoChoose";
import { SocialAccount } from "@/api/types/account.type";

export interface IPubParams {
  des: string;
  // 视频和图片不能同时存在，存在图片本次发布则为图文，存在视频则本次发布为视频发布 --------------
  // 图片
  images?: IImgFile[];
  // 视频
  video?: IVideoFile;
  // 话题
  topics?: string[];
}

export interface PubItem {
  account: SocialAccount;
  params: IPubParams;
}
