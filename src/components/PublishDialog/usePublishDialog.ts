import { create } from "zustand";
import { combine } from "zustand/middleware";
import lodash from "lodash";
import { SocialAccount } from "@/api/types/account.type";
import { IImgFile } from "@/app/[lng]/publish/components/Choose/ImgChoose";
import { IVideoFile } from "@/app/[lng]/publish/components/Choose/VideoChoose";

interface IPubParams {
  des: string;
  images?: IImgFile[];
  video?: IVideoFile;
}

export interface PubItem {
  account: SocialAccount;
  params: IPubParams;
}

export interface IPublishDialogStore {
  // 选择的发布列表
  pubListChoosed: PubItem[];
  // 所有发布列表
  pubList: PubItem[];
  // 通用发布参数
  commonPubParams: IPubParams;
  // 当前步骤，0=所有账号没有参数，要设置参数。 1=所有账号有参数，详细设置参数
  step: number;
  // 第二部时需要，展开的账户参数
  expandedPubItem?: PubItem;
}

const store: IPublishDialogStore = {
  pubListChoosed: [],
  pubList: [],
  step: 0,
  commonPubParams: {
    des: "",
    video: undefined,
    images: [],
  },
  expandedPubItem: undefined,
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
        setStep(step: number) {
          set({ step });
        },

        // 初始化发布参数
        pubParamsInit(): IPubParams {
          return lodash.cloneDeep(get().commonPubParams);
        },

        // 初始化
        init(account: SocialAccount[]) {
          const pubList: PubItem[] = [];

          account.map((v) => {
            pubList.push({
              account: v,
              params: methods.pubParamsInit(),
            });
          });

          set({
            pubList,
          });
        },

        // 参数设置到所有账户
        setAccountAllParams(pubParmas: Partial<IPubParams>) {
          const pubList = [...get().pubList];
          const commonPubParams = { ...get().commonPubParams };

          for (const key in commonPubParams) {
            if (pubParmas.hasOwnProperty(key)) {
              const keyType = key as "des";
              const val = pubParmas[keyType];
              commonPubParams[keyType] = pubParmas[keyType]!;
              pubList.map((v) => {
                v.params[keyType] = val!;
              });
            }
          }

          set({
            pubList,
            commonPubParams,
          });
        },

        // 设置单个账号的参数
        setOnePubParams(pubParmas: Partial<IPubParams>, accountId: string) {
          const pubList = [...get().pubList];
          const findedData = pubList.find((v) => v.account.id === accountId);
          if (!findedData) return;

          for (const key in pubParmas) {
            if (pubParmas.hasOwnProperty(key)) {
              findedData.params[key as "des"] = pubParmas[key as "des"]!;
            }
          }

          set({
            pubList,
          });
        },

        setPubListChoosed(pubListChoosed: PubItem[]) {
          set({
            pubListChoosed,
          });
        },
        setExpandedPubItem(expandedPubItem: PubItem | undefined) {
          set({
            expandedPubItem,
          });
        },
      };
      return methods;
    },
  ),
);
