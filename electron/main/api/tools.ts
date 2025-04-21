import * as fs from 'fs'; // 新增文件系统导入
import netRequest from '.';
import FormData from 'form-data';

export enum FeedbackType {
  errReport = 'errReport', // 错误反馈
  feedback = 'feedback', // 反馈
  msgReport = 'msgReport', // 消息举报
  msgFeedback = 'msgFeedback', // 消息反馈
}

class ToolsApi {
  // 获取AI的评论回复
  async aiRecoverReview(inData: {
    content: string;
    title?: string;
    desc?: string;
    max?: number;
  }): Promise<string> {
    const res = await netRequest<{
      data: string;
      code: number;
      msg: string;
    }>({
      method: 'POST',
      url: 'tools/ai/recover/review',
      body: inData,
    });
    const {
      status,
      data: { data, code },
    } = res;
    if (status !== 200 && status !== 201) return '';
    if (!!code) return '';
    return data;
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
