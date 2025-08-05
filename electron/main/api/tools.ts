import * as fs from 'fs'; // 新增文件系统导入
import netRequest from '.';
import FormData from 'form-data';

export enum FeedbackType {
  errReport = 'errReport', // 错误反馈
  feedback = 'feedback', // 反馈
  msgReport = 'msgReport', // 消息举报
  msgFeedback = 'msgFeedback', // 消息反馈
}

export class ToolsApi {

  // 获取AI的评论回复 - 使用新的OpenAI兼容格式
  async aiRecoverReview(inData: {
    content: string;
    title?: string;
    desc?: string;
    max?: number;
  }): Promise<string> {
    // 构建新的OpenAI兼容请求格式
    const messages = [
      {
        role: 'system',
        content: `你是一个风趣幽默又有分寸的文字创作者的助手,请帮我对别人对我作品的评论进行回复. 请用中文回复,并且回复内容不超过${inData.max || 50}字.只需要返回你的回复内容.`
      },
      {
        role: 'user',
        content: `作品标题: ${inData.title || '无'}, 作品描述: ${inData.desc || '无'}, 评论内容: ${inData.content}`
      }
    ];

    const requestBody = {
      model: 'gpt-4o',
      messages,
      max_tokens: inData.max || 50,
      temperature: 0.7,
      stream: false
    };

    const res = await netRequest<{
      data: {
        id: string;
        object: string;
        created: number;
        model: string;
        choices: {
          index: number;
          message: {
            role: string;
            content: string;
            refusal: null;
          };
          logprobs: null;
          finish_reason: string;
        }[];
        usage: {
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
        };
        system_fingerprint: string;
      };
      code: number;
      msg: string;
    }>({
      method: 'POST',
      url: 'v1/chat/completions',
      body: requestBody,
    });

    const {
      status,
      data: { data, code },
    } = res;
    if (status !== 200 && status !== 201) return '';
    if (!!code) return '';
    
    // 提取AI回复内容
    const aiResponse = data?.choices?.[0]?.message?.content || '';
    return aiResponse;
  }

  // 生成AI评论 - 新的OpenAI兼容格式
  async aiGenerateComment(inData: {
    subject: string;
    prompt: string;
    max?: number;
  }): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: inData.prompt || '你是我的好友,请对我发的短视频作品或者朋友圈作品进行评论. 请用中文回复,评论要自然、友好.'
      },
      {
        role: 'user',
        content: `评论主旨: ${inData.subject}`
      }
    ];

    const requestBody = {
      model: 'gpt-4o',
      messages,
      max_tokens: inData.max || 50,
      temperature: 0.8,
      stream: false
    };

    const res = await netRequest<{
      data: {
        choices: {
          message: {
            content: string;
          };
        }[];
      };
      code: number;
      msg: string;
    }>({
      method: 'POST',
      url: 'v1/chat/completions',
      body: requestBody,
    });

    const {
      status,
      data: { data, code },
    } = res;
    if (status !== 200 && status !== 201) return '';
    if (!!code) return '';
    
    return data?.choices?.[0]?.message?.content || '';
  }

  /**
   * 上传本地文件
   * @param path
   * @param secondPath
   * @returns
   */
  async upFile(path: string, secondPath = ''): Promise<string> {
    const formData = new FormData(); // 新增FormData实例
    const fileName = path.split('/').pop() || path.split('\\').pop() || 'file'; // 新增文件名提取
    formData.append('file', fs.createReadStream(path), fileName); // 新增文件流添加

    const res = await netRequest<{
      data: string;
      code: number;
      msg: string;
    }>({
      method: 'POST',
      url: 'oss/upload', // 修改URL路径
      body: formData, // 使用FormData代替空对象
      headers: {
        'second-path': secondPath,
      },
    });
    const {
      status,
      data: { data, code },
    } = res;
    if (status !== 200 && status !== 201) return '';
    if (!!code) return '';
    return data;
  }
}

export const toolsApi = new ToolsApi();
