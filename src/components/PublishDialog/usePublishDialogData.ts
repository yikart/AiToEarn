import { create } from "zustand";
import { combine } from "zustand/middleware";
import lodash from "lodash";
import { BiblPartItem } from "@/components/PublishDialog/publishDialog.type";
import { apiGetBilibiliPartitions } from "@/api/plat/bilibili";
import { apiGetFacebookPages, FacebookPageItem } from "@/api/plat/facebook";
import { useAccountStore } from "@/store/account";
import { PlatType } from "@/app/config/platConfig";

export interface IPublishDialogDataStore {
  // b站分区列表
  bilibiliPartitions: BiblPartItem[];
  // Facebook页面列表
  facebookPages: FacebookPageItem[];
}

const store: IPublishDialogDataStore = {
  bilibiliPartitions: [],
  facebookPages: [],
};

const getStore = () => {
  return lodash.cloneDeep(store);
};

/**
 * 存放发布弹框一些平台获取的三方数据
 * 如：b站的分区列表
 */
export const usePublishDialogData = create(
  combine(
    {
      ...getStore(),
    },
    (set, get, storeApi) => {
      const methods = {
        // 获取b站分区列表
        async getBilibiliPartitions() {
          if (get().bilibiliPartitions.length !== 0) return;
          const res = await apiGetBilibiliPartitions(
            useAccountStore
              .getState()
              .accountList.find((v) => v.type === PlatType.BILIBILI)!.account,
          );
          set({
            bilibiliPartitions: res?.data,
          });
          return res?.data;
        },
        // 获取Facebook页面列表
        async getFacebookPages() {
          if (get().facebookPages.length !== 0) return;
          const facebookAccount = useAccountStore
            .getState()
            .accountList.find((v) => v.type === PlatType.Facebook);
          
          if (!facebookAccount) {
            console.warn('没有找到Facebook账户');
            return;
          }
          
          const res:any = await apiGetFacebookPages(facebookAccount.account);
          set({
            facebookPages: res?.data || [],
          });
          return res?.data;
        },
      };

      return methods;
    },
  ),
);
