import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { IImgFile } from '../../../../components/Choose/ImgChoose';
import { IImageAccountItem } from './imagePage.type';
import lodash from 'lodash';
import { AccountInfo } from '../../../account/comment';
import { useVideoPageStore } from '../videoPage/useVideoPageStore';
import { AccountType } from '../../../../../commont/AccountEnum';

interface IImagePageStore {
  // 账户数据和对应参数
  imageAccounts: IImageAccountItem[];
  // 选择的图片数据
  images: IImgFile[];
  // 每个平台当前选择的账户
  platActiveAccountMap: Map<AccountType, IImageAccountItem>;
  // 当前选择的平台
  activePlat?: AccountType;
}

const store: IImagePageStore = {
  images: [],
  imageAccounts: [],
  platActiveAccountMap: new Map<AccountType, IImageAccountItem>(),
  activePlat: undefined,
};

const getStore = () => {
  return lodash.cloneDeep(store);
};

// 视频发布所有组件的共享状态和方法
export const useImagePageStore = create(
  combine(
    {
      ...getStore(),
    },
    (set, get, storeApi) => {
      const methods = {
        setPlatActiveAccountMap(
          platActiveAccountMap: Map<AccountType, IImageAccountItem>,
        ) {
          set({
            platActiveAccountMap,
          });
        },

        setActivePlat(activePlat: AccountType) {
          set({
            activePlat,
          });
        },

        // 按照账号id删除
        delAccountById(accountId: number) {
          const imageAccounts = get().imageAccounts.filter(
            (v) => v.account.id !== accountId,
          );
          set({
            imageAccounts,
          });
        },
        // 按平台删除
        delAccountByPalt(accountType: AccountType) {
          const imageAccounts = get().imageAccounts.filter(
            (v) => v.account.type !== accountType,
          );
          set({
            imageAccounts,
          });
        },

        // 添加账户
        addAccount(accounts: AccountInfo[]) {
          let imageAccounts = [...get().imageAccounts];
          // 新增账户
          const accountSet = new Set<number>(accounts.map((v) => v.id));
          // 已有账户
          const existAccountSet = new Set<number>(
            imageAccounts.map((v) => v.account.id),
          );
          // 要添加到数据的账户
          const notAddAccount: AccountInfo[] = [];

          // 过滤掉新增账户中的 已有账户
          for (const account of accounts) {
            if (!existAccountSet.has(account.id)) notAddAccount.push(account);
          }

          /**
           * 新增账户没有的账户
           * 但是已有账户有，那么过滤
           */
          imageAccounts = imageAccounts.filter((v) =>
            accountSet.has(v.account.id),
          );

          // 根据账户添加数据
          for (const account of notAddAccount) {
            imageAccounts.push({
              account,
              pubParams: useVideoPageStore.getState().pubParamsInit(),
            });
          }

          set({
            imageAccounts,
          });
        },

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
