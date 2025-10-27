/**
 * 应用下载配置文件
 * 管理不同平台的下载链接、二维码等信息
 */

export interface AppDownloadConfig {
  platform: string;
  appName: string;
  downloadUrl: string;
  qrCodeUrl?: string;
  description: string;
  tips: string[];
}

// 主应用下载配置（默认英文）
export const MAIN_APP_DOWNLOAD_URL = "https://docs.aitoearn.ai/en/downloads";

// 根据语言获取主应用下载地址
// zh-* 使用中文地址，其余使用英文地址
import { useUserStore } from "@/store/user";
export const getMainAppDownloadUrl = (lng?: string): string => {
  const lang = (lng || useUserStore.getState().lang || "zh-CN").toLowerCase();
  const isZh = lang.startsWith("zh");
  return isZh
    ? "https://docs.aitoearn.ai/zh/downloads"
    : "https://docs.aitoearn.ai/en/downloads";
};

export const APP_DOWNLOAD_CONFIGS: Record<string, AppDownloadConfig> = {
  xhs: {
    platform: "小红书",
    appName: "小红书App",
    downloadUrl: "https://apps.apple.com/cn/app/id123456789", // 这里配置实际的下载链接
    qrCodeUrl: "", // 这里配置实际的二维码图片URL
    description: "小红书相关操作需要在移动端App中进行，请下载并安装小红书App后继续操作。",
    tips: [
      "安装完成后，请在App中登录您的账号",
      "确保账号已通过实名认证",
      "在App中完成相关任务操作"
    ]
  },
  douyin: {
    platform: "抖音",
    appName: "抖音App",
    downloadUrl: "https://apps.apple.com/cn/app/douyin/id123456789",
    qrCodeUrl: "",
    description: "抖音相关操作需要在移动端App中进行，请下载并安装抖音App后继续操作。",
    tips: [
      "安装完成后，请在App中登录您的账号",
      "确保账号已通过实名认证",
      "在App中完成相关任务操作"
    ]
  },
  // 可以继续添加其他平台的配置
};

/**
 * 获取平台下载配置
 * @param platformKey 平台标识符，如 'xhs', 'douyin'
 * @returns 下载配置信息
 */
export const getAppDownloadConfig = (platformKey: string): AppDownloadConfig | null => {
  return APP_DOWNLOAD_CONFIGS[platformKey] || null;
};

/**
 * 检查任务是否需要App操作
 * @param accountTypes 账号类型数组
 * @returns 需要App操作的平台列表
 */
export const getTasksRequiringApp = (accountTypes: string[]): string[] => {
  return accountTypes.filter(type => APP_DOWNLOAD_CONFIGS[type]);
};

