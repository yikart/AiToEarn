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

interface XiaohongshuUserBaseDTO {
  desc: string;
  image_size_large: string;
  followed: boolean;
  show_red_official_verify_icon: boolean;
  red_id: string;
  user_id: string;
  user_nickname: string;
  image: string;
  red_official_verified: boolean;
  red_official_verify_type: number;
}

interface XiaohongshuUserInfoDTO {
  user_base_dto: XiaohongshuUserBaseDTO;
  fans_total: number;
  discovery_total: number;
}

interface XiaohongshuResult {
  success: boolean;
  code: number;
  message: string;
}

interface XiaohongshuData {
  result: XiaohongshuResult;
  user_info_dtos: XiaohongshuUserInfoDTO[];
}

// 搜索用户
export type XiaohongshuApiResponse = CommonResponse<XiaohongshuData>;

// 话题列表返回值
export type IXHSTopicsResponse = CommonResponse<TopicsData>;

// 地点列表返回值
export type IXHSLocationResponse = CommonResponse<LocationData>;
