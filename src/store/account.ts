import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import lodash from 'lodash';
import { AccountInfo } from '../views/account/comment';
import { icpGetAccountList } from '../icp/account';
import { onAccountLoginFinish } from '../icp/receiveMsg';

export interface IAccountStore {
  accountList: AccountInfo[];
  accountMap: Map<number, AccountInfo>;
  unBindFn?: () => void;
}

const store: IAccountStore = {
  accountList: [],
  accountMap: new Map([]),
  unBindFn: undefined,
};

const getStore = () => {
  return lodash.cloneDeep(store);
};

// 视频发布所有组件的共享状态和方法
export const useAccountStore = create(
  combine(
    {
      ...getStore(),
    },
    (set, get, storeApi) => {
      const methods = {
        clear() {
          set({
            ...getStore(),
          });
          if (get().unBindFn) get().unBindFn!();
        },

        async getAccountList() {
          const accountMap = new Map<number, AccountInfo>([]);
          const result = await icpGetAccountList();
          if (!result) return;

          for (const item of result) {
            accountMap.set(item.id, item);
          }

          set({
            accountList: result,
            accountMap,
          });
        },

        async init() {
          methods.getAccountList();

          const unBindFn = onAccountLoginFinish(() => {
            methods.getAccountList();
          });

          set({
            unBindFn,
          });
        },
      };
      return methods;
    },
  ),
);
