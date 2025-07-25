import dayjs from "dayjs";
import { message } from "antd";
/**
 * 生成唯一ID
 */
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 等待n毫秒
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 获取文件路径中的文件名和后缀
export const getFilePathName = (path: string) => {
  if (!path)
    return {
      filename: "",
      suffix: "",
    };
  const path1 = path.split("\\")[path.split("\\").length - 1];
  const filename = path1.split("/")[path1.split("/").length - 1];
  return {
    filename,
    suffix: filename.split(".")[filename.split(".").length - 1],
  };
};

// 格式化时间
export function formatTime(
  time: string | number | Date,
  format: string = "YYYY-MM-DD HH:mm:ss",
) {
  return dayjs(time).format(format);
}

/**
 * 将数值转换为 hh:mm:ss 格式的字符串
 * 7 -> 00:00:07
 * @param seconds - 要转换的秒数
 * @returns 格式化后的时间字符串
 */
export function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const pad = (num: number) => num.toString().padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
}

/**
 * 根据输入数值返回中文描述
 * @param value 输入的数值
 * @returns 如果数值超过1000返回'n千'，超过10000返回'n万'
 */
export function describeNumber(value: number): string {
  if (value > 10000) {
    // 数值超过10000，返回'n万'
    const wan = Math.floor(value / 10000);
    return `${wan}万`;
  } else if (value > 1000) {
    // 数值超过1000，返回'n千'
    const qian = Math.floor(value / 1000);
    return `${qian}千`;
  } else {
    // 数值不超过1000，直接返回数值的字符串形式
    return value.toString();
  }
}

// 去除字符串中的话题
export function parseTopicString(input: string): {
  topics: string[];
  cleanedString: string;
} {
  // 使用正则表达式提取字符串中的部分
  const extractedParts = input.match(/#(\S+)/g) || [];

  // 在原始输入中用空字符串替换提取的部分
  let cleanedString = input;
  extractedParts.forEach((part) => {
    cleanedString = cleanedString.replace(part, "").trim();
  });

  // 创建提取的话题数组
  const topics = extractedParts.map((part) => {
    const match = part.match(/#(\S+)/);
    return match ? match[1] : "";
  });

  return { topics, cleanedString };
}

// 敏感词检测-多余检测动画
export async function sensitivityLoading() {
  const key = generateUUID();
  const msgs = [
    "敏感词检测中",
    "色情检测中",
    "abuse检测中",
    "广告法检测中",
    "Error检测中",
  ];

  for (const msg of msgs) {
    message.open({
      key,
      type: "loading",
      content: `${msg} ...`,
    });
    await sleep(200);
  }
  message.destroy(key);
}
