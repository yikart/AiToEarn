import { PlatType } from "@/app/config/platConfig";

class PlatManage {
  private getPlat(type: PlatType) {
    switch (type) {
      case PlatType.KWAI:
        return;
    }
  }
}
export const platManage = new PlatManage();
