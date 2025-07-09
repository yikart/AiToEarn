// 创建发布
import { request } from "@/utils/request";
import {
  GetPublishListParams,
  PublishListResponse,
  PublishParams,
} from "@/api/plat/types/publish.types";
import { parseTopicString } from "@/utils";

// 创建发布
export const apiCreatePublish = (data: PublishParams) => {
  const { topics, cleanedString } = parseTopicString(data.desc || '');
  data.topics = [...new Set(data.topics?.concat(topics))];
  data.desc = cleanedString;

  return request({
    url: "/plat/publish/create",
    method: "POST",
    data,
  });
};

// 查询发布列表
export const getPublishList = (data: GetPublishListParams) => {
  return request<PublishListResponse>({
    url: "/plat/publish/getList",
    method: "POST",
    data,
  });
};
