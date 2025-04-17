import { createPersistStore } from '@/utils/createPersistStore';
import { IRefreshToken, IUserInfo } from '@/api/types/user-t';
import { userApi } from '@/api/user';
import { StoreKey } from '@/utils/StroeEnum';
import router from '@/router/index';
import { usePubStroe } from './pubStroe';
import { useAccountStore } from './account';

export interface IUserStore {
  userInfo?: IUserInfo;
  token: string;
  overdueTime: number;
  refreshTokenLoading: boolean;
}

const state: IUserStore = {
  userInfo: undefined,
  token: '',
  overdueTime: 0,
  // 是否开始刷新token，防止多次调用
  refreshTokenLoading: false,
};

export const useUserStore = createPersistStore(
  {
    ...state,
  },
  (set, _get) => {
    return {
      // 清除登录状态
      clearLoginStatus() {
        set({ ...state });
        usePubStroe.getState().clear();
        useAccountStore.getState().clear();
      },

      // 退出登录
      logout() {
        this.clearLoginStatus();
        if (window.location.href !== 'login') {
          router.navigate('/login');
        }
      },

      // 获取用户信息
      async getUserInfo(userInfo?: IUserInfo) {
        if (userInfo) {
          set({ userInfo: userInfo });
          return;
        }
        const res = await userApi.getUserInfo();
        console.log('user：', res);
        if (!res) return;
        set({ userInfo: res });
        return res;
      },

      // 设置Token
      setToken({ token, exp }: IRefreshToken) {
        set({ token: token, overdueTime: exp });
      },

      // 检测是否需要刷新token，到过期时间的4小时前前操作就刷新
      refreshTokenDet() {
        if (!_get().token) return;

        if (_get().refreshTokenLoading) return;
        set({ refreshTokenLoading: true });

        if (_get().overdueTime - Date.now() < 60 * 60 * 1000 * 4) {
          userApi.refreshToken().then((res) => {
            set({ refreshTokenLoading: false });
            if (!res) return;
            this.setToken(res);
            this.getUserInfo(res.userInfo);
          });
        }
      },
    };
  },
  {
    name: StoreKey.User,
  },
);
