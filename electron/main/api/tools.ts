import { net } from 'electron';

class ToolsApi {
  private async request<T>(
    method: string,
    path: string,
    data?: any,
    token?: string,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = net.request({
        method,
        url: `http://127.0.0.1:3000/api/`,
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      request.on('response', (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      });

      request.on('error', reject);

      if (data) {
        request.write(JSON.stringify(data));
      }
      request.end();
    });
  }

  // 获取AI的评论回复
  async createRanking(data: any, token: string): Promise<any> {
    const response = await this.request<any>(
      'POST',
      'tools/ai/recover/review',
      data,
      token,
    );
    return response.data;
  }
}

export const rankingApi = new ToolsApi();
