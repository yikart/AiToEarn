import { create } from "zustand/index";
import { combine } from "zustand/middleware";
import { SocialAccount } from "@/api/types/account.type";

export interface IDataStatisticsStore {
  // 当前选择的账户组IDs
  choosedGroupIds: string[];
  // 过滤之后的账户
  filteredAccountList: SocialAccount[];
}

const state: IDataStatisticsStore = {
  choosedGroupIds: [],
  filteredAccountList: [],
};

export const useDataStatisticsStore = create(
  combine(
    {
      ...state,
    },
    (set, get) => {
      const methods = {
        // 设置选择账户组IDs
        setChoosedGroupIds(choosedGroupIds: string[]) {
          set({
            choosedGroupIds,
          });
        },
        // 设置过滤之后的账户
        setFilteredAccountList(filteredAccountList: SocialAccount[]) {
          set({
            filteredAccountList,
          });
        },
      };

      return methods;
    },
  ),
);
