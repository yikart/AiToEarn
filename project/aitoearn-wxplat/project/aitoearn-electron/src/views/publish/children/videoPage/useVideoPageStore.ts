import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import {
  IPubParams,
  IVideoChooseItem,
} from '@/views/publish/children/videoPage/videoPage';
import { generateUUID } from '@/utils';
import { AccountInfo } from '@/views/account/comment';
import { getVideoFile, IVideoFile } from '@/components/Choose/VideoChoose';
import { accountLogin } from '@/icp/account';
import { PlatType } from '../../../../../commont/AccountEnum';
import { message } from 'antd';
import {
  PubStatus,
  VisibleTypeEnum,
} from '../../../../../commont/publish/PublishEnum';
import lodash from 'lodash';
import { VideoModel } from '../../../../../electron/db/models/video';
import { getImgFile, IImgFile } from '../../../../components/Choose/ImgChoose';
import { useAICreateTitleStore } from '../../components/AICreateTitle/useAICreateTitle';
import { usePubStroe } from '../../../../store/pubStroe';
import { PubRecordModel } from '../../comment';
import { useAccountStore } from '../../../../store/account';

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
  currChooseAccountId: '',
  videoPubSetModalOpen: false,
  commonPubParams: {
    title: '',
    describe: '',
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
  operateId: '',
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
    (_set, get, storeApi) => {
      const set = (data: Partial<IVideoPageStore>) => {
        _set(data);
        if (
          (data.hasOwnProperty('videoListChoose') &&
            data.videoListChoose!.length !== 0) ||
          data.hasOwnProperty('commonPubParams')
        ) {
          usePubStroe.getState().setVideoPubSaveData(get());
        }
      };

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
        addAccount(accounts: AccountInfo[]) {
          const newV = [...get().videoListChoose];
          // 判断是否只有一个视频数据
          const isAloneVideo = !!(newV.length === 1 && newV[0].video);
          /**
           * 已经存在的账户ID做个去重
           * 因为accounts会将所有选择的账户数据传入
           */
          const existAccountsSet = new Set<number>();
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
          account?: AccountInfo;
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
        updateAccounts({ accounts }: { accounts: AccountInfo[] }) {
          if (!accounts) return;

          const newValue = [...get().videoListChoose];
          if (newValue.length === 0) return;
          // key=账户ID val= videoListChoose item
          const videoListMap = new Map<number, IVideoChooseItem>();

          newValue.map((v) => {
            videoListMap.set(v.account?.id || 0, v);
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
                v.pubParams[key as 'title'] = pubParmas[key as 'title'];
                commonPubParams[key as 'title'] = pubParmas[key as 'title'];
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
                findedData.pubParams[key as 'title'] =
                  pubParmas[key as 'title'];
              }
            }
          }
          set({
            videoListChoose: newValue,
          });
        },

        // 根据发布记录重新发布设置参数
        async restartPub(
          pubRecordList: VideoModel[],
          accounts: AccountInfo[],
          pubRecord?: PubRecordModel,
        ) {
          set({
            loadingPageLoading: true,
          });

          const videoListChoose: IVideoChooseItem[] = [];
          let commonPubParams: IPubParams = { ...get().commonPubParams };

          const error = (msg: string) => {
            set({
              loadingPageLoading: false,
            });
            message.error(msg);
          };

          try {
            methods.setOperateId();

            for (const key in commonPubParams) {
              if (pubRecord?.[key as 'title']) {
                commonPubParams[key as 'title'] = pubRecord![key as 'title'];
              }
            }
            commonPubParams['describe'] = pubRecord?.desc;

            if (pubRecord!.commonCoverPath) {
              const cover = await getImgFile(pubRecord!.commonCoverPath);
              commonPubParams = {
                ...commonPubParams,
                cover,
              };
            }

            // key=视频路径 val=视频文件，防止多个相同视频重复取视频文件
            const videoFileMap = new Map<string, IVideoFile>();
            const coverFileMap = new Map<string, IImgFile>();
            const accountList = useAccountStore.getState().accountList;
            for (let i = 0; i < pubRecordList.length; i++) {
              const pubRecord = pubRecordList[i];
              const videoPath = pubRecord.videoPath!;
              const coverPath = pubRecord.coverPath!;
              // 账户数据更新
              const account = accountList.find(
                (account) => account.id === accounts[i].id,
              );

              // 视频获取
              let video: void | IVideoFile;
              if (videoFileMap.has(videoPath)) {
                video = videoFileMap.get(videoPath);
              } else {
                video = await getVideoFile(videoPath).catch((e) => {
                  console.log(e);
                });
              }
              // 封面获取
              let cover: void | IImgFile;
              if (coverFileMap.has(coverPath)) {
                cover = coverFileMap.get(coverPath);
              } else {
                cover = await getImgFile(coverPath).catch((e) => {
                  console.log(e);
                });
              }

              if (!video) return error(`视频获取失败：${videoPath}`);
              if (!cover) return error(`封面获取失败：${coverPath}`);

              videoFileMap.set(videoPath, video);
              coverFileMap.set(coverPath, cover);

              pubRecord.status = PubStatus.UNPUBLISH;
              pubRecord.id = undefined;
              pubRecord.failMsg = undefined;
              pubRecord.dataId = undefined;
              pubRecord.previewVideoLink = undefined;
              pubRecord.previewVideoLink = undefined;

              const pubParams = {
                ...commonPubParams,
                ...pubRecord,
                cover: cover,
                describe: pubRecord.desc,
                id: undefined,
              };

              videoListChoose.push({
                id: generateUUID(),
                account,
                video,
                pubParams,
              });
            }
          } catch (e) {
            console.warn(e);
          }

          set({
            videoListChoose,
            loadingPageLoading: false,
            commonPubParams,
          });
        },

        // 根据视频发布的临时存储记录设置发布参数
        async setTempSaveParams({
          videoListChoose,
          commonPubParams,
          operateId,
        }: {
          videoListChoose: IVideoChooseItem[];
          commonPubParams?: IPubParams;
          operateId?: string;
        }) {
          set({
            loadingPageLoading: true,
          });
          methods.setOperateId(operateId);

          // key=视频路径 val=视频文件，防止多个相同视频重复取视频文件
          const videoFileMap = new Map<string, IVideoFile>();
          const coverFileMap = new Map<string, IImgFile>();
          try {
            const accountList = useAccountStore.getState().accountList;
            // 账户数据更新
            videoListChoose = videoListChoose.map((v) => {
              v.account = accountList.find(
                (account) => v.account?.id === account.id,
              );
              return v;
            });

            if (commonPubParams?.cover?.imgPath) {
              commonPubParams.cover = await getImgFile(
                commonPubParams.cover.imgPath,
              );
            }
            for (const item of videoListChoose) {
              const videoPath = item.video?.videoPath;
              if (videoPath) {
                if (videoFileMap.has(videoPath)) {
                  item.video = videoFileMap.get(videoPath);
                } else {
                  item.video = await getVideoFile(videoPath);
                  videoFileMap.set(item.video.videoPath, item.video);
                }
              }

              const imgPath = item.pubParams.cover?.imgPath;
              if (imgPath) {
                if (coverFileMap.has(imgPath)) {
                  item.pubParams.cover = coverFileMap.get(imgPath);
                } else {
                  item.pubParams.cover = await getImgFile(imgPath);
                  coverFileMap.set(imgPath, item.pubParams.cover);
                }
              }
            }
          } catch (e) {
            console.warn(e);
          }

          set({
            ...(commonPubParams
              ? {
                  commonPubParams,
                }
              : {}),
            videoListChoose,
            loadingPageLoading: false,
          });
        },

        /**
         * 账户重新登录。登录成功后会自动更新该条账户数据
         */
        async accountRestart(pType: PlatType) {
          const res = await accountLogin(pType);
          if (!res) return;
          console.log(res);
          message.success('登录成功！');
          // 更新此条账户数据
          methods.updateAccounts({ accounts: [res] });
        },
      };
      return methods;
    },
  ),
);
