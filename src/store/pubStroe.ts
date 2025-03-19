import { createPersistStore } from '@/utils/createPersistStore';
import { StoreKey } from '@/utils/StroeEnum';
import { IVideoPageStore } from '../views/publish/children/videoPage/useVideoPageStore';
import {
  IPubParams,
  IVideoChooseItem,
} from '../views/publish/children/videoPage/videoPage';

export interface IPubStore {
  // 视频发布保存的数据
  videoPubSaveData: string;
}

const state: IPubStore = {
  videoPubSaveData: '',
};

export const usePubStroe = createPersistStore(
  {
    ...state,
  },
  (set, _get) => {
    return {
      // 设置视频发布保存的数据
      setVideoPubSaveData(data: Partial<IVideoPageStore>) {
        if (data.videoListChoose && data.videoListChoose.length !== 0) {
          set({
            videoPubSaveData: JSON.stringify({
              videoListChoose: data.videoListChoose,
              commonPubParams: data.commonPubParams,
              operateId: data.operateId,
            }),
          });
        }
      },
      // 获取视频发布保存的数据
      getVideoPubSaveData():
        | {
            videoListChoose: IVideoChooseItem[];
            commonPubParams?: IPubParams;
            operateId?: string;
          }
        | undefined {
        if (_get().videoPubSaveData) {
          return JSON.parse(_get().videoPubSaveData);
        }
      },
      // 清空视频发布保存的数据
      clearVideoPubSaveData() {
        set({
          videoPubSaveData: '',
        });
      },
    };
  },
  {
    name: StoreKey.VideoPub,
  },
);
