import { create } from "zustand";
import { combine } from "zustand/middleware";
import lodash from "lodash";
import { SocialAccount } from "@/api/types/account.type";

export interface IPublishDialogStore {
  // 选择的账户
  accountChoosed: SocialAccount[];
}

const store: IPublishDialogStore = {
  accountChoosed: [],
};

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

        setAccountChoosed(accountChoosed: SocialAccount[]) {
          set({
            accountChoosed,
          });
        },
      };
      return methods;
    },
  ),
);
