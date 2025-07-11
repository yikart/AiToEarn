import { create } from "zustand";
import { combine } from "zustand/middleware";
import lodash from "lodash";
import { SocialAccount } from "@/api/types/account.type";
import {
  IPubParams,
  PubItem,
} from "@/components/PublishDialog/publishDialog.type";
import { ErrPubParamsMapType } from "@/components/PublishDialog/hooks/usePubParamsVerify";

export interface IPublishDialogStore {
  // 选择的发布列表
  pubListChoosed: PubItem[];
  // 所有发布列表
  pubList: PubItem[];
  // 通用发布参数
  commonPubParams: IPubParams;
  // 当前步骤，0=所有账号没有参数，要设置参数。 1=所有账号有参数，详细设置参数
  step: number;
  // 第二步时需要，展开的账户参数
  expandedPubItem?: PubItem;
  // 错误提示
  errParamsMap?: ErrPubParamsMapType;
  // 发布时间
  pubTime?: string;
}

const store: IPublishDialogStore = {
  pubListChoosed: [],
  pubTime: undefined,
  pubList: [],
  step: 0,
  commonPubParams: {
    des: "",
    video: undefined,
    images: [],
  },
  expandedPubItem: undefined,
  errParamsMap: undefined,
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
        setErrParamsMap(errParamsMap: ErrPubParamsMapType) {
          set({
            errParamsMap,
          });
        },
        setStep(step: number) {
          set({ step });
        },
        setPubTime(pubTime: string | undefined) {
          set({ pubTime });
        },

        // 清空所有数据
        clear() {
          set({
            ...getStore(),
          });
        },

        // 初始化发布参数
        pubParamsInit(): IPubParams {
          return lodash.cloneDeep(get().commonPubParams);
        },

        /**
         * 初始化
         * @param account
         * @param defaultAccountId 默认选中的账户Id
         */
        init(account: SocialAccount[], defaultAccountId?: string) {
          const pubList: PubItem[] = [];

          account.map((v) => {
            pubList.push({
              account: v,
              params: methods.pubParamsInit(),
            });
          });

          if (defaultAccountId) {
            methods.setPubListChoosed([
              pubList.find((v) => v.account.id === defaultAccountId)!,
            ]);
          }

          set({
            pubList,
          });
        },

        // 参数设置到所有账户
        setAccountAllParams(pubParmas: Partial<IPubParams>) {
          const pubList = [...get().pubList];
          const commonPubParams = { ...get().commonPubParams };
          let pubListChoosed = [...get().pubListChoosed];

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

          pubListChoosed = pubListChoosed.map((v) => {
            const findData = pubList.find((k) => k.account.id === v.account.id);
            if (findData) return findData;
            return v;
          });

          set({
            pubList,
            commonPubParams,
            pubListChoosed,
            expandedPubItem: get().expandedPubItem
              ? pubList.find(
                  (v) => v.account.id === get().expandedPubItem!.account.id,
                )
              : undefined,
          });
        },

        // 设置单个账号的参数
        setOnePubParams(pubParmas: Partial<IPubParams>, accountId: string) {
          const pubList = [...get().pubList];
          let pubListChoosed = [...get().pubListChoosed];
          const findedData = pubList.find((v) => v.account.id === accountId);
          if (!findedData) return;

          for (const key in pubParmas) {
            if (pubParmas.hasOwnProperty(key)) {
              findedData.params[key as "des"] = pubParmas[key as "des"]!;
            }
          }

          pubList.map((v) => {
            if (!pubListChoosed.some((k) => k.account.id === v.account.id)) {
              v.params.des = pubParmas.des || "";
              v.params.video = pubParmas.video;
              v.params.images = pubParmas.images;
            }
          });

          pubListChoosed = pubListChoosed.map((v) => {
            const findData = pubList.find((k) => k.account.id === v.account.id);
            if (findData) return findData;
            return v;
          });

          set({
            pubList,
            pubListChoosed,
            expandedPubItem: get().expandedPubItem
              ? pubList.find(
                  (v) => v.account.id === get().expandedPubItem!.account.id,
                )
              : undefined,
          });
        },
      };
      return methods;
    },
  ),
);
