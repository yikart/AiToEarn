import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { getImgFile, IImgFile } from '../../../../components/Choose/ImgChoose';
import { IImageAccountItem } from './imagePage.type';
import lodash from 'lodash';
import { AccountInfo } from '../../../account/comment';
import { useVideoPageStore } from '../videoPage/useVideoPageStore';
import { AccountType } from '../../../../../commont/AccountEnum';
import { IPubParams } from '../videoPage/videoPage';
import { message } from 'antd';
import { accountLogin } from '../../../../icp/account';
import { ErrPubParamsMapType } from '../../hooks/usePubParamsVerify';
import { usePubStroe } from '../../../../store/pubStroe';

export interface IImagePageStore {
  // 账户数据和对应参数
  imageAccounts: IImageAccountItem[];
  // 选择的图片数据
  images: IImgFile[];
  // 每个平台当前选择的账户
  platActiveAccountMap: Map<AccountType, IImageAccountItem>;
  // 当前选择的平台
  activePlat?: AccountType;
  // 通用参数
  commonPubParams: IPubParams;
  // 图片上传上限
  imgUploadLimit: number;
  /**
   * 这个属性在 imagePage/page.tsx 中进行计算，然后实时的放到这里
   * 因为别的组件需要这个属性，为了使其只计算一次，特此放到store引用
   */
  errParamsMap?: ErrPubParamsMapType;
  warnParamsMap?: ErrPubParamsMapType;
}

const store: IImagePageStore = {
  imgUploadLimit: 35,
  images: [],
  imageAccounts: [],
  platActiveAccountMap: new Map<AccountType, IImageAccountItem>(),
  activePlat: undefined,
  commonPubParams: useVideoPageStore.getState().pubParamsInit(),
  errParamsMap: undefined,
  warnParamsMap: undefined,
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
    (_set, get, storeApi) => {
      const set = (data: Partial<IImagePageStore>) => {
        _set(data);
        if (
          (data.hasOwnProperty('imageAccounts') &&
            data.imageAccounts!.length !== 0) ||
          (data.hasOwnProperty('images') && data.images!.length !== 0)
        ) {
          usePubStroe.getState().setImgTextPubSaveData(get());
        }
      };

      const methods = {
        setPlatActiveAccountMap(
          platActiveAccountMap: Map<AccountType, IImageAccountItem>,
        ) {
          set({
            platActiveAccountMap,
          });
        },
        setErrParamsMap(
          errParamsMap: ErrPubParamsMapType,
          warnParamsMap: ErrPubParamsMapType,
        ) {
          set({
            errParamsMap,
            warnParamsMap,
          });
        },
        setActivePlat(activePlat: AccountType) {
          set({
            activePlat,
          });
        },
        // 设置图片
        setImages(images: IImgFile[]) {
          set({
            images,
          });
        },

        // 恢复临时图文记录
        async setTempSaveParams({
          images,
          commonPubParams,
          imageAccounts,
        }: {
          images?: IImgFile[];
          commonPubParams?: IPubParams;
          imageAccounts?: IImageAccountItem[];
        }) {
          if (images) {
            const tasks: Promise<IImgFile>[] = [];
            for (const image of images) {
              tasks.push(getImgFile(image.imgPath));
            }
            const imgFiles = await Promise.all(tasks);
            set({
              images: imgFiles,
            });
          }

          if (imageAccounts) {
            set({
              imageAccounts,
            });
          }

          if (commonPubParams) {
            set({
              commonPubParams,
            });
          }
        },

        /**
         * 账户重新登录。登录成功后会自动更新该条账户数据
         */
        async accountRestart(pType: AccountType) {
          const res = await accountLogin(pType);
          if (!res) return;
          message.success('登录成功！');
          // 更新此条账户数据
          methods.updateAccounts([res]);
        },

        // 添加图片
        addImages(images: IImgFile[]) {
          if (images.length + get().images.length > get().imgUploadLimit) {
            return message.warning(`最多上传${get().imgUploadLimit}张图片！`);
          }
          set({
            images: [...get().images, ...images],
          });
        },

        // 设置所有参数
        setAllPubParams(pubParmas: IPubParams) {
          const imageAccounts = [...get().imageAccounts];

          imageAccounts.map((v) => {
            // 替换
            Object.keys(pubParmas).map((key) => {
              if (pubParmas.hasOwnProperty(key)) {
                v.pubParams[key as 'topics'] = pubParmas[key as 'topics'];
              }
            });
          });
          set({
            imageAccounts,
          });
        },

        // 设置通用发布参数
        setCommonPubParams(pubParmas: IPubParams) {
          const commonPubParams = { ...get().commonPubParams };
          for (const key in commonPubParams) {
            if (pubParmas.hasOwnProperty(key)) {
              commonPubParams[key as 'topics'] = pubParmas[key as 'topics'];
            }
          }
          set({
            commonPubParams,
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

        // 设置单条数据的参数
        setOnePubParams(pubParmas: IPubParams, id: number) {
          const imageAccounts = [...get().imageAccounts];
          const findedData = imageAccounts.find((v) => v.account.id === id);
          if (!findedData) return;

          for (const key in pubParmas) {
            if (pubParmas.hasOwnProperty(key)) {
              findedData.pubParams[key as 'title'] = pubParmas[key as 'title'];
            }
          }

          set({ imageAccounts });
        },

        // 更新用户数据
        updateAccounts(accounts: AccountInfo[]) {
          const imageAccounts = [...get().imageAccounts];
          const imageTextMap = new Map<number, IImageAccountItem>();

          imageAccounts.map((v) => {
            imageTextMap.set(v.account.id || 0, v);
          });

          accounts.map((v) => {
            imageTextMap.get(v.id)!.account = v;
          });

          set({ imageAccounts });
        },

        // 清除本store所有数据
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
