import http from "@/utils/request";
import {
  StatisticsPeriodApiParams,
  StatisticsPeriodModel,
} from "@/api/types/dataStatistics";

// 获取数据统计信息
export const getStatisticsPeriodApi = (data: StatisticsPeriodApiParams) => {
  return http.post<StatisticsPeriodModel>(
    "statistics/channels/period-batch",
    data,
  );
};

// 获取抖音话题
export const getDouyinTopicsApi = (keyword: string) => {
  return http.post<string[]>("statistics/channels/douyin/searchTopic", {
    topic: keyword,
    language: "en",
  });
};
