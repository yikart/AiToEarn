import { createPersistStore } from "@/utils/createPersistStore";
import { getUserInfoApi } from "@/api/apiReq";

export interface UserInfo {
  createTime: string;
  id: string;
  name: string;
  password: string;
  phone?: string;
  mail: string;
  salt: string;
  status: number;
  updateTime: string;
  _id: string;
  avatar?: string;
  isVip?: boolean;
  score?: number;
  income?: number; // 余额字段
  popularizeCode?: string;
  vipInfo?: {
    id: string;
    expireTime: string;
    startTime: string;
    status: 'none' | 'trialing' | 'monthly_once' | 'yearly_once' | 'active_monthly' | 'active_yearly' | 'active_nonrenewing' | 'expired';
    _id: string;
  };
}

export interface IUserStore {
  token?: string;
  userInfo?: Partial<UserInfo>;
  isAddAccountPorxy: boolean;
  lang: string;
}

const state: IUserStore = {
  token: undefined,
  userInfo: {},
  // 添加账户是否默认开启代理
  isAddAccountPorxy: false,
  lang: "",
};

export const useUserStore = createPersistStore(
  {
    ...state,
  },
  (set, _get) => {
    const methods = {
      // 设置语言
      setLang(lang: string) {
        set({
          lang,
        });
      },
      setIsAddAccountPorxy(isAddAccountPorxy: boolean) {
        set({ isAddAccountPorxy });
      },
      setToken: (token: string) => {
        set({ token });
      },
      setUserInfo: (userInfo: UserInfo) => {
        set({ userInfo });
      },

      // 获取用户信息
      async getUserInfo() {
        const res = await getUserInfoApi();
        if (res) {
          set({
            userInfo: res.data,
          });
        }
      },

      // 清除登录状态
      clearLoginStatus: () => {
        set({ token: undefined, userInfo: undefined });
      },

      // 登出
      logout() {
        methods.clearLoginStatus();
        window.location.href = "/login";
      },
    };

    return methods;
  },
  {
    name: "User",
  },
);
