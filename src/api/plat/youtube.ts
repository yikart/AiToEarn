import { request } from "@/utils/request";
import { YouTubeCategoryItem } from "@/components/PublishDialog/publishDialog.type";

// 获取YouTube视频分类
export const apiGetYouTubeCategories = (account: string) => {
  return request<YouTubeCategoryItem[]>({
    url: "/plat/youtube/video/categories",
    method: "GET",
    params: {
      account
    }
  });
}; 