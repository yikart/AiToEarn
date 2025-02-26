import { net } from 'electron';
import { ResOp, PaginationMeta } from './types';
import {
  Ranking,
  RankingContent,
  CreateRankingDto,
  UpdateRankingDto,
  RankingStatus,
} from './types/ranking';

interface RankingContentResponse {
  items: RankingContent[];
  meta: PaginationMeta;
}

class RankingApi {
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

  // 根据平台获取榜单
  async getRankingsByPlatform(
    platformId: string,
    status?: RankingStatus,
    token?: string,
  ): Promise<Ranking[]> {
    const params = new URLSearchParams();
    params.append('platformId', platformId);
    if (status !== undefined) {
      params.append('status', status.toString());
    }
    const response = await this.request<Ranking[]>(
      'GET',
      `/api/ranking/platform?${params.toString()}`,
      null,
      token,
    );
    return response.data;
  }

  // 获取所有榜单
  async getAllRankings(token: string): Promise<Ranking[]> {
    const response = await this.request<Ranking[]>(
      'GET',
      '/api/ranking',
      null,
      token,
    );
    return response.data;
  }

  // 创建榜单
  async createRanking(data: CreateRankingDto, token: string): Promise<Ranking> {
    const response = await this.request<Ranking>(
      'POST',
      '/api/ranking',
      data,
      token,
    );
    return response.data;
  }

  // 获取榜单详情
  async getRanking(id: string, token: string): Promise<Ranking> {
    const response = await this.request<Ranking>(
      'GET',
      `/api/ranking/${id}`,
      null,
      token,
    );
    return response.data;
  }

  // 更新榜单
  async updateRanking(
    id: string,
    data: UpdateRankingDto,
    token: string,
  ): Promise<Ranking> {
    const response = await this.request<Ranking>(
      'PUT',
      `/api/ranking/${id}`,
      data,
      token,
    );
    return response.data;
  }

  // 删除榜单
  async deleteRanking(id: string, token: string): Promise<void> {
    await this.request<void>('DELETE', `/api/ranking/${id}`, null, token);
  }

  // 获取榜单内容
  async getRankingContents(
    id: string,
    params: {
      page: number;
      pageSize: number;
      field?: string;
      order?: 'ASC' | 'DESC';
      category?: string;
      type?: 'article' | 'video' | 'live' | 'short_video';
      date?: string;
    },
    token: string,
  ): Promise<RankingContentResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    const response = await this.request<RankingContentResponse>(
      'GET',
      `/api/ranking/${id}/contents?${queryParams.toString()}`,
      null,
      token,
    );
    return response.data;
  }

  // 获取榜单内容分类
  async getRankingCategories(id: string, token: string): Promise<string[]> {
    const response = await this.request<string[]>(
      'GET',
      `/api/ranking/${id}/categories`,
      null,
      token,
    );
    return response.data;
  }
}

export const rankingApi = new RankingApi();
