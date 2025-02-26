/*
 * @Author: nevin
 * @Date: 2025-01-21 21:12:52
 * @LastEditTime: 2025-02-21 21:13:19
 * @LastEditors: nevin
 * @Description:
 */
import { store } from '../../global/store';
import { IUserStore } from '@/store/user';
import { IUserInfo } from '@/api/types/user-t';
import { StoreKey } from '../../../src/utils/StroeEnum';

// 完整的响应数据接口
interface ResponseData {
  state: IUserStore;
  version: number;
}

export function getUserInfo(): IUserInfo {
  const res: ResponseData = JSON.parse(store.get(StoreKey.User));
  return res.state.userInfo!;
}

export function getUserToken() {
  const res: ResponseData = JSON.parse(store.get(StoreKey.User));
  return res.state.token;
}
