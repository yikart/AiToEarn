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
  comment_info_list: {
    comment_id: string; // '@j/do779EQE//uctS8rzvtsh7oymVZyz/K6UlPqVrj61hkia+W5A7RJEoPQpq6PZl0KYgJ8TOofuQDOgXI12wCA==';
    create_time: string; // '1741694473';
    digg_count: string; // '0';
    followed: boolean; // false;
    following: boolean; // false;
    is_author: boolean; // true;
    level: number; // 1;
    reply_count: string; // '0';
    reply_to_user_info: {
      avatar_url: string; // '';
      screen_name: string; // '';
      user_id: string; // '@j/do779EQE//uctS8rvZjLtLqeE8MOypT/Xro3hVZaE=';
    };
    status: number; // 1;
    text: string; // '不知道在哪里学的';
    user_bury: boolean; // false;
    user_digg: boolean; // false;
    user_info: {
      avatar_url: string; // 'https://p3.douyinpic.com/aweme/100x100/aweme-avatar/mosaic-legacy_9bae0021f45bb7d411b0.jpeg?from=2956013662';
      screen_name: string; // '沐墨人';
      user_id: string; // '@j/do779EQE//uctS8rrrvst3qyiRYCHwJpoaCJNev56Vc+YwAlekyGOU0vO5C292';
    };
  }[];
  cursor: number; // 3;
  extra: { now: number }; // 1741874549000 };
  has_more: boolean; // false;
  has_vcd_filter: boolean; // false;
  status_code: number; //  0;
  status_msg: string; // '';
  total_count: number; //  3;
}

