// MCP API接口
import { request } from "@/utils/request";



/**
 * 创建MCP Key
 * @param data 创建参数
 * @returns
 */
export const apiCreateMCPKey = (data:any) => {
  return request({
    url: "channel/skKey",
    method: "POST",
    data,
  });
};

/**
 * 更新MCP Key
 * @param data 更新参数
 * @returns
 */
export const apiUpdateMCPKey = (data:any) => {
  return request({
    url: "channel/skKey",
    method: "PUT",
    data,
  });
};

/**
 * 删除MCP Key
 * @param key Key key
 * @returns
 */
export const apiDeleteMCPKey = (key: string) => {
  return request({
    url: `channel/skKey/${key}`,
    method: "DELETE",
  });
};

/**
 * 获取MCP Key详情
 * @param key Key值
 * @returns
 */
export const apiGetMCPKeyInfo = (key: string) => {
  return request<MCPKey>({
    url: `channel/skKey/info/${key}`,
    method: "GET",
  });
};

/**
 * 获取MCP Key列表
 * @param pageNo 页码
 * @param pageSize 每页大小
 * @returns
 */
export const apiGetMCPKeyList = (pageNo: number, pageSize: number) => {
  return request({
    url: `channel/skKey/list/${pageNo}/${pageSize}`,
    method: "GET",
  });
};

/**
 * 创建MCP Key关联
 * @param data 关联参数
 * @returns
 */
export const apiCreateMCPRef = (data: any) => {
  return request({
    url: "channel/skKey/ref",
    method: "POST",
    data,
  });
};

/**
 * 获取MCP Key关联列表
 * @param pageNo 页码
 * @param pageSize 每页大小
 * @returns
 */
export const apiGetMCPRefList = (pageNo: number, pageSize: number) => {
  return request({
    url: `channel/skKey/ref/list/${pageNo}/${pageSize}`,
    method: "GET",
  });
}; 