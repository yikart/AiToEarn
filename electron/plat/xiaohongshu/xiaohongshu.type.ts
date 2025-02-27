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

interface CommonResponse<T> {
  code: number;
  success: boolean;
  msg: string;
  data: T;
}

interface Poi {
  poi_id: string;
  poi_type: number;
  city_name: string;
  longitude: number;
  type: string;
  address: string;
  name: string;
  full_address: string;
  latitude: number;
}

interface LocationData {
  poi_list: Poi[];
  search_context: string;
}

// 话题列表返回值
export type IXHSTopicsResponse = CommonResponse<TopicsData>;

// 地点列表返回值
export type IXHSLocationResponse = CommonResponse<LocationData>;
