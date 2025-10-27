import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import lodash from 'lodash';

interface IAICreateTitleStore {
  /**
   * 视频列表
   * key=视频名称+视频size，value=oss地址
   */
  aiCreateVideoMap: Map<string, string>;
}

const store: IAICreateTitleStore = {
  aiCreateVideoMap: new Map([]),
};

const getStore = () => {
  return lodash.cloneDeep(store);
};

/**
 * 这个store是为了记录 [AICreateTitle.tsx] 组件上传的视频
 * 防止同一个视频被上传多次
 * 注意要在引用该组件的页面销毁后调用这个store的clear方法
 */
export const useAICreateTitleStore = create(
  combine(
    {
      ...store,
    },
    (set, get, storeApi) => {
      const methods = {
        clear() {
          set({
            ...getStore(),
          });
        },

        getVideo(key: string) {
          return get().aiCreateVideoMap.get(key) || '';
        },

        setVideo(key: string, value: string) {
          const aiCreateVideoMap = new Map(get().aiCreateVideoMap);
          aiCreateVideoMap.set(key, value);

          set({
            aiCreateVideoMap,
          });
        },
      };
      return methods;
    },
  ),
);
