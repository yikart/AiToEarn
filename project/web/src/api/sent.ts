import { request } from "@/utils/request";
import { SentPostsParams, SentPostsResponse } from "./types/sent.types";

// 获取已发布帖子列表
export const getSentPosts = (params: any) => {
  // return request<SentPostsResponse>({
  //   url: "channel/engagement/posts",
  //   method: "POST",
  //   data: params,
  // });

  return request<SentPostsResponse>({
    url: "plat/publish/posts",
    method: "POST",
    data: params,
  });
};
