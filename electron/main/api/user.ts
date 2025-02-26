import { net } from 'electron';
import { ResOp } from './types';
import {
  UserInfo,
  LoginResponse,
  PhoneLoginByCodeDto,
  LoginByPasswordDto,
  ChangePasswordDto,
  UpdateUserInfoDto,
  GetRegisterCodeDto,
  PhoneRegisterDto,
} from './types/user';

class UserApi {
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

  // 发送手机验证码
  async sendCode(data: GetRegisterCodeDto): Promise<void> {
    await this.request<void>('POST', '/api/user/code', data);
  }

  // 手机号注册
  async register(data: PhoneRegisterDto): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>(
      'POST',
      '/api/user/add',
      data,
    );
    return response.data;
  }

  // 手机验证码登录
  async loginByCode(data: PhoneLoginByCodeDto): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>(
      'POST',
      '/api/user/login/code/phone',
      data,
    );
    return response.data;
  }

  // 密码登录
  async loginByPassword(data: LoginByPasswordDto): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>(
      'POST',
      '/api/user/login/password',
      data,
    );
    return response.data;
  }

  // 修改密码
  async changePassword(data: ChangePasswordDto, token: string): Promise<void> {
    await this.request<void>('POST', '/api/user/password/change', data, token);
  }

  // 刷新token
  async refreshToken(token: string): Promise<string> {
    const response = await this.request<{ token: string }>(
      'POST',
      '/api/user/token/refresh',
      null,
      token,
    );
    return response.data.token;
  }

  // 获取用户信息
  async getUserInfo(token: string): Promise<UserInfo> {
    const response = await this.request<UserInfo>(
      'GET',
      '/api/user/mine',
      null,
      token,
    );
    return response.data;
  }

  // 更新用户信息
  async updateUserInfo(
    data: UpdateUserInfoDto,
    token: string,
  ): Promise<UserInfo> {
    const response = await this.request<UserInfo>(
      'PUT',
      '/api/user/info/update',
      data,
      token,
    );
    return response.data;
  }

  // 注销用户
  async deleteUser(token: string): Promise<UserInfo> {
    const response = await this.request<UserInfo>(
      'DELETE',
      '/api/user/del',
      null,
      token,
    );
    return response.data;
  }
}

export const userApi = new UserApi();