// 抖音评论回复列表
export interface DouyinCommentReplyListResponse {
  status_code: 0;
  comments: {
    cid: string; // '7484226055910605622';
    text: string; // ''哈哈哈，[捂脸]，留不长，发质太差了';
    aweme_id: string; // ''7484154434176568630';
    create_time: number; // 1742557174;
    digg_count: number; // 0;
    status: number; // 1;
    user: {
      uid: string; // ''153519948306846';
      short_id: string; // ''2308542007';
      nickname: string; // ''海宝💃';
      signature: string; // ''';
      avatar_larger: {
        uri: string; // ''';
        url_list: string[]; // [];
        width: number; // 720;
        height: number; // 720;
      };
      avatar_thumb: {
        uri: string; // ''100x100/aweme-avatar/tos-cn-i-0813c001_oUDEAA5qhfAx5dAgIewzNvptBoNAuByobAvNC1';
        url_list: string[]; // 'https://p3.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-i-0813c001_oUDEAA5qhfAx5dAgIewzNvptBoNAuByobAvNC1.jpeg?from=2956013662',
        width: number; // 720;
        height: number; // 720;
      };
      avatar_medium: {
        uri: string; // '720x720/aweme-avatar/tos-cn-i-0813c001_oUDEAA5qhfAx5dAgIewzNvptBoNAuByobAvNC1';
        url_list: string[]; // 'https://p3.douyinpic.com/aweme/720x720/aweme-avatar/tos-cn-i-0813c001_oUDEAA5qhfAx5dAgIewzNvptBoNAuByobAvNC1.jpeg?from=2956013662',
        width: number; // 720;
        height: number; // 720;
      };
      is_verified: boolean; // true;
      follow_status: number; // 0;
      aweme_count: number; // 0;
      following_count: number; // 0;
      follower_count: number; // 0;
      favoriting_count: number; // 0;
      total_favorited: number; // 0;
      is_block: boolean; // false;
      hide_search: boolean; // true;
      constellation: number; // 9;
      location: string; // '';
      hide_location: boolean; // false;
      weibo_verify: string; // '';
      custom_verify: string; // '';
      unique_id: string; // 'dyehawbhyehm';
      bind_phone: string; // '';
      special_lock: number; // 1;
      need_recommend: number; // 1;
      is_binded_weibo: boolean; // false;
      weibo_name: string; // '';
      weibo_schema: string; // '';
      weibo_url: string; // '';
      story_open: boolean; // false;
      story_count: number; // 0;
      has_facebook_token: boolean; // false;
      has_twitter_token: boolean; // false;
      fb_expire_time: number; // 0;
      tw_expire_time: number; // 0;
      has_youtube_token: boolean; // false;
      youtube_expire_time: number; // 0;
      room_id: number; // 0;
      live_verify: number; // 2;
      authority_status: number; // 0;
      verify_info: string; // '';
      shield_follow_notice: number; // 0;
      shield_digg_notice: number; // 0;
      shield_comment_notice: number; // 0;
      school_name: string; // '';
      school_poi_id: string; // '';
      school_type: number; // 0;
      with_commerce_entry: boolean; // false;
      verification_type: number; // 1;
      enterprise_verify_reason: string; // '';
      is_ad_fake: boolean; // false;
      followers_detail: null;
      region: string; // 'CN';
      account_region: string; // '';
      sync_to_toutiao: number; //  0;
      live_agreement: number; // 0;
      platform_sync_info: null;
      with_shop_entry: boolean; // false;
      secret: number; // 0;
      has_orders: boolean; // true;
      prevent_download: boolean; // false;
      show_image_bubble: boolean; // false;
      geofencing: any[]; // [];
      unique_id_modify_time: number; // 1742631181;
      video_icon: {
        uri: string; // '';
        url_list: string[];
        width: number; // 720;
        height: number; // 720;
      };
      ins_id: string; // '';
      google_account: string; // '';
      youtube_channel_id: string; // '';
      youtube_channel_title: string; // '';
      apple_account: number; // 0;
      with_dou_entry: boolean; // false;
      with_fusion_shop_entry: boolean; // false;
      is_phone_binded: boolean; // false;
      accept_private_policy: boolean; // false;
      twitter_id: string; // '';
      twitter_name: string; // '';
      user_canceled: boolean; // false;
      has_email: boolean; // false;
      is_gov_media_vip: boolean; // false;
      live_agreement_time: number; // 0;
      status: number; // 1;
      avatar_uri: string; // 'aweme-avatar/tos-cn-i-0813c001_oUDEAA5qhfAx5dAgIewzNvptBoNAuByobAvNC1';
      follower_status: number; // 0;
      neiguang_shield: number; // 0;
      comment_setting: number; // 0;
      duet_setting: number; // 0;
      reflow_page_gid: number; // 0;
      reflow_page_uid: number; // 0;
      user_rate: number; // 1;
      download_setting: number; // -1;
      download_prompt_ts: number; // 0;
      react_setting: number; // 0;
      live_commerce: boolean; // false;
      cover_url: string[]; // [];
      show_gender_strategy: number; // 0;
      language: string; // 'zh-Hans';
      has_insights: boolean; // false;
      item_list: null;
      user_mode: number; // 0;
      user_period: number; // 0;
      has_unread_story: boolean; // false;
      new_story_cover: null;
      is_star: boolean; // false;
      cv_level: string; // '';
      type_label: any; // null;
      ad_cover_url: any; // null;
      comment_filter_status: number; // 0;
      avatar_168x168: {
        uri: string; // '';
        url_list: string[]; // [];
        width: number; // 720;
        height: number; // 720;
      };
      avatar_300x300: {
        uri: string; // '';
        url_list: string[]; //[];
        width: number; // 720;
        height: number; // 720;
      };
      relative_users: any; // null;
      cha_list: any; // null;
      sec_uid: string; // 'MS4wLjABAAAAh24q23iMa0OxvuFitRcT13v6lQJpYWVp7TEZGcuX908';
      urge_detail: {
        user_urged: number; // 0;
      };
      need_points: any; // null;
      homepage_bottom_toast: any; // null;
      can_set_geofencing: any; // null;
      room_id_str: string; // '0';
      white_cover_url: any; // null;
      user_tags: any; // null;
      stitch_setting: number; // 0;
      is_mix_user: boolean; // false;
      enable_nearby_visible: boolean; // true;
      ban_user_functions: any[]; // [];
      aweme_control: {
        can_forward: boolean; // true;
        can_share: boolean; // true;
        can_comment: boolean; // true;
        can_show_comment: boolean; // true;
      };
      user_not_show: number; // 1;
      ky_only_predict: number; // 0;
      user_not_see: number; // 0;
      card_entries: any; // null;
      signature_display_lines: number; // 5;
      display_info: any; // null;
      follower_request_status: number; // 0;
      live_status: number; // 0;
      is_not_show: boolean; // false;
      card_entries_not_display: any; // null;
      card_sort_priority: any; // null;
      show_nearby_active: boolean; // false;
      interest_tags: any; // null;
      school_category: number; // 0;
      search_impr: {
        entity_id: string; // '153519948306846';
      };
      link_item_list: any; // null;
      user_permissions: any; // null;
      offline_info_list: any; // null;
      is_cf: number; // 0;
      is_blocking_v2: boolean; // false;
      is_blocked_v2: boolean; // false;
      close_friend_type: number; // 0;
      signature_extra: any; // null;
      max_follower_count: number; // 0;
      personal_tag_list: any; // null;
      cf_list: any; // null;
      im_role_ids: any; // null;
      not_seen_item_id_list: any; // null;
      user_age: number; // 32;
      contacts_status: number; // 1;
      risk_notice_text: string; // '';
      follower_list_secondary_information_struct: any; // null;
      endorsement_info_list: any; // null;
      text_extra: any; // null;
      contrail_list: any; // null;
      data_label_list: any; // null;
      not_seen_item_id_list_v2: any; // null;
      is_ban: boolean; // false;
      special_people_labels: any; // null;
      special_follow_status: number; // 0;
      familiar_visitor_user: any; // null;
      live_high_value: number; // 0;
      avatar_schema_list: any; // null;
      profile_mob_params: any; // null;
      disable_image_comment_saved: number; // 0;
      verification_permission_ids: any; // null;
      batch_unfollow_relation_desc: any; // null;
      batch_unfollow_contain_tabs: any; // null;
      creator_tag_list: any; // null;
      private_relation_list: any; // null;
      mate_add_permission: number; // 0;
      familiar_confidence: number; // 0;
      mate_count: number; // 0;
      follower_count_str: string; // '';
      social_real_relation_type: number; // 0;
    };
    reply_id: string; // '7484209708376032050';
    user_digged: number; // 0;
    reply_comment: any; // null;
    text_extra: string[];
    label_text: string; // '作者';
    label_type: number; // 1;
    reply_to_reply_id: string; // '0';
    is_author_digged: boolean; // false;
    user_buried: boolean; // false;
    label_list: any; // null;
    is_hot: boolean; // false;
    text_music_info: any; // null;
    image_list: any; // null;
    is_note_comment: number; // 0;
    root_comment_id: string; // '7484226055910605622';
    can_share: boolean; // true;
    level: number; // 2;
    comment_reply_total: number; // 1;
    video_list: any; // null;
    content_type: number; // 1;
    is_folded: boolean; // false;
  }[];
  cursor: number; // 10;
  has_more: number; // 0;
  total: number; // 1;
  extra: {
    now: number; // 1742631181000;
    fatal_item_ids: any; // null;
  };
  log_pb: {
    impr_id: string; // '20250322161300615408A9FEC29A97BD28';
  };
}

