interface TopicsInfoDto {
  view_num: number;
  type: string;
  smart: boolean;
  id: string;
  name: string;
  link: string;
}

interface TopicsResult {
  success: boolean;
}

interface TopicsData {
  topic_info_dtos: TopicsInfoDto[];
  result: TopicsResult;
}

// 话题接口返回数据
export interface IXHSTopicsResponse {
  code: number;
  success: boolean;
  msg: string;
  data: TopicsData;
}
