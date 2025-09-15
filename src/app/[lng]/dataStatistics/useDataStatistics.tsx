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
import dayjs, { Dayjs } from "dayjs";
import { getStatisticsPeriodApi } from "@/api/dataStatistics";
import { StatisticsPeriodModel } from "@/api/types/dataStatistics";
import { message } from "antd";
import drawDataStatisticsEchartLine from "@/app/[lng]/dataStatistics/echart/drawDataStatisticsEchartLine";
import { directTrans } from "@/app/i18n/client";
import { AccountPlatInfoMap, PlatType } from "@/app/config/platConfig";

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
  // 账号搜索value
  accountSearchValue: string;
  // 日期范围
  timeRangeValue: [Dayjs, Dayjs];
  // 源数据
  originData?: StatisticsPeriodModel;
  // loading
  loading: boolean;
  // echart 数据，直接适配 ECharts 格式
  echartData: {
    legend: string[];
    xAxis: string[];
    series: {
      name: string;
      type: string;
      stack: string;
      data: number[];
    }[];
  };
}

const state: IDataStatisticsStore = {
  accountSearchValue: "",
  choosedGroupIds: [],
  filteredAccountList: [],
  dataDetails: [],
  currentDetailType: "",
  timeRangeValue: [dayjs().subtract(7, "day"), dayjs()],
  loading: false,
  originData: undefined,
  echartData: {
    legend: [],
    xAxis: [],
    series: [],
  },
};

export const useDataStatisticsStore = create(
  combine(
    {
      ...state,
    },
    (set, get) => {
      const methods = {
        async init() {
          const dataDetails = [
            {
              title: directTrans("dataStatistics", "growthFansCount"),
              value: "fansCount",
              icon: FansCount,
              total: 0,
              yesterday: 0,
            },
            {
              title: directTrans("dataStatistics", "readCount"),
              value: "readCount",
              icon: VideoCameraFilled,
              total: 0,
              yesterday: 0,
            },
            {
              title: directTrans("dataStatistics", "commentCount"),
              value: "commentCount",
              icon: MessageFilled,
              total: 0,
              yesterday: 0,
            },
            {
              title: directTrans("dataStatistics", "likeCount"),
              value: "likeCount",
              icon: HeartFilled,
              total: 0,
              yesterday: 0,
            },
            {
              title: directTrans("dataStatistics", "collectCount"),
              value: "collectCount",
              icon: CollectCount,
              total: 0,
              yesterday: 0,
            },
            {
              title: directTrans("dataStatistics", "forwardCount"),
              value: "forwardCount",
              icon: ForwardCount,
              total: 0,
              yesterday: 0,
            },
          ];

          set({
            dataDetails,
            currentDetailType: dataDetails[0].value,
          });
        },

        // 获取数据统计
        async getStatistics() {
          if (get().filteredAccountList.length === 0) {
            return;
          }

          set({
            loading: true,
          });
          // 过滤掉无效的account和account.type
          const validAccounts = get().filteredAccountList.filter(
            (account) => account && account.type && account.uid,
          );
          const res = await getStatisticsPeriodApi({
            startDate: get().timeRangeValue[0].format("YYYY-MM-DD"),
            endDate: get().timeRangeValue[1].format("YYYY-MM-DD"),
            queries: validAccounts.map((account) => ({
              platform: account.type,
              uid: account.uid,
            })),
          });
          set({
            loading: false,
          });

          if (!res || !res.data) {
            message.error("获取数据统计失败，请稍后重试");
            return;
          }
          set({
            originData: res.data,
          });

          methods.sortingData();
        },

        // 分拣数据
        sortingData() {
          const data = get().originData;

          if (!data) return;

          // 1. 汇总各指标总数
          const metrics = get().dataDetails.map((e) => e.value);
          const totals: Record<string, number> = {};
          metrics.forEach((m) => (totals[m] = 0));

          data.groupedByDate.forEach((day) => {
            day.records.forEach((rec) => {
              metrics.forEach((m) => {
                // @ts-ignore
                totals[m] += rec[m] ?? 0;
              });
            });
          });

          set({
            dataDetails: get().dataDetails.map((item) => ({
              ...item,
              total: totals[item.value] ?? 0,
            })),
          });

          // 2. 生成 ECharts 适配数据
          const currentField = get().currentDetailType;

          // 日期
          const dates = Array.from(
            new Set(data.groupedByDate.map((e) => e.date)),
          ).sort();
          const dateIndex: Record<string, number> = {};
          dates.forEach((d, i) => (dateIndex[d] = i));

          // 平台
          const platformSet = new Set<string>();
          data.groupedByDate.forEach((g) =>
            g.records.forEach((r) => platformSet.add(r.platform)),
          );
          const platforms = Array.from(platformSet).sort() as PlatType[];

          // 初始化矩阵
          const chartData: Record<string, number[]> = {};
          platforms.forEach(
            (p) => (chartData[p] = Array(dates.length).fill(0)),
          );

          // 填充数据
          data.groupedByDate.forEach((g) => {
            const dIdx = dateIndex[g.date];
            g.records.forEach((r) => {
              const p = r.platform;
              if (chartData[p]) {
                // @ts-ignore
                chartData[p][dIdx] = r[currentField] ?? 0;
              }
            });
          });

          // 组装 ECharts 格式
          const legend = platforms.map(
            (v) => AccountPlatInfoMap.get(v)?.name || v,
          );
          const xAxis = dates;
          const series = platforms.map((p) => ({
            name: AccountPlatInfoMap.get(p)?.name || p,
            type: "line",
            stack: "Total",
            data: chartData[p],
          }));

          set({
            echartData: {
              legend,
              xAxis,
              series,
            },
          });

          drawDataStatisticsEchartLine("dataStatisticsEchartLine");
        },

        // 设置 timeRangeValue
        setTimeRangeValue(timeRangeValue: [Dayjs, Dayjs]) {
          set({
            timeRangeValue,
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
        // 设置 accountSearchValue
        setAccountSearchValue(accountSearchValue: string) {
          set({
            accountSearchValue,
          });
        },
      };

      return methods;
    },
  ),
);
