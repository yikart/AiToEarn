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


  // 申请任务
  async applyTask(id: string, data: {account: string;
    uid: string;
    accountType: string;
  }) {
    console.log('------ applyTask ----', id, data);
    const res = await netRequest({
      method: 'POST',
      url: `tasks/apply/${id}`,
      body: data,
      isToken: true,
    });
    console.log('------ applyTask res ----', res);
    return res;
  }


  // 提交任务
  async submitTask(id: string, data: {
    submissionUrl?: string; // 提交的结果，视频、文章或截图URL
    screenshotUrls?: string[]; // 任务截图
    qrCodeScanResult?: string; // 二维码扫描结果
  }) {
    const res = await netRequest({
      method: 'POST',
      url: `tasks/submit/${id}`,
      body: data,
      isToken: true,
    });
    return res;
  }
}

export const taskApi = new TaskApi();
