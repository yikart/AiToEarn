import { create } from "zustand/index";
import { combine } from "zustand/middleware";
import { SocialAccount } from "@/api/types/account.type";
import FansCount from "./svgs/fansCount.svg";
import CollectCount from "./svgs/collectCount.svg";
import ForwardCount from "./svgs/forwardCount.svg";
import {
  HeartFilled,
  VideoCameraFilled,
  MessageFilled,
} from "@ant-design/icons";

export interface IDataStatisticsStore {
  // 当前选择的账户组IDs
  choosedGroupIds: string[];
  // 过滤之后的账户
  filteredAccountList: SocialAccount[];
  // 数据明细
  dataDetails: {
    title: string;
    value: string;
    icon: any;
    // 总数
    total: number;
    // 昨日数
    yesterday: number;
  }[];
  // 当前选择的明细类型
  currentDetailType: string;
}

const state: IDataStatisticsStore = {
  choosedGroupIds: [],
  filteredAccountList: [],
  dataDetails: [
    {
      title: "涨粉数",
      value: "fansCount",
      icon: FansCount,
      total: 0,
      yesterday: 0,
    },
    {
      title: "播放数",
      value: "readCount",
      icon: VideoCameraFilled,
      total: 0,
      yesterday: 0,
    },
    {
      title: "评论数",
      value: "commentCount",
      icon: MessageFilled,
      total: 0,
      yesterday: 0,
    },
    {
      title: "点赞数",
      value: "likeCount",
      icon: HeartFilled,
      total: 0,
      yesterday: 0,
    },
    {
      title: "收藏数",
      value: "collectCount",
      icon: CollectCount,
      total: 0,
      yesterday: 0,
    },
    {
      title: "分享数",
      value: "forwardCount",
      icon: ForwardCount,
      total: 0,
      yesterday: 0,
    },
  ],
  currentDetailType: "",
};

export const useDataStatisticsStore = create(
  combine(
    {
      ...state,
    },
    (set, get) => {
      const methods = {
        init() {
          set({
            currentDetailType: get().dataDetails[0].value,
          });
        },

        // 设置 currentDetailType
        setCurrentDetailType(currentDetailType: string) {
          set({
            currentDetailType,
          });
        },

        // 设置选择账户组IDs
        setChoosedGroupIds(choosedGroupIds: string[]) {
          set({
            choosedGroupIds,
          });
        },
        // 设置过滤之后的账户
        setFilteredAccountList(filteredAccountList: SocialAccount[]) {
          set({
            filteredAccountList,
          });
        },
      };

      return methods;
    },
  ),
);