export interface DouyinNewCommentResponse {
  comment_info: {
    comment_id: string; // '@j/Jr6bdET0rxssxd57/to896qi+WZSz3LqQlN6Nuja9BugWjRo0mWYw1IBd39et4ggwDVwRptqsgeUQSJiFcAg==';
    create_time: string; // '1741955069';
    digg_count: string; // '0';
    followed: boolean; // false;
    following: boolean; // false;
    is_author: boolean; // true;
    level: number; // 1 | 2; // 第几层
    reply_count: string; // '0';
    status: number; // 7;
    text: string; // '天真蓝';
    user_digg: boolean; // false;
    user_info: {
      avatar_url: string; // 'https://p11.douyinpic.com/aweme/720x720/aweme-avatar/tos-cn-i-0813c001_oUDEAA5qhfAx5dAgIewzNvptBoNAuByobAvNC1.jpeg?from=4010531038';
      screen_name: string; // '海宝💃';
      user_id: string; // '@j/Jr6bdET0rxssxd57/to8l7oSuRbyDzJ64tOaxtjpj2c9bt4zgRjBU4l2s/OnM0';
    };
  };
  extra: {
    now: number; // 1741955069000;
  };
  status_code: number; // 0;
  status_msg: string; // '';
}

// 合集数据
export interface DouyinGetMixListResponse {
  total: number;
  status_code: number;
  mix_list: {
    author: DouyinUser;
    cover_url: {
      uri: string;
      url_list: string[];
    };
    statis: {
      collect_vv: number;
      current_episode: number;
      play_vv: number;
      updated_to_episode: number;
    };
    status: {
      is_collected: number;
      status: number;
    };
    mix_name: string;
    mix_id: string;
    ban_episode_count: number;
  }[];
}
