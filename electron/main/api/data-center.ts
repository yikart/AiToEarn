import { net } from 'electron';
import { ResOp } from './types';
import {
  Account,
  Video,
  AccountStats,
  VideoStats,
  CreateAccountDto,
  CreateVideoDto,
  CreateAccountStatsDto,
  CreateVideoStatsDto,
  PlatformType,
} from './types/data-center';

const config = {
  dataCenterApiUrl: 'https://ttgufwxxqyow.sealosbja.site',
};

class DataCenterApi {
  private async request<T>(
    method: string,
    path: string,
    data?: any,
    token?: string,
  ): Promise<ResOp<T>> {
    return new Promise((resolve, reject) => {
      const request = net.request({
        method,
        url: `${config.dataCenterApiUrl}${path}`,
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

  // 获取用户账号列表
  async getAccountsByUserId(userId: string, token: string): Promise<Account[]> {
    const response = await this.request<Account[]>(
      'GET',
      `/api/data-center/accounts/user/${userId}`,
      null,
      token,
    );
    return response.data;
  }

  // 创建或更新账号
  async createOrUpdateAccount(
    data: CreateAccountDto,
    token: string,
  ): Promise<Account> {
    const response = await this.request<Account>(
      'POST',
      '/api/data-center/accounts',
      data,
      token,
    );
    return response.data;
  }

  // 获取用户视频列表
  async getVideosByUserId(userId: string, token: string): Promise<Video[]> {
    const response = await this.request<Video[]>(
      'GET',
      `/api/data-center/videos/user/${userId}`,
      null,
      token,
    );
    return response.data;
  }

  // 创建或更新视频
  async createOrUpdateVideo(
    data: CreateVideoDto,
    token: string,
  ): Promise<Video> {
    const response = await this.request<Video>(
      'POST',
      '/api/data-center/videos',
      data,
      token,
    );
    return response.data;
  }

  // 获取账号统计数据
  async getAccountStats(
    params: {
      userId: string;
      accountId: number;
      videoId: number;
      type: PlatformType;
    },
    token: string,
  ): Promise<AccountStats[]> {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await this.request<AccountStats[]>(
      'GET',
      `/api/data-center/account?${queryString}`,
      null,
      token,
    );
    return response.data;
  }

  // 创建或更新账号统计数据
  async createOrUpdateAccountStats(
    data: CreateAccountStatsDto,
    token: string,
  ): Promise<AccountStats> {
    const response = await this.request<AccountStats>(
      'POST',
      '/api/data-center/account',
      data,
      token,
    );
    return response.data;
  }

  // 获取视频统计数据
  async getVideoStats(
    params: {
      userId: string;
      accountId: number;
      videoId: number;
      type: PlatformType;
    },
    token: string,
  ): Promise<VideoStats[]> {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await this.request<VideoStats[]>(
      'GET',
      `/api/data-center/video?${queryString}`,
      null,
      token,
    );
    return response.data;
  }

  // 创建或更新视频统计数据
  async createOrUpdateVideoStats(
    data: CreateVideoStatsDto,
    token: string,
  ): Promise<VideoStats> {
    const response = await this.request<VideoStats>(
      'POST',
      '/api/data-center/video',
      data,
      token,
    );
    return response.data;
  }
}

export const dataCenterApi = new DataCenterApi();
