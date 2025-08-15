// 创建发布
import { request } from "@/utils/request";
import {
  GetPublishListParams,
  PublishParams,
  PublishRecordItem,
} from "@/api/plat/types/publish.types";
import { parseTopicString } from "@/utils";
import { PlatType } from "@/app/config/platConfig";
import { IPlatOption } from "@/components/PublishDialog/publishDialog.type";

// 根据平台类型过滤option参数
const filterOptionByPlatform = (
  option: IPlatOption,
  accountType: PlatType,
): IPlatOption => {
  if (!option) return {};
  const key = accountType as keyof IPlatOption;
  return option[key] ? ({ [key]: option[key] } as IPlatOption) : {};
};

// 创建发布
export const apiCreatePublish = (data: PublishParams) => {
  const { topics, cleanedString } = parseTopicString(data.desc || "");
  data.topics = [...new Set(data.topics?.concat(topics))];
  data.desc = cleanedString;

  // 根据accountType过滤option参数
  data.option = filterOptionByPlatform(data.option, data.accountType);

  return request({
    url: "plat/publish/create",
    method: "POST",
    data,
  });
};

// 查询发布列表
export const getPublishList = (data: GetPublishListParams) => {
  return request<PublishRecordItem[]>({
    url: "plat/publish/getList",
    method: "POST",
    data,
  });
};

// 修改发布任务时间
export const updatePublishRecordTimeApi = (data: {
  id: string;
  publishTime: string;
}) => {
  return request({
    url: "plat/publish/updateTaskTime",
    method: "POST",
    data,
  });
};

// 删除发布任务
export const deletePublishRecordApi = (id: string) => {
  return request({
    url: `plat/publish/delete/${id}`,
    method: "DELETE",
  });
};

// 立即发布任务
export const nowPubTaskApi = (id: string) => {
  return request({
    url: `plat/publish/nowPubTask/${id}`,
    method: "POST",
  });
};
