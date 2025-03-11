interface TopicSug {
  cha_name: string;
  view_count: number;
  cid: string;
  group_id: string;
  tag: number;
}

interface WordsQueryRecord {
  info: string;
  words_source: string;
  query_id: string;
}

interface Extra {
  now: number;
  logid: string;
  fatal_item_ids: any[];
  search_request_id: string;
}

interface LogPb {
  impr_id: string;
}

interface AddressInfo {
  ad_code_v2: string;
  addr_with_extra_info: string;
  address: string;
  city: string;
  city_code: string;
  district: string;
  im_addr: string;
  province: string;
  simple_addr: string;
}

interface Cover {
  uri: string;
  url_list: string[];
}

interface Icon {
  uri: string;
  url_list: string[];
}

interface LifeCommerceInfo {
  simple_addr_str: string;
}

interface PoiBackendType {
  code: string;
  content: string;
  l1_name: string;
  l2_name: string;
  l3_name: string;
  name: string;
}

interface PoiFrontendType {
  code: string;
  name: string;
}

interface ShareInfo {
  bool_persist: number;
  share_title: string;
  share_url: string;
  share_weibo_desc: string;
}

interface Poi {
  Staturated_tags: any;
  address_info: AddressInfo;
  anchor_post_ext: {
    is_recommend: boolean;
  };
  business_area_name: string;
  channel_exclusive: any;
  collect_stat: number;
  collected_count: string;
  cost: number;
  cover_hd: Cover;
  cover_item: Cover;
  cover_large: Cover;
  cover_medium: Cover;
  cover_thumb: Cover;
  cps_commission_rate_range: any;
  cps_commission_value_range: any;
  distance: string;
  effect_ids: string[];
  expand_type: number;
  fulfill_task_list: any;
  icon_on_entry: Icon;
  icon_on_info: Icon;
  icon_on_map: Icon;
  icon_service_type_list: any;
  icon_type: number;
  is_admin_area: boolean;
  is_commerce_intention: boolean;
  item_count: number;
  life_commerce_info: LifeCommerceInfo;
  poi_backend_type: PoiBackendType;
  poi_detail_tags: any;
  poi_frontend_type: PoiFrontendType[];
  poi_id: string;
  poi_latitude: number;
  poi_latitude_gcj02: number;
  poi_longitude: number;
  poi_longitude_gcj02: number;
  poi_name: string;
  poi_ranks: any;
  poi_search_tags: any;
  poi_search_tags_v2: any;
  poi_type: number;
  poi_voucher: string;
  service_type_list: any;
  share_info: ShareInfo;
  show_type: number;
  simple_address_str: string;
  type_code: string;
  user_count: number;
  view_count: string;
  voucher_release_areas: any[];
  with_recommend_tag: number;
}

interface ContentTab {
  default_tab: number;
  tab_list: number[];
}

interface GuideInfo {
  guide_text_after: string;
  guide_text_before: string;
  guide_url: string;
}

interface DriftInfo {
  score: number;
  timestamp: number;
}

interface Cover {
  uri: string;
  url_list: string[];
}

export interface DouyinActivity {
  activity_id: string;
  activity_level: number;
  activity_name: string;
  activity_status: number;
  activity_type: number;
  challenge: string[];
  challenge_ids: number[];
  collect_id: number;
  collect_status: boolean;
  cover_image: string;
  game_id: string;
  hot_score: number;
  if_well_chosen: boolean;
  jump_link: string;
  jump_type: number;
  query_tag: number;
  reward_type: number;
  show_end_time: string;
  show_start_time: string;
}

interface Video {
  big_thumbs?: any;
  bit_rate?: any;
  cover: Cover;
  duration: number;
}

export interface DouyinHotSentence {
  aweme_infos: any;
  challenge_id: string;
  display_style: number;
  drift_info: DriftInfo[];
  event_time: number;
  group_id: string;
  hot_value: number;
  hotlist_param: string;
  label: number;
  related_words: any;
  sentence_id: string;
  video_count: number;
  word: string;
  word_cover: Cover;
  word_sub_board: any;
  word_type: number;
}

