// 获取OSS域名
import { OSS_URL } from "@/constant";

// 获取完整的OSS URL
export const getOssUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("https")) return path;
  return `${OSS_URL}${path}`;
};
