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
}

export interface IUserStore {
  token?: string;
  userInfo?: UserInfo;
}

const state: IUserStore = {
  token: undefined,
  userInfo: undefined,
};

export const useUserStore = createPersistStore(
  {
    ...state,
  },
  (set, _get) => {
    return {
      setToken: (token: string) => {
        set({ token });
      },
      setUserInfo: (userInfo: UserInfo) => {
        set({ userInfo });
      },
      clearLoginStatus: () => {
        set({ token: undefined, userInfo: undefined });
      },
    };
  },
  {
    name: "User",
  },
);
