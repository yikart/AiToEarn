import http from "@/utils/request";


// 创建媒体资源组
export const createMediaGroup = (data: {
  title: string;
  desc: string;
  type: 'video' | 'img' | 'audio';
}) => {
  return http.post('/media/group', data);
};

// 删除媒体资源组
export const deleteMediaGroup = (id: string) => {
  return http.delete(`/media/group/${id}`);
};

// 获取媒体资源组列表
export const getMediaGroupList = (pageNo: number, pageSize: number) => {
  return http.get(`/media/group/list/${pageNo}/${pageSize}`);
};

// 更新媒体资源组信息
export const updateMediaGroupInfo = (id: string, data: {
  title?: string;
  desc?: string;
  type?: 'video' | 'img' | 'audio';
}) => {
  return http.post(`/media/group/info/${id}`, data);
}; 


// 创建媒体资源
export const createMedia = (data:any) => {
  return http.post('/media', data);
};

// 删除媒体资源
export const deleteMedia = (id: string) => {
  return http.delete(`/media/${id}`);
};

// 获取媒体资源列表
export const getMediaList = (groupId: string, pageNo: number, pageSize: number) => {
  return http.get(`/media/list/${pageNo}/${pageSize}`, {
    groupId
  });
};

// 更新媒体资源信息
export const updateMediaInfo = (id: string, data: {
  title?: string;
  desc?: string;
}) => {
  return http.put(`/media/info/${id}`, data);
}; 