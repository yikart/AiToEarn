import { net } from 'electron';
import { ResOp } from './types';
import {
  Platform,
  PlatformAccount,
  PlatformAccountGroup,
  CreatePlatformDto,
  UpdatePlatformDto,
  CreatePlatformAccountDto,
  UpdatePlatformAccountDto,
  CreatePlatformAccountGroupDto,
  UpdatePlatformAccountGroupDto,
} from './types/platform';

class PlatformApi {
  private async request<T>(
    method: string,
    path: string,
    data?: any,
    token?: string,
  ): Promise<ResOp<T>> {
    return new Promise((resolve, reject) => {
      const request = net.request({
        method,
        url: `https://ttgufwxxqyow.sealosbja.site`,
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

  // 获取所有平台
  async getAllPlatforms(token: string): Promise<Platform[]> {
    const response = await this.request<Platform[]>(
      'GET',
      '/api/platform',
      null,
      token,
    );
    return response.data;
  }

  // 创建平台
  async createPlatform(
    data: CreatePlatformDto,
    token: string,
  ): Promise<Platform> {
    const response = await this.request<Platform>(
      'POST',
      '/api/platform',
      data,
      token,
    );
    return response.data;
  }

  // 获取平台详情
  async getPlatform(id: string, token: string): Promise<Platform> {
    const response = await this.request<Platform>(
      'GET',
      `/api/platform/${id}`,
      null,
      token,
    );
    return response.data;
  }

  // 更新平台
  async updatePlatform(
    id: string,
    data: UpdatePlatformDto,
    token: string,
  ): Promise<Platform> {
    const response = await this.request<Platform>(
      'PUT',
      `/api/platform/${id}`,
      data,
      token,
    );
    return response.data;
  }

  // 删除平台
  async deletePlatform(id: string, token: string): Promise<void> {
    await this.request<void>('DELETE', `/api/platform/${id}`, null, token);
  }

  // 获取所有平台账号
  async getAllPlatformAccounts(token: string): Promise<PlatformAccount[]> {
    const response = await this.request<PlatformAccount[]>(
      'GET',
      '/api/platform-account',
      null,
      token,
    );
    return response.data;
  }

  // 创建平台账号
  async createPlatformAccount(
    data: CreatePlatformAccountDto,
    token: string,
  ): Promise<PlatformAccount> {
    const response = await this.request<PlatformAccount>(
      'POST',
      '/api/platform-account',
      data,
      token,
    );
    return response.data;
  }

  // 获取平台账号详情
  async getPlatformAccount(
    id: string,
    token: string,
  ): Promise<PlatformAccount> {
    const response = await this.request<PlatformAccount>(
      'GET',
      `/api/platform-account/${id}`,
      null,
      token,
    );
    return response.data;
  }

  // 更新平台账号
  async updatePlatformAccount(
    id: string,
    data: UpdatePlatformAccountDto,
    token: string,
  ): Promise<PlatformAccount> {
    const response = await this.request<PlatformAccount>(
      'PUT',
      `/api/platform-account/${id}`,
      data,
      token,
    );
    return response.data;
  }

  // 删除平台账号
  async deletePlatformAccount(id: string, token: string): Promise<void> {
    await this.request<void>(
      'DELETE',
      `/api/platform-account/${id}`,
      null,
      token,
    );
  }

  // 获取指定平台的所有账号
  async getPlatformAccountsByPlatformId(
    platformId: string,
    token: string,
  ): Promise<PlatformAccount[]> {
    const response = await this.request<PlatformAccount[]>(
      'GET',
      `/api/platform-account/platform/${platformId}`,
      null,
      token,
    );
    return response.data;
  }

  // 获取所有平台账号分组
  async getAllPlatformAccountGroups(
    token: string,
  ): Promise<PlatformAccountGroup[]> {
    const response = await this.request<PlatformAccountGroup[]>(
      'GET',
      '/api/platform-account-group',
      null,
      token,
    );
    return response.data;
  }

  // 创建平台账号分组
  async createPlatformAccountGroup(
    data: CreatePlatformAccountGroupDto,
    token: string,
  ): Promise<PlatformAccountGroup> {
    const response = await this.request<PlatformAccountGroup>(
      'POST',
      '/api/platform-account-group',
      data,
      token,
    );
    return response.data;
  }

  // 获取平台账号分组详情
  async getPlatformAccountGroup(
    id: string,
    token: string,
  ): Promise<PlatformAccountGroup> {
    const response = await this.request<PlatformAccountGroup>(
      'GET',
      `/api/platform-account-group/${id}`,
      null,
      token,
    );
    return response.data;
  }

  // 更新平台账号分组
  async updatePlatformAccountGroup(
    id: string,
    data: UpdatePlatformAccountGroupDto,
    token: string,
  ): Promise<PlatformAccountGroup> {
    const response = await this.request<PlatformAccountGroup>(
      'PUT',
      `/api/platform-account-group/${id}`,
      data,
      token,
    );
    return response.data;
  }

  // 删除平台账号分组
  async deletePlatformAccountGroup(id: string, token: string): Promise<void> {
    await this.request<void>(
      'DELETE',
      `/api/platform-account-group/${id}`,
      null,
      token,
    );
  }
}

export const platformApi = new PlatformApi();
