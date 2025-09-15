import { create } from "zustand";
import { combine } from "zustand/middleware";
import lodash from "lodash";

export interface IHotContentStore {}

const store: IHotContentStore = {};

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
      const methods = {};

      return methods;
    },
  ),
);
