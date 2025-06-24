import { create } from "zustand";
import { combine } from "zustand/middleware";
import lodash from "lodash";

export interface IPublishDialogStore {}

const store: IPublishDialogStore = {};

const getStore = () => {
  return lodash.cloneDeep(store);
};

export const usePublishDialog = create(
  combine(
    {
      ...getStore(),
    },
    (set, get, storeApi) => {
      const methods = {
        // 清空所有数据
        clear() {
          set({
            ...getStore(),
          });
        },
      };
      return methods;
    },
  ),
);
