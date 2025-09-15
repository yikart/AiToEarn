import { create } from "zustand";
import { combine } from "zustand/middleware";
import lodash from "lodash";
import { Platform, platformApi, PlatformRanking, RankingDate } from "@/api/hot";
import { HotType } from "@/app/[lng]/hotContent/hotContent.enum";

export interface IHotContentStore {
  // 当前选择的 热点分类
  hotType: HotType;
  // 热门内容平台list
  hotContentPlatformList: Platform[];
  // 爆款标题平台list
  hotTitlePlatformList: Platform[];
  // 数据loading
  dataLoading: boolean;
  // 当前侧边栏二级菜单选择的ID
  twoMenuKey: string;
  // 热门内容页面loading
  pageLoading: boolean;
  // 热门内容的标签数据 key=平台，value=标签数组
  labelData: {
    [key: string]: string[];
  };
  // 热门内容的榜单数据 key=平台ID，value=榜单数据
  rankingData: {
    [key: string]: PlatformRanking;
  };
  // 日期数据 key=平台ID，value=日期数据
  datesData: {
    [key: string]: RankingDate[];
  };
}

const store: IHotContentStore = {
  hotType: HotType.hotContent,
  hotContentPlatformList: [],
  dataLoading: false,
  twoMenuKey: "",
  hotTitlePlatformList: [],
  pageLoading: false,
  labelData: {},
  rankingData: {},
  datesData: {},
};

const getStore = () => {
  return lodash.cloneDeep(store);
};

/**
 * 热门内容数据存储
 */
export const useHotContent = create(
  combine(
    {
      ...getStore(),
    },
    (set, get, storeApi) => {
      const methods = {
        // 设置 当前侧边栏二级菜单选择的ID
        setTwoMenuKey(twoMenuKey: string) {
          set({ twoMenuKey });
        },
        // 设置当前选择的 热点分类
        setHotType(hotType: HotType) {
          set({ hotType });
        },

        // 初始化
        async init() {
          set({ pageLoading: true });
          await Promise.all([
            methods.getHotContentPlatform(),
            methods.getHotTitlePlatform(),
          ]);
          set({ pageLoading: false });
        },

        // 获取热门内容平台
        async getHotContentPlatform() {
          const res = await platformApi.getPlatformList();
          const twoMenuKey = `${HotType.hotContent}_${res?.data?.[0]?.id}`;

          set({
            hotContentPlatformList: res?.data,
            twoMenuKey,
          });

          methods.changeHotContentPlatform(twoMenuKey);
        },

        // 获取爆款标题平台
        async getHotTitlePlatform() {
          const res = await platformApi.findPlatformsWithData();

          set({
            hotTitlePlatformList: res?.data,
          });
        },

        // 热门内容平台切换
        async changeHotContentPlatform(platformId: string) {
          const { rankingData } = get();
          platformId = platformId.split("_")[1];

          set({
            pageLoading: true,
          });

          if (!rankingData[platformId]) {
            const res = await platformApi.getPlatformRanking(platformId);
            if (res?.data?.length) {
              const newRankingData = {
                ...rankingData,
                [platformId]: res.data[0],
              };
              set({ rankingData: newRankingData });
            }
          }

          const rankingItem = get().rankingData[platformId];
          // 获取标签和日期数据
          if (!get().labelData[platformId]) {
            await Promise.all([
              platformApi.getRankingLabel(rankingItem.id),
              platformApi.getRankingDates(rankingItem.id),
            ]).then(([labelRes, dateRes]) => {
              const newLabelData = {
                ...get().labelData,
                [platformId]: labelRes!.data,
              };
              const newDatesData = {
                ...get().datesData,
                [platformId]: dateRes!.data,
              };
              set({
                labelData: newLabelData,
                datesData: newDatesData,
              });
            });
          }

          set({
            pageLoading: false,
          });
        },
      };

      return methods;
    },
  ),
);
