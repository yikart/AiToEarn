import { PlatType } from "@/app/config/platConfig";
import { IPlatConstrParams } from "@/app/plat/plat.type";
import { PlatDouyin } from "@/app/plat/platChildren/douyin/PlatDouyin";
import { PlatXhs } from "@/app/plat/platChildren/xhs/PlatXhs";

class PlatManage {
  private getPlat(type: PlatType, params: IPlatConstrParams) {
    switch (type) {
      case PlatType.Douyin:
        return new PlatDouyin(params);
      case PlatType.Xhs:
        return new PlatXhs(params);
    }
  }
}
export const platManage = new PlatManage();