interface ActivityInfo {
  activity_id: string;
  activity_level: number;
  activity_name: string;
  activity_status: number;
  activity_type: number;
  challenge?: any;
  challenge_ids: number[];
  collect_id: number;
  collect_status: boolean;
  cover_image: string;
  game_id: string;
  hot_score: number;
  if_well_chosen: boolean;
  jump_link: string;
  jump_type: number;
  post_url: string;
  query_tag: number;
  reward_type: number;
  show_end_time: string;
  show_start_time: string;
}

interface DouyinUser {
  avatar_larger: Avatar;
  avatar_medium: Avatar;
  avatar_thumb: Avatar;
  aweme_count: number;
  card_entries: any;
  custom_verify: string;
  enterprise_verify_reason: string;
  favoriting_count: number;
  follow_status: number;
  follower_count: number;
  follower_status: number;
  followers_detail: any;
  following_count: number;
  geofencing: any;
  has_orders: boolean;
  is_ad_fake: boolean;
  is_gov_media_vip: boolean;
  mix_info: any;
  nickname: string;
  original_musician: OriginalMusician;
  platform_sync_info: any;
  policy_version: any;
  rate: number;
  region: string;
  sec_uid: string;
  secret: number;
  short_id: string;
  signature: string;
  status: number;
  story_open: boolean;
  total_favorited: string;
  type_label: any[];
  uid: string;
  unique_id: string;
  user_canceled: boolean;
  verification_type: number;
  video_icon: VideoIcon;
  with_commerce_entry: boolean;
  with_fusion_shop_entry: boolean;
  with_shop_entry: boolean;
}

interface Avatar {
  uri: string;
  url_list: string[];
}

interface OriginalMusician {
  music_count: number;
  music_used_count: number;
}

interface VideoIcon {
  uri: string;
  url_list: string[];
}

export interface DemoVideo {
  aweme_id: string;
  cha_list?: any;
  chapter_bar_color?: any;
  chapter_list?: any;
  comment_list?: any;
  geofencing?: any;
  image_infos?: any;
  images?: any;
  img_bitrate?: any;
  interaction_stickers?: any;
  label_top_text?: any;
  long_video?: any;
  promotions?: any;
  text_extra?: any;
  video: Video;
  video_labels?: any;
  video_text?: any;
}

// 抖音活动详情接口的返回值
export interface DouyinActivityDetailResponse {
  activity_description: string;
  activity_info: ActivityInfo;
  demo_videos: DemoVideo[];
  extra: Extra;
  my_publish_videos: any;
  other_publish_videos: any;
  publish_end_time: string;
  publish_start_time: string;
  reward_rules: string;
  status_code: number;
  topics: string[];
  topics_ids: string[];
}

// 抖音活动标签item
export interface DouyinQueryTags {
  id: number;
  name: string;
}

// 抖音活动标签返回数据
export interface DouyinActivityTagsResponse {
  status_code: number;
  extra: Extra;
  query_tags: DouyinQueryTags[];
}

// 抖音活动列表
export interface DouyinActivityListResponse {
  activity_list: DouyinActivity[];
  extra: Extra;
  status_code: number;
}

// 抖音的热点数据
export interface DouyinHotDataResponse {
  extra: Extra;
  log_pb: LogPb;
  sentences: DouyinHotSentence[];
  status_code: number;
}

// 抖音的所有热点数据
export interface DouyinAllHotDataResponse {
  extra: Extra;
  log_pb: LogPb;
  all_sentences: DouyinHotSentence[];
  status_code: number;
}

// 抖音的话题数据
export interface DouyinTopicsSugResponse {
  sug_list: TopicSug[];
  status_code: number;
  status_msg: string;
  rid: string;
  words_query_record: WordsQueryRecord;
  extra: Extra;
  log_pb: LogPb;
}

// 抖音的位置数据
export interface DouyinLocationDataResponse {
  ab_param_extra: string;
  content_tab: ContentTab;
  current_locs: any[];
  extra: Extra;
  guide_info: GuideInfo;
  has_keyuser_combo_entrance: boolean;
  has_more: number;
  has_promote_auth: boolean;
  log_pb: LogPb;
  page: number;
  poi_activity: any;
  poi_list: Poi[];
  poi_search_range: number[];
  post_role: number;
  show_filter_option: boolean;
  show_guide: boolean;
  show_new_merchant_guide: boolean;
  status_code: number;
  status_msg: string;
  user_interest_city_code_list: any;
}

