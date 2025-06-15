import http from "@/utils/request";

// 文生图
export const textToImage = (data: {
  prompt: string;
  width: number;
  height: number;
  sessionIds: string[];
}) => {
  return http.post("/tools/ai/jm/task", data);
};

// 获取文生图任务结果
export const getTextToImageTaskResult = (id: string) => {
  return http.get(`/tools/ai/jm/task/${id}`);
};

// 文生图文（流光卡片）
export const textToFireflyCard = (data: {
  content: string;
  temp: string;
  title: string;
}) => {
  return http.post("/tools/ai/fireflycard", data);
}; 