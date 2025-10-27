import { create } from 'zustand';

interface XiaohongshuState {
  loginInfo: {
    cookie?: string;
    userInfo?: {
      authorId: string;
      nickname: string;
      avatar: string;
      fansCount: number;
    };
    localStorage?: string;
  } | null;
  setLoginInfo: (info: any) => void;
  clearLoginInfo: () => void;
}

export const useXiaohongshuStore = create<XiaohongshuState>((set) => ({
  loginInfo: null,
  setLoginInfo: (info) => set({ loginInfo: info }),
  clearLoginInfo: () => set({ loginInfo: null }),
}));
