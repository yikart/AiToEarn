// Facebook API接口
import http from "@/utils/request";

export interface FacebookPageItem {
  id: string;
  name: string;
}

export interface FacebookPagesResponse {
  data: FacebookPageItem[];
  code: number;
  message: string;
  url: string;
}

/**
 * 获取Facebook页面列表
 * @param accountId 账户ID
 * @returns
 */
export const apiGetFacebookPages = (accountId: string) => {
  return http.get<FacebookPagesResponse>(
    `plat/meta/facebook/pages`,
  );
};

/**
 * 提交Facebook页面选择
 * @param pageIds 选择的页面ID数组
 * @returns
 */
export const apiSubmitFacebookPages = (pageIds: string[]) => {
  return http.post(`plat/meta/facebook/pages`, {
    pageIds,
  });
}; 