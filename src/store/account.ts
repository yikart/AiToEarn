import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import lodash from 'lodash';
import { AccountInfo } from '../views/account/comment';
import {
  AccountGroup,
  icpGetAccountGroup,
  icpGetAccountList,
} from '../icp/account';
import { onAccountLoginFinish } from '../icp/receiveMsg';

export interface AccountGroupItem extends AccountGroup {
  children: AccountInfo[];
}

export interface IAccountStore {
  accountList: AccountInfo[];
  accountMap: Map<number, AccountInfo>;
  unBindFn?: () => void;
  accountGroupList: AccountGroupItem[];
  accountGroupMap: Map<number, AccountGroupItem>;
}

const store: IAccountStore = {
  // 不分组的账户数据
  accountList: [],
  // 分组的账户数据
  accountGroupList: [],
  accountGroupMap: new Map([]),
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

        setAccountGroupList(accountGroupList: AccountGroupItem[]) {
          set({ accountGroupList });
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
          await methods.getAccountGroup();
        },

        // 获取用户组的数据并且将用户放到对应组下
        async getAccountGroup() {
          const groupList = await icpGetAccountGroup();
          if (groupList.length === 0) return;
          const accountGroupList: AccountGroupItem[] = [];
          // key=组ID，val=账户ID
          const accountGroupMap = new Map<number, AccountGroupItem>();
          groupList.map((v) => {
            const accountGroupItem = {
              ...v,
              children: [],
            };
            accountGroupList.push(accountGroupItem);
            accountGroupMap.set(v.id, accountGroupItem);
          });
          get().accountList.map((v) => {
            accountGroupMap.get(v.groupId!)!.children?.push(v);
          });

          accountGroupList.sort((a, b) => {
            return a.rank - b.rank;
          });

          set({
            accountGroupList,
            accountGroupMap,
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
