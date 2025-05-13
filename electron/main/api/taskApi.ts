import * as fs from 'fs'; // 新增文件系统导入
import netRequest from '.';
import FormData from 'form-data';


export class TaskApi {
  // 获取活动任务
  async getActivityTask() {
    const res = await netRequest({
      method: 'GET',
      url: 'tasks/list?page=1&pageSize=20&totalCount=0&type=interaction',
      body: {},
      isToken: true,
    });
    const {
      status,
      data: { data, code },
    } = res;
    // console.log('---- getActivityTask ----', data);
    if (status !== 200 && status !== 201) return '';
    if (!!code) return '';
    return data;
  }


}

export const taskApi = new TaskApi();
