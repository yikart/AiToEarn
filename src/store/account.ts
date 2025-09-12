import { create } from "zustand";
import { combine } from "zustand/middleware";
import lodash from "lodash";
import { AccountGroupItem, SocialAccount } from "@/api/types/account.type";
import { getAccountGroupApi, getAccountListApi } from "@/api/account";
import { directTrans } from "@/app/i18n/client";

export interface AccountGroup extends AccountGroupItem {
  children: SocialAccount[];
}

export interface IAccountStore {
  accountList: SocialAccount[];
  accountMap: Map<string, SocialAccount>;
  // key=account,value=账户
  accountAccountMap: Map<string, SocialAccount>;
  accountGroupList: AccountGroup[];
  accountGroupMap: Map<string, AccountGroup>;
  accountLoading: boolean;
  // 当前选择的账户
  accountActive?: SocialAccount;
}

const store: IAccountStore = {
  // 不分组的账户数据
  accountList: [],
  // 分组的账户数据
  accountGroupList: [],
  accountGroupMap: new Map([]),
  accountMap: new Map([]),
  accountAccountMap: new Map([]),
  accountLoading: false,
  accountActive: undefined,
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
        },
        // 设置选择账户ID
        setAccountActive(accountActive?: SocialAccount) {
          set({
            accountActive,
          });
        },

        setAccountGroupList(accountGroupList: AccountGroup[]) {
          set({ accountGroupList });
        },

        async getAccountList() {
          if (get().accountLoading) return;
          set({ accountLoading: true });

          const accountMap = new Map<string, SocialAccount>([]);
          const accountAccountMap = new Map<string, SocialAccount>([]);
          const result = await getAccountListApi();
          set({ accountLoading: false });

          if (result?.code !== 0) return;
          const accountList: SocialAccount[] = [];

          for (const item of result.data) {
            accountMap.set(item.id, item);
            accountAccountMap.set(item.account, item);
            accountList.push(item);
          }

          set({
            accountList,
            accountMap,
            accountAccountMap,
          });
          await methods.getAccountGroup();
        },

        // 获取用户组的数据并且将用户放到对应组下
        async getAccountGroup() {
          const res = await getAccountGroupApi();
          const groupList = res?.data;

          if (!groupList) return;
          if (groupList.length === 0) return;
          groupList.map((v: any) => {
            v.name = v.isDefault
              ? directTrans("account", "defaultSpace")
              : v.name;
          });

          const accountGroupList: AccountGroup[] = [];
          // key=组ID，val=账户ID
          const accountGroupMap = new Map<string, AccountGroup>();

          const defaultGroup = groupList.find((v: any) => v.isDefault)!;

          groupList.map((v: any) => {
            const accountGroupItem = {
              ...v,
              children: [],
            };
            accountGroupList.push(accountGroupItem);
            accountGroupMap.set(v.id, accountGroupItem);
          });
          get().accountList.map((v) => {
            if (accountGroupMap.get(v.groupId!)) {
              accountGroupMap.get(v.groupId!)!.children?.push(v);
            } else {
              accountGroupMap.get(defaultGroup.id)!.children?.push(v);
              v.groupId = defaultGroup.id;
            }
          });

          accountGroupList.sort((a, b) => {
            return a.rank - b.rank;
          });

          set({
            accountGroupList,
            accountGroupMap,
          });
        },

        async accountInit() {
          if (get().accountList.length > 0) return;
          await methods.getAccountList();
        },
      };
      return methods;
    },
  ),
);
