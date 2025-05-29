import { createPersistStore } from "@/utils/createPersistStore";

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
}

export interface IUserStore {
  token?: string;
  userInfo?: Partial<UserInfo>;
  isAddAccountPorxy: boolean;
}

const state: IUserStore = {
  token: undefined,
  userInfo: {},
  // 添加账户是否默认开启代理
  isAddAccountPorxy: false,
};

export const useUserStore = createPersistStore(
  {
    ...state,
  },
  (set, _get) => {
    const methods = {
      setIsAddAccountPorxy(isAddAccountPorxy: boolean) {
        set({ isAddAccountPorxy });
      },
      setToken: (token: string) => {
        set({ token });
      },
      setUserInfo: (userInfo: UserInfo) => {
        set({ userInfo });
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
