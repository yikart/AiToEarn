import http from "@/utils/request";
import { PubType } from "@/app/config/publishConfig";

export interface MaterialMedia {
  url: string;
  type: PubType;
  content?: string;
}

export interface NewMaterialTask {
  groupId: string;
  num: number;
  aiModelTag: string;
  prompt: string;
  title?: string;
  desc?: string;
  location?: number[];
  publishTime?: string;
  mediaGroups: string[];
  coverGroup: string;
  option?: Record<string, any>;
  textMax?: number;
  language?: "中文" | "英文";
}

// 创建素材草稿组
export const apiCreateMaterialGroup = (data: {
  type: PubType;
  name: string;
  desc?: string;
}) => {
  return http.post("material/group", data);
};

// 删除草稿素材组
export const apiDeleteMaterialGroup = (id: string) => {
  return http.delete(`material/group/${id}`);
};

// 更新草稿素材组信息
export const apiUpdateMaterialGroupInfo = (
  id: string,
  data: {
    name?: string;
    desc?: string;
  },
) => {
  return http.post(`material/group/info/${id}`, data);
};

// 获取草稿素材组列表
export const apiGetMaterialGroupList = (pageNo: number, pageSize: number) => {
  return http.get<{ list: any[]; total: number }>(
    `material/group/list/${pageNo}/${pageSize}`,
  );
};

// 创建草稿素材
export const apiCreateMaterial = (data: {
  groupId: string;
  coverUrl?: string;
  mediaList: MaterialMedia[];
  title: string;
  desc?: string;
  option?: Record<string, any>;
  location?: number[];
}) => {
  return http.post("material", data);
};

// 创建批量生成草稿任务
export const apiCreateMaterialTask = (data: NewMaterialTask) => {
  return http.post<{ _id: string }>("material/task/create", data);
};

// 预览生成草稿任务
export const apiPreviewMaterialTask = (taskId: string) => {
  return http.get(`material/task/preview/${taskId}`);
};

// 开始批量生成草稿任务
export const apiStartMaterialTask = (taskId: string) => {
  return http.get(`material/task/start/${taskId}`);
};

// 删除草稿素材
export const apiDeleteMaterial = (id: string) => {
  return http.delete(`material/${id}`);
};

// 获取草稿素材列表
export const apiGetMaterialList = (
  groupId: string,
  pageNo: number,
  pageSize: number,
) => {
  return http.get(`material/list/${pageNo}/${pageSize}`, {
    groupId,
  });
};

// 更新草稿素材信息
export const apiUpdateMaterialInfo = (
  id: string,
  data: {
    title?: string;
    desc?: string;
  },
) => {
  return http.put(`material/info/${id}`, data);
};

// 更新草稿素材完整信息
export const apiUpdateMaterial = (
  id: string,
  data: {
    coverUrl?: string;
    mediaList?: MaterialMedia[];
    title?: string;
    desc?: string;
    location?: number[];
    option?: Record<string, any>;
  },
) => {
  return http.put(`material/info/${id}`, data);
};
