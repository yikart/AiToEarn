import { create } from "zustand";
import { combine } from "zustand/middleware";
import { generateUUID } from "@/utils";
import lodash from "lodash";
import { useAICreateTitleStore } from "../components/AICreateTitle/useAICreateTitle";
import {
  IPubParams,
  IVideoChooseItem,
} from "@/app/[lng]/publish/videoPage/videoPage.type";
import { SocialAccount } from "@/api/types/account.type";
import { PlatType } from "@/app/config/platConfig";
import { VisibleTypeEnum } from "@/app/config/publishConfig";
import { IVideoFile } from "@/app/[lng]/publish/components/Choose/VideoChoose";

export interface IVideoPageStore {
  // 选择的视频数据
  videoListChoose: IVideoChooseItem[];
  // 视频发布设置弹框的 tab选择
  currChooseAccountId: string;
  // 视频发布设置弹框显示隐藏状态
  videoPubSetModalOpen: boolean;
  // 通用发布参数
  commonPubParams: IPubParams;
  // 在视频页的loading状态
  loadingPageLoading: boolean;
  /**
   * 当前操作的ID
   * 每次操作都会分配一个操作ID
   */
  operateId: string;
  // 当前选择的账户数据
  currChooseAccount?: IVideoChooseItem;
}

const store: IVideoPageStore = {
  videoListChoose: [],
  currChooseAccountId: "",
  videoPubSetModalOpen: false,
  commonPubParams: {
    title: "",
    describe: "",
    cover: undefined,
    visibleType: VisibleTypeEnum.Public,
    topics: [],
    timingTime: undefined,
    mixInfo: undefined,
    diffParams: {
      [PlatType.Xhs]: {},
      [PlatType.Douyin]: {
        hotPoint: undefined,
        selfDeclare: undefined,
        activitys: [],
      },
      [PlatType.WxSph]: {
        isOriginal: false,
        extLink: undefined,
        activity: undefined,
      },
    },
  },
  loadingPageLoading: false,
  operateId: "",
  currChooseAccount: undefined,
};

const getStore = () => {
  return lodash.cloneDeep(store);
};

