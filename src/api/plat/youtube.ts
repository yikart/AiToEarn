import { request } from "@/utils/request";
import { YouTubeCategoryItem } from "@/components/PublishDialog/publishDialog.type";

// 获取YouTube国区参数
export const apiGetYouTubeRegions = (account: string) => {
  return request({
    url: "/plat/youtube/common/params",
    method: "GET",
    params: {
      account
    }
  });
};

// 获取YouTube视频分类
export const apiGetYouTubeCategories = (accountId: string, regionCode: string) => {
  return request<YouTubeCategoryItem[]>({
    url: "/plat/youtube/video/categories",
    method: "GET",
    params: {
      accountId,  
      regionCode
    }
  });
}; 