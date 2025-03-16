import netRequest from '.';

class ToolsApi {
  // 获取AI的评论回复
  async aiRecoverReview(data: {
    content: string;
    title?: string;
    desc?: string;
    max?: number;
  }): Promise<any> {
    const res = await netRequest<any>({
      method: 'POST',
      url: 'tools/ai/recover/review',
      body: data,
    });

    console.log('------ res', res);

    return res;
  }
}

export const toolsApi = new ToolsApi();