// 抖音用户数据
export interface DouyinUserListResponse {
  challenge_list: any[];
  cursor: number;
  extra: Extra;
  has_more: boolean;
  scene: number;
  status_code: number;
  user_list: DouyinUser[];
}

// 抖音作品列表
export interface DouyinCreatorListResponse {
  extra: Extra;
  status_code: number; // 0
  status_msg: string;
  has_more: boolean;
  item_info_list: {
    anchor_user_id: string;
    cursor: string;
    comment_count: number; // 回复数量
    cover_image_url: string; // 'https://p3-sign.douyinpic.com/c5d200033ae82940b280~tplv-dy-resize-walign-adapt-aq:540:q75.jpeg?lk3s=138a59ce&x-expires=1742889600&x-signature=jcYpgxENZDa38hHUHNFfpcAPUDs%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=cover&biz_tag=aweme_video&l=20250311165957E85797DDC3B0DA04AEBA';
    create_time: string; // '发布于2018年09月23日 17:51';
    creator_item_setting: {
      charge_comment_audit: boolean; // 收费评论审计
    };
    duration: number;
    item_id: string; //  '@j/do779EQE//uctS8r3tvsx9pyuRYyn/J6krPKNgjq9hkia+W5A7RJEoPQpq6PZlQedr6LX3XaKU0Yc8jcykog==';
    item_id_plain: string; // '6604355150884637966';
    item_link: string; // 'https://www.iesdouyin.com/share/video/6604355150884637966/?region=CN&mid=6568746752824380174&u_code=16b4ji55k&did=MS4wLjABAAAANwkJuWIRFOzg5uCpDRpMj4OX-QryoDgn-yYlXQnRwQQ&iid=MS4wLjABAAAANwkJuWIRFOzg5uCpDRpMj4OX-QryoDgn-yYlXQnRwQQ&with_sec_did=1&video_share_track_ver=&titleType=&share_sign=qwbHwbUn9.rqVOBIpmIak8F4W9CXvvE18GzpMaAUfyU-&share_version=210100&ts=1741683597&from_aid=1128&from_ssr=1';
    media_type: number; //  4;
    title: string; // '';
  }[];
  total_count: number;
}

// 抖音作品评论列表
export interface DouyinCreatorCommentListResponse {
  extra: Extra;
  status_code: number; // 0
  status_msg: string;
  has_more: boolean;
  item_info_list: {
    anchor_user_id: string;
    cursor: string;
    comment_count: number; // 回复数量
    cover_image_url: string; // 'https://p3-sign.douyinpic.com/c5d200033ae82940b280~tplv-dy-resize-walign-adapt-aq:540:q75.jpeg?lk3s=138a59ce&x-expires=1742889600&x-signature=jcYpgxENZDa38hHUHNFfpcAPUDs%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=cover&biz_tag=aweme_video&l=20250311165957E85797DDC3B0DA04AEBA';
    create_time: string; // '发布于2018年09月23日 17:51';
    creator_item_setting: {
      charge_comment_audit: boolean; // 收费评论审计
    };
    duration: number;
    item_id: string; //  '@j/do779EQE//uctS8r3tvsx9pyuRYyn/J6krPKNgjq9hkia+W5A7RJEoPQpq6PZlQedr6LX3XaKU0Yc8jcykog==';
    item_id_plain: string; // '6604355150884637966';
    item_link: string; // 'https://www.iesdouyin.com/share/video/6604355150884637966/?region=CN&mid=6568746752824380174&u_code=16b4ji55k&did=MS4wLjABAAAANwkJuWIRFOzg5uCpDRpMj4OX-QryoDgn-yYlXQnRwQQ&iid=MS4wLjABAAAANwkJuWIRFOzg5uCpDRpMj4OX-QryoDgn-yYlXQnRwQQ&with_sec_did=1&video_share_track_ver=&titleType=&share_sign=qwbHwbUn9.rqVOBIpmIak8F4W9CXvvE18GzpMaAUfyU-&share_version=210100&ts=1741683597&from_aid=1128&from_ssr=1';
    media_type: number; //  4;
    title: string; // '';
  }[];
  total_count: number;
}
