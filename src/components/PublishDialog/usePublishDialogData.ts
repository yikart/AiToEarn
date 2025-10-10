import { create } from "zustand";
import { combine } from "zustand/middleware";
import lodash from "lodash";
import { BiblPartItem, YouTubeCategoryItem } from "@/components/PublishDialog/publishDialog.type";
import { apiGetBilibiliPartitions } from "@/api/plat/bilibili";
import { apiGetFacebookPages, FacebookPageItem } from "@/api/plat/facebook";
import { apiGetYouTubeCategories, apiGetYouTubeRegions } from "@/api/plat/youtube";
import { getPinterestBoardListApi } from "@/api/pinterest";
import { useAccountStore } from "@/store/account";
import { PlatType } from "@/app/config/platConfig";

export interface IPublishDialogDataStore {
  // b站分区列表
  bilibiliPartitions: BiblPartItem[];
  // Facebook页面列表
  facebookPages: FacebookPageItem[];
  // YouTube视频分类列表
  youTubeCategories: YouTubeCategoryItem[];
  // YouTube国区列表
  youTubeRegions: string[];
  // Pinterest Board列表
  pinterestBoards: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
}

const store: IPublishDialogDataStore = {
  bilibiliPartitions: [],
  facebookPages: [],
  youTubeCategories: [],
  youTubeRegions: [],
  pinterestBoards: [],
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
        // 获取YouTube国区列表
        async getYouTubeRegions() {
          if (get().youTubeRegions.length !== 0) return;
          const youtubeAccount = useAccountStore
            .getState()
            .accountList.find((v) => v.type === PlatType.YouTube);
          
          if (!youtubeAccount) {
            console.warn('没有找到YouTube账户');
            return;
          }
          
          const res:any = await apiGetYouTubeRegions(youtubeAccount.account);
          set({
            youTubeRegions: res?.data?.regionCode || [],
          });
          return res?.data?.regionCode;
        },
        // 获取YouTube视频分类
        async getYouTubeCategories(regionCode?: string) {
          const youtubeAccount = useAccountStore
            .getState()
            .accountList.find((v) => v.type === PlatType.YouTube);
          
          if (!youtubeAccount) {
            console.warn('没有找到YouTube账户');
            return;
          }

          if (!regionCode) {
            console.warn('需要先选择国区');
            return;
          }
          
          const res:any = await apiGetYouTubeCategories(youtubeAccount?.id || '', regionCode);
          set({
            youTubeCategories: res?.data.items || [],
          });
          return res?.data;
        },
        // 获取Pinterest Board列表
        async getPinterestBoards(forceRefresh = false) {
          if (!forceRefresh && get().pinterestBoards.length !== 0) return;
          const pinterestAccount = useAccountStore
            .getState()
            .accountList.find((v) => v.type === PlatType.Pinterest);
          
          if (!pinterestAccount) {
            console.warn('没有找到Pinterest账户');
            return;
          }
          
          const res:any = await getPinterestBoardListApi({ page: 1, size: 100 }, pinterestAccount.id);
          set({
            pinterestBoards: res?.data?.list || [],
          });
          return res?.data?.list;
        },
      };

      return methods;
    },
  ),
);
