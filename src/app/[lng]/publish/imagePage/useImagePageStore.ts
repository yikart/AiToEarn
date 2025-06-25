import { create } from "zustand";
import { combine } from "zustand/middleware";
import { IImgFile } from "../components/Choose/ImgChoose";
import { IImageAccountItem } from "./imagePage.type";
import lodash from "lodash";
import { useVideoPageStore } from "../videoPage/useVideoPageStore";
import { AccountInfo, IPubParams } from "../videoPage/videoPage.type";
import { message } from "antd";
import { PlatType } from "@/app/config/platConfig";
import { ErrPubParamsMapType } from "@/app/[lng]/publish/hooks/usePubParamsVerify";

export interface IImagePageStore {
  // 账户数据和对应参数
  imageAccounts: IImageAccountItem[];
  // 选择的图片数据
  images: IImgFile[];
  // 每个平台当前选择的账户
  platActiveAccountMap: Map<PlatType, IImageAccountItem>;
  // 当前选择的平台
  activePlat?: PlatType;
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
  platActiveAccountMap: new Map<PlatType, IImageAccountItem>(),
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
    (set, get, storeApi) => {
      const methods = {
        setPlatActiveAccountMap(
          platActiveAccountMap: Map<PlatType, IImageAccountItem>,
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
        setActivePlat(activePlat: PlatType) {
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

        // TODO 恢复临时图文记录
        // async setTempSaveParams({
        //   images,
        //   commonPubParams,
        //   imageAccounts,
        // }: {
        //   images?: IImgFile[];
        //   commonPubParams?: IPubParams;
        //   imageAccounts?: IImageAccountItem[];
        // }) {
        //   if (images) {
        //     const tasks: Promise<IImgFile>[] = [];
        //     for (const image of images) {
        //       tasks.push(getImgFile(image.imgPath));
        //     }
        //     const imgFiles = await Promise.all(tasks);
        //     set({
        //       images: imgFiles,
        //     });
        //   }
        //
        //   if (imageAccounts) {
        //     const accountList = useAccountStore.getState().accountList;
        //     imageAccounts = imageAccounts.map((v) => {
        //       v.account = accountList.find(
        //         (account) => v.account?.id === account.id,
        //       )!;
        //       return v;
        //     });
        //     set({
        //       imageAccounts,
        //     });
        //   }
        //
        //   if (commonPubParams) {
        //     set({
        //       commonPubParams,
        //     });
        //   }
        // },

        /**
         * TODO 账户重新登录。登录成功后会自动更新该条账户数据
         */
        async accountRestart(pType: PlatType) {
          // const res = await accountLogin(pType);
          // if (!res) return;
          // message.success("登录成功！");
          // // 更新此条账户数据
          // methods.updateAccounts([res]);
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
                v.pubParams[key as "topics"] = pubParmas[key as "topics"];
              }
            });
          });
          set({
            imageAccounts,
          });
        },

        // 设置通用发布参数
        setCommonPubParams(pubParmas: IPubParams) {
          console.log(pubParmas);
          const commonPubParams = { ...get().commonPubParams };
          const imageAccounts = [...get().imageAccounts];

          for (const key in commonPubParams) {
            if (pubParmas.hasOwnProperty(key)) {
              const keyType = key as "title";
              const val = pubParmas[keyType];
              commonPubParams[keyType] = pubParmas[keyType];
              imageAccounts.map((v) => {
                v.pubParams[keyType] = val;
              });
            }
          }
          set({
            commonPubParams,
            imageAccounts,
          });
        },

        // 按照账号id删除
        delAccountById(accountId: string) {
          const imageAccounts = get().imageAccounts.filter(
            (v) => v.account.id !== accountId,
          );
          set({
            imageAccounts,
          });
        },

        // 按平台删除
        delAccountByPalt(accountType: PlatType) {
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
          const accountSet = new Set<string>(accounts.map((v) => v.id));
          // 已有账户
          const existAccountSet = new Set<string>(
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
              pubParams: lodash.cloneDeep(get().commonPubParams),
            });
          }

          set({
            imageAccounts,
          });
        },

        // 设置单条数据的参数
        setOnePubParams(pubParmas: IPubParams, id: string) {
          const imageAccounts = [...get().imageAccounts];
          const findedData = imageAccounts.find((v) => v.account.id === id);
          if (!findedData) return;

          for (const key in pubParmas) {
            if (pubParmas.hasOwnProperty(key)) {
              findedData.pubParams[key as "title"] = pubParmas[key as "title"];
            }
          }

          set({ imageAccounts });
        },

        // 更新用户数据
        updateAccounts(accounts: AccountInfo[]) {
          const imageAccounts = [...get().imageAccounts];
          const imageTextMap = new Map<string, IImageAccountItem>();

          imageAccounts.map((v) => {
            imageTextMap.set(v.account.id || "0", v);
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