// 视频发布所有组件的共享状态和方法
export const useVideoPageStore = create(
  combine(
    {
      ...getStore(),
    },
    (set, get, storeApi) => {
      const methods = {
        // 设置当前的账户数据
        setCurrChooseAccount(currChooseAccount: IVideoChooseItem) {
          set({
            currChooseAccount,
          });
        },

        // 设置操作ID
        setOperateId(operateId?: string) {
          // if (get().operateId) return;
          set({
            operateId: operateId || generateUUID(),
          });
        },

        // 设置在视频页的loading状态
        setLoadingPageLoading(loadingPageLoading: boolean) {
          set({
            loadingPageLoading,
          });
        },

        // 设置视频发布设置弹框显示隐藏状态
        setVideoPubSetModalOpen(videoPubSetModalOpen: boolean) {
          set({
            videoPubSetModalOpen,
          });
        },

        // 设置发布弹框设置tab选择
        setCurrChooseAccountId(currChooseAccountId: string) {
          set({
            currChooseAccountId,
          });
        },

        // 初始化发布参数
        pubParamsInit(): IPubParams {
          return lodash.cloneDeep(get().commonPubParams);
        },

        // 添加视频数据
        addVideos(videoFiles: IVideoFile[]) {
          const { videoListChoose } = get();
          const newValue = [...get().videoListChoose];
          // 是否所有数据的视频全部为空
          const isAllVideoNull =
            newValue.every((v) => !v.video) && videoFiles.length === 1;
          // 记录视频
          let videoPointer = 0;

          videoListChoose.map((v) => {
            // 有数据缺少视频就填视频
            if (!v.video) {
              if (isAllVideoNull) {
                v.video = videoFiles[0];
              } else {
                const videoFile = videoFiles[videoPointer];
                if (!videoFile) return;
                v.video = videoFile;
              }
              videoPointer++;
            }
          });

          // 填完剩下的视频添加数据
          for (let i = videoPointer; i < videoFiles.length; i++) {
            const videoFile = videoFiles[i];
            const temp = {
              video: videoFile,
              pubParams: methods.pubParamsInit(),
              id: generateUUID(),
            };
            newValue.push(temp);
          }
          set({
            videoListChoose: newValue,
            loadingPageLoading: false,
          });
          setTimeout(() => methods.setVideoCoverFirst(), 10);
        },

        /**
         * 将所有视频设置为首帧封面
         * @param force 不管该条数据的参数是否存在 cover 字段强制覆盖
         */
        setVideoCoverFirst(force?: boolean) {
          const videoListChoose = [...get().videoListChoose];

          videoListChoose.map((v) => {
            if (force) {
              v.pubParams.cover = v.video?.cover;
            } else {
              if (!get().commonPubParams.cover) {
                v.pubParams.cover = v.video?.cover;
              }
            }
          });

          set({
            videoListChoose,
          });
        },

        // 添加账户数据
        addAccount(accounts: SocialAccount[]) {
          const newV = [...get().videoListChoose];
          // 判断是否只有一个视频数据
          const isAloneVideo = !!(newV.length === 1 && newV[0].video);
          /**
           * 已经存在的账户ID做个去重
           * 因为accounts会将所有选择的账户数据传入
           */
          const existAccountsSet = new Set<string>();
          newV.map((v) => v.account && existAccountsSet.add(v.account.id));
          accounts = accounts.filter((v) => !existAccountsSet.has(v.id));

          // 记录账户
          let accountPointer = 0;
          newV.map((v) => {
            // 有数据缺少账户就填账户
            if (!v.account) {
              v.account = accounts[accountPointer];
              accountPointer++;
            }
          });

          // 填完剩下的账户添加数据
          for (let i = accountPointer; i < accounts.length; i++) {
            const video = newV[0].video;
            newV.push({
              account: accounts[i],
              video: isAloneVideo ? video : undefined,
              pubParams: methods.pubParamsInit(),
              id: generateUUID(),
            });
          }

          set({
            videoListChoose: newV,
          });
          setTimeout(() => methods.setVideoCoverFirst(), 10);
        },

        /**
         * 清空视频或账号
         * @param type 0=清空视频，1=清空账号
         */
        clearVideoList(type: 0 | 1) {
          let newValue = [...get().videoListChoose];
          newValue = newValue
            .map((v) => {
              if (type === 0) {
                v.video = undefined;
                return !v.account ? undefined : v;
              } else {
                v.account = undefined;
                return !v.video ? undefined : v;
              }
            })
            .filter(Boolean) as IVideoChooseItem[];
          set({
            videoListChoose: newValue,
          });
        },

        // 清空所有数据
        clear() {
          set({
            ...getStore(),
          });
          useAICreateTitleStore.getState().clear();
        },

        // 删除某个视频
        deleteAloneVideo(id: string) {
          const newValue = [...get().videoListChoose];
          for (const videoChooseItem of newValue) {
            if (id === videoChooseItem.id) {
              videoChooseItem.video = undefined;
              break;
            }
          }
          set({
            videoListChoose: newValue.filter((v) => v.video || v.account),
          });
        },

        // 删除某一条数据
        deleteData(id: string) {
          set({
            videoListChoose: [...get().videoListChoose].filter(
              (v) => v.id !== id,
            ),
          });
        },

        // 单个视频或者账户添加
        aloneAdd({
          video,
          account,
          id,
        }: {
          video?: IVideoFile;
          account?: SocialAccount;
          id: string;
        }) {
          const newValue = [...get().videoListChoose];

          const vci = newValue.find((v) => v.id === id);
          if (!vci) return console.error(`找不到id为 ${id} 个数据`);
          if (video) vci.video = video;
          if (account) vci.account = account;

          set({
            videoListChoose: newValue,
          });
          setTimeout(() => methods.setVideoCoverFirst(), 10);
        },

        // 账户数据批量更新
        updateAccounts({ accounts }: { accounts: SocialAccount[] }) {
          if (!accounts) return;

          const newValue = [...get().videoListChoose];
          if (newValue.length === 0) return;
          // key=账户ID val= videoListChoose item
          const videoListMap = new Map<string, IVideoChooseItem>();

          newValue.map((v) => {
            videoListMap.set(v.account?.id || "0", v);
          });

          accounts.map((v) => {
            const videoItem = videoListMap.get(v.id);
            if (videoItem) videoItem.account = v;
          });

          set({
            videoListChoose: newValue,
          });
        },

        // 设置所有视频数据的发布参数
        setPubParams(pubParmas: IPubParams) {
          const videoListChoose = [...get().videoListChoose];
          const commonPubParams = { ...get().commonPubParams };

          videoListChoose.map((v) => {
            Object.keys(pubParmas).map((key) => {
              if (pubParmas.hasOwnProperty(key)) {
                v.pubParams[key as "title"] = pubParmas[key as "title"];
                commonPubParams[key as "title"] = pubParmas[key as "title"];
              }
            });
          });
          set({
            videoListChoose,
            commonPubParams,
          });
        },

        // 设置单条数据的发布参数
        setOnePubParams(pubParmas: IPubParams, id?: string) {
          const newValue = [...get().videoListChoose];

          const findedData = newValue.find(
            (v) => v.id === (id || get().currChooseAccount!.id),
          );
          if (findedData) {
            for (const key in pubParmas) {
              if (pubParmas.hasOwnProperty(key)) {
                findedData.pubParams[key as "title"] =
                  pubParmas[key as "title"];
              }
            }
          }
          set({
            videoListChoose: newValue,
          });
        },

        /**
         * 账户重新登录。登录成功后会自动更新该条账户数据
         */
        async accountRestart(pType: PlatType) {
          // TODO 重新登录
          // const res = await accountLogin(pType);
          // if (!res) return;
          // console.log(res);
          // message.success("登录成功！");
          // // 更新此条账户数据
          // methods.updateAccounts({ accounts: [res] });
        },
      };
      return methods;
    },
  ),
);
