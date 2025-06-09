import { PlatType } from "@/app/config/platConfig";
import { KwaiPlat } from "@/app/plat/platChildren/kwai/KwaiPlat";
import { PlatBase } from "@/app/plat/PlatBase";
import {
  IPlatConstrParams,
  IPublishResult,
  IVideoPublishItem,
} from "@/app/plat/plat.type";

class PlatManage {
  private getPlat(type: PlatType, params: IPlatConstrParams): PlatBase {
    switch (type) {
      case PlatType.KWAI:
        return new KwaiPlat(params);
    }
    return new KwaiPlat(params);
  }

  public async publishVideo(
    pubArr: {
      videoPubParams: IVideoPublishItem;
      platType: PlatType;
      access_token: string;
      refresh_token: string;
    }[],
  ) {
    const task: Promise<IPublishResult>[] = [];
    for (const pub of pubArr) {
      task.push(
        this.getPlat(pub.platType, {
          access_token: pub.access_token,
          refresh_token: pub.refresh_token,
        }).publishVideo(pub.videoPubParams, (progress, msg) => {
          console.log(progress, msg);
        }),
      );
    }
    const pubRes = await Promise.all(task);
    console.log(pubRes);
  }
}
export const platManage = new PlatManage();
