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
  language?: '中文' | '英文';
}

// 创建素材草稿组
export const createMaterialGroup = (data: {
  title: string;
  desc?: string;
  readonly location?: number[];
  readonly publishTime?: string;
  readonly mediaGroups?: string[];
  readonly option?: Record<string, any>;
}) => {
  return http.post("material/group", data);
};

// 删除草稿素材组
export const deleteMaterialGroup = (id: string) => {
  return http.delete(`material/group/${id}`);
};

// 更新草稿素材组信息
export const updateMaterialGroupInfo = (
  id: string,
  data: {
    title?: string;
    desc?: string;
  },
) => {
  return http.post(`material/group/info/${id}`, data);
};

// 获取草稿素材组列表
export const getMaterialGroupList = (pageNo: number, pageSize: number) => {
  return http.get(`material/group/list/${pageNo}/${pageSize}`);
};

// 创建草稿素材
export const createMaterial = (data: {
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
export const createMaterialList = (data: {
  readonly groupId: string;
  readonly num: number;
  readonly option: MaterialCreateOption;
}) => {
  return http.post("material/list", data);
};

// 删除草稿素材
export const deleteMaterial = (id: string) => {
  return http.delete(`material/${id}`);
};

// 获取草稿素材列表
export const getMaterialList = (
  groupId: string,
  pageNo: number,
  pageSize: number,
) => {
  return http.get(`material/list/${pageNo}/${pageSize}`, {
    groupId,
  });
};

// 更新草稿素材信息
export const updateMaterialInfo = (
  id: string,
  data: {
    title?: string;
    desc?: string;
  },
) => {
  return http.put(`material/info/${id}`, data);
};
