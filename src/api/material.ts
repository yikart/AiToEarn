import http from "@/utils/request";

export enum MaterialType {
  VIDEO = "video", // 视频
  ARTICLE = "article", // 文章
}

export interface MaterialMedia {
  url: string;
  type: MaterialType;
  content?: string;
}

export interface MaterialCreateOption {
  title?: string;
  desc?: string;
  max?: number;
  language?: "中文" | "英文";
}

// 创建素材草稿组
export const apiCreateMaterialGroup = (data: {
  title?: string;
  desc?: string;
  readonly location?: number[];
  readonly publishTime?: string;
  readonly mediaGroups?: string[];
  readonly option?: Record<string, any>;
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
    title?: string;
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
  readonly groupId: string;
  readonly coverUrl?: string;
  mediaList: MaterialMedia[];
  readonly title: string;
  readonly desc?: string;
  readonly option?: Record<string, any>;
}) => {
  return http.post("material", data);
};

// 批量生成草稿素材
export const apiCreateMaterialList = (data: {
  readonly groupId: string;
  readonly num: number;
  readonly option: MaterialCreateOption;
}) => {
  return http.post("material/list", data);
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
