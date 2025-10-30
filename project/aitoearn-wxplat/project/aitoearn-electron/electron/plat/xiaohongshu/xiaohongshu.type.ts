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

export interface IXHSWorks {
  collected_count: number;
  comments_count: number;
  display_title: string;
  id: string;
  images_list: {
    url: string;
  }[];
  level: number;
  permission_code: number;
  likes: number;
  permission_msg: string;
  schedule_post_time: number;
  shared_count: number;
  sticky: boolean;
  tab_status: number;
  time: string;
  type: string;
  video_info: {
    duration: number;
  };
  view_count: number;
  xsec_source: string;
  xsec_token: string;
}

export type IXHSGetWorksResponse = CommonResponse<{
  page: number;
  notes: IXHSWorks[];
  tags: {
    checked: boolean;
    id: string;
    name: string;
    notes_count: number;
  }[];
}>;

// 搜索用户
export type XiaohongshuApiResponse = CommonResponse<XiaohongshuData>;

// 话题列表返回值
export type IXHSTopicsResponse = CommonResponse<TopicsData>;

// 地点列表返回值
export type IXHSLocationResponse = CommonResponse<LocationData>;

// 评论列表返回值
export type XhsCommentListResponse = {
  code: number; // 0;
  success: boolean; // true;
  msg: string; // '成功';
  data: {
    user_id: string; // '6433a78b000000000e01d2bf';
    comments: [
      {
        note_id: string; // '64477a32000000000800db6b';
        liked: boolean; // false;
        user_info: {
          user_id: string; // '6433a78b000000000e01d2bf';
          nickname: string; // '快乐的不快乐';
          image: string; // 'https://sns-avatar-qc.xhscdn.com/avatar/64469a41b2b360267e424ade.jpg?imageView2/2/w/120/format/jpg';
          xsec_token: string; // 'ABwV2_E6v08_HB53bZla7rsC7W5ZvWpAmbowx4iPyhhTQ=';
        };
        sub_comment_has_more: boolean; // false;
        content: string; // '哈哈哈';
        like_count: string; // '0';
        ip_location: string; // '河北';
        id: string; // '67d028670000000019034092';
        at_users: [];
        show_tags: string[]; // ['is_author'];
        create_time: number; // 1741695080000;
        sub_comment_count: string; // '1';
        sub_comments: {
          status: number; // 0;
          content: string; // '嘿嘿';
          at_users: [];
          liked: false;
          create_time: number; // 1741695086000;
          ip_location: string; // '河北';
          id: string; // '67d0286d0000000019018ff5';
          like_count: string; // '0';
          user_info: {
            user_id: string; // '6433a78b000000000e01d2bf';
            nickname: string; // '快乐的不快乐';
            image: string; // 'https://sns-avatar-qc.xhscdn.com/avatar/64469a41b2b360267e424ade.jpg?imageView2/2/w/120/format/jpg';
            xsec_token: string; // 'ABwV2_E6v08_HB53bZla7rsC7W5ZvWpAmbowx4iPyhhTQ=';
          };
          show_tags: string[]; // ['is_author'];
          target_comment: {
            id: string; // '67d028670000000019034092';
            user_info: {
              image: string; // 'https://sns-avatar-qc.xhscdn.com/avatar/64469a41b2b360267e424ade.jpg?imageView2/2/w/120/format/jpg';
              xsec_token: string; // 'ABwV2_E6v08_HB53bZla7rsC7W5ZvWpAmbowx4iPyhhTQ=';
              user_id: string; // '6433a78b000000000e01d2bf';
              nickname: string; // '快乐的不快乐';
            };
          };
          note_id: string; // '64477a32000000000800db6b';
        }[];
        sub_comment_cursor: string; // '67d0286d0000000019018ff5';
        status: number; // 0;
      },
    ];
    cursor: string; // '67d028670000000019034092';
    has_more: boolean; // false;
    time: number; // 1741951532993;
    xsec_token: string; // 'ABwV2_E6v08_HB53bZla7rsC7W5ZvWpAmbowx4iPyhhTQ=';
  };
};

// 评论作品
export type XhsCommentPostResponse = {
  success: boolean; // true;
  msg: string; // '成功';
  data: {
    comment: {
      show_tags: string[]; // ['is_author'];
      create_time: number; // 1741952083568;
      at_users: string[]; // [];
      liked: boolean; // false;
      user_info: {
        nickname: string; // '快乐的不快乐';
        image: string; // 'https://sns-avatar-qc.xhscdn.com/avatar/64469a41b2b360267e424ade.jpg?imageView2/2/w/120/format/jpg';
        user_id: string; // '6433a78b000000000e01d2bf';
      };
      content: string; // '背景不错';
      like_count: string; // '0';
      ip_location: string; // '河北';
      id: string; // '67d4145300000000190210ba';
      note_id: string; // '64477a32000000000800db6b';
      status: number; // 2;
      target_comment?: {
        // 被回复的评论信息
        id: string; // '67d4145300000000190210ba';
        user_info: {
          user_id: string; // '6433a78b000000000e01d2bf';
          nickname: string; // '快乐的不快乐';
          image: string; // 'https://sns-avatar-qc.xhscdn.com/avatar/64469a41b2b360267e424ade.jpg?imageView2/2/w/120/format/jpg';
        };
      };
    };
    time: number; // 1741952083585;
    toast: string; // '评论已发布'; // 你的回复已发布
  };
  code: number; // 0;
};
