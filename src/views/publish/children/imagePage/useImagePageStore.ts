import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { IImgFile } from '../../../../components/Choose/ImgChoose';
import { IImageAccountItem } from './imagePage.type';
import lodash from 'lodash';
import { AccountInfo } from '../../../account/comment';
import { useVideoPageStore } from '../videoPage/useVideoPageStore';

interface IImagePageStore {
  imageTextData: {
    image: IImgFile[];
    imageAccounts: IImageAccountItem[];
  };
}

const store: IImagePageStore = {
  imageTextData: {
    image: [],
    imageAccounts: [],
  },
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
        // 添加账户
        addAccount(accounts: AccountInfo[]) {
          const imageTextData = {
            ...get().imageTextData,
          };

          for (const account of accounts) {
            imageTextData.imageAccounts.push({
              account,
              pubParams: useVideoPageStore.getState().pubParamsInit(),
            });
          }

          set({
            imageTextData,
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
