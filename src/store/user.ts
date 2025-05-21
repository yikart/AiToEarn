import { createPersistStore } from "@/utils/createPersistStore";

export interface IUserStore {}

const state: IUserStore = {};

export const useUserStore = createPersistStore(
  {
    ...state,
  },
  (set, _get) => {
    return {};
  },
  {
    name: "User",
  },
);
