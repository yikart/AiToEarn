import { create } from "zustand/index";
import { combine } from "zustand/middleware";

export interface IDataStatisticsStore {
  // 当前选择的账户组IDs
  choosedGroupIds: string[];
}

const state: IDataStatisticsStore = {
  choosedGroupIds: [],
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
      };

      return methods;
    },
  ),
);
