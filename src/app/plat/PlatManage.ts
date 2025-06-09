import { PlatType } from "@/app/config/platConfig";
import { KwaiPlat } from "@/app/plat/platChildren/kwai/KwaiPlat";
import { PlatBase } from "@/app/plat/PlatBase";
import {
  IPlatConstrParams,
  IPublishResult,
  PublishVideoParams,
} from "@/app/plat/plat.type";
import { useBellMessageStroe } from "@/store/bellMessageStroe";

class PlatManage {
  private getPlat(type: PlatType, params: IPlatConstrParams): PlatBase {
    switch (type) {
      case PlatType.KWAI:
        return new KwaiPlat(params);
    }
    return new KwaiPlat(params);
  }

  /**
   * 发布视频
   * @param pubArr 发布参数数组
   * @param id 本次操作的唯一标识
   */
  public async publishVideo(
    pubArr: PublishVideoParams[],
    id: string,
  ): Promise<IPublishResult[]> {
    const task: Promise<IPublishResult>[] = [];
    for (const pub of pubArr) {
      task.push(
        this.getPlat(pub.account.type, {
          access_token: pub.access_token,
          refresh_token: pub.refresh_token,
        }).publishVideo(pub.videoPubParams, (progress, msg) => {
          useBellMessageStroe.getState().publishProgressSet({
            id,
            account: pub.account,
            progress,
            msg,
          });
        }),
      );
    }
    const pubRes = await Promise.all(task);
    console.log(pubRes);
    return pubRes;
  }
}
export const platManage = new PlatManage();
