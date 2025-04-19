import netRequest from '.';

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
}

export const toolsApi = new ToolsApi();
