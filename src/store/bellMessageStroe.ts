import { create } from "zustand";
import { combine } from "zustand/middleware";
import lodash from "lodash";
// import { PublishProgressRes } from "../../electron/main/plat/pub/PubItemVideo";
// import { onVideoPublishProgress } from "../icp/receiveMsg";
import { PubStatus } from "@/app/config/publishConfig";

export interface NoticeItem {
  title: string;
  time: Date;
  // 以下为不同类型通知独有的字段
  // 发布
  pub?: {
    // 发布状态
    status: PubStatus;
    // TODO 发布记录进度类型
    // progressList: PublishProgressRes[];
    progressList: any[];
  };
  id: string | number;
}

export enum NoticeType {
  // 发布通知
  PubNotice = "1",
}

export interface IBellMessageStroe {
  noticeMap: Map<NoticeType, NoticeItem[]>;
}

const store: IBellMessageStroe = {
  noticeMap: new Map<NoticeType, NoticeItem[]>(),
};

const getStore = () => {
  return lodash.cloneDeep(store);
};

// 视频发布所有组件的共享状态和方法
export const useBellMessageStroe = create(
  combine(
    {
      ...getStore(),
    },
    (set, get, storeApi) => {
      const methods = {
        // 添加数据
        addNotice(type: NoticeType, data: NoticeItem[]) {
          const noticeMap = new Map(get().noticeMap);
          noticeMap.set(type, data);

          set({ noticeMap });
        },

        // 发布进度监听
        videoPublishProgressInit() {
          // onVideoPublishProgress((progressData) => {
          //   const noticeMap = new Map(get().noticeMap);
          //   const noticeList = noticeMap.get(NoticeType.PubNotice) || [];
          //   const noticeItem = noticeList.find((v) => v.id === progressData.id);
          //
          //   noticeItem?.pub?.progressList.find((v, i) => {
          //     if (v.account.id === progressData.account.id) {
          //       noticeItem!.pub!.progressList[i] = progressData;
          //       return true;
          //     }
          //   });
          //
          //   set({ noticeMap });
          // });
        },
      };
      return methods;
    },
  ),
);
