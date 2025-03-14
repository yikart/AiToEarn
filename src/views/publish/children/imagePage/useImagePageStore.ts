import { create } from 'zustand';
import { combine } from 'zustand/middleware';

interface IVideoPageStore {}

const store: IVideoPageStore = {};

// 视频发布所有组件的共享状态和方法
export const useImagePageStore = create(
  combine(
    {
      ...store,
    },
    (set, get, storeApi) => {
      const methods = {};
      return methods;
    },
  ),
);
