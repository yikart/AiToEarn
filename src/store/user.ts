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
}

const state: IUserStore = {
  token: undefined,
  userInfo: {},
};

export const useUserStore = createPersistStore(
  {
    ...state,
  },
  (set, _get) => {
    const methods = {
      setToken: (token: string) => {
        set({ token });
      },
      setUserInfo: (userInfo: UserInfo) => {
        set({ userInfo });
      },
      clearLoginStatus: () => {
        set({ token: undefined, userInfo: undefined });
      },

      // 登出
      logout() {
        methods.clearLoginStatus();
      },
    };

    return methods;
  },
  {
    name: "User",
  },
);
