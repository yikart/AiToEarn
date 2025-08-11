import http from "@/utils/request";

// 文生图 - 新的接口
export const generateImage = (data: {
  prompt: string;
  model?: string;
  n?: number;
  quality?: "standard" | "hd";
  response_format?: "url" | "b64_json";
  size?: string;
  style?: "vivid" | "natural";
  user?: string;
}) => {
  return http.post("/ai/image/generate", data);
};

// 流光卡片生成 - 新的接口
export const generateFireflyCard = (data: {
  content: string;
  temp?: string;
  title?: string;
  style?: {
    align?: string;
    backgroundName?: string;
    backShadow?: string;
    font?: string;
    width?: number;
    ratio?: string;
    height?: number;
    fontScale?: number;
    padding?: string;
    borderRadius?: string;
    color?: string;
    opacity?: number;
    blur?: number;
    backgroundAngle?: string;
    lineHeights?: {
      content?: string;
      title?: string;
    };
  };
}) => {
  return http.post("/ai/fireflycard", data);
};

// 获取图片生成模型参数
export const getImageGenerationModels = () => {
  return http.get("/ai/models/image/generation");
};

// 获取图片编辑模型参数
export const getImageEditModels = () => {
  return http.get("/ai/models/image/edit");
};

// 获取视频生成模型参数
export const getVideoGenerationModels = () => {
  return http.get("/ai/models/video/generation");
};

// 保留旧的接口以保持向后兼容性（可选）
// 文生图 - 旧接口（已废弃）
export const textToImage = (data: {
  prompt: string;
  width: number;
  height: number;
  sessionIds: string[];
}) => {
  return http.post("/tools/ai/jm/task", data);
};

// 获取文生图任务结果 - 旧接口（已废弃）
export const getTextToImageTaskResult = (id: string) => {
  return http.get<{
    imgList: string[];
    status: string;
    taskId: string;
  }>(`/tools/ai/jm/task/${id}`);
};

// 文生图文（流光卡片）- 旧接口（已废弃）
export const textToFireflyCard = (data: {
  content: string;
  temp: string;
  title: string;
}) => {
  return http.post("/tools/ai/fireflycard", data);
};
