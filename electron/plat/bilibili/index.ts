import { createReadStream } from 'fs';
import netRequest from '../../main/api';
import requestNet from '../requestNet';
import FormData from 'form-data';

class Bilibili {
  /**
   * 刷新token
   * @param refreshToken
   * @returns
   */
  async refreshAccessToken(refreshToken: string) {
    const res = await new Promise(async (resolve, reject) => {
      const res = await netRequest({
        method: 'GET',
        url: `plat/bilibili/refreshAccessToken/${refreshToken}`,
      });
      resolve(res.data);
    });

    return res;
  }

  /**
   * 查询用户已授权权限列表
   * @param accessToken
   * @returns
   */
  async getAccountScopes(accessToken: string) {
    const res = await new Promise(async (resolve, reject) => {
      const res = await netRequest({
        method: 'GET',
        url: `plat/bilibili/account/scopes/${accessToken}`,
      });
      resolve(res.data);
    });

    return res;
  }

  /**
   * 视频初始化
   * @param accessToken
   * @returns
   */
  async videoInit(accessToken: string) {
    const res = await new Promise(async (resolve, reject) => {
      const res = await netRequest({
        method: 'POST',
        url: `plat/bilibili/video/init/${accessToken}`,
      });
      resolve(res.data);
    });

    return res;
  }

  /**
   * 文件分片上传
   * @param uploadToken
   * @param partNumber
   * @returns
   */
  async partUpload(uploadToken: string, partNumber: number = 1) {
    const res = await new Promise(async (resolve, reject) => {
      const res = await requestNet({
        method: 'POST',
        url: `https://openupos.bilivideo.com/video/v2/part/upload?upload_token=${uploadToken}&partNumber=${partNumber}`,
        headers: {
          ' Content-Type': 'application/json',
        },
      });
      resolve(res.data);
    });

    return res;
  }

  /**
   * 文件分片合片
   * @param uploadToken
   * @returns
   */
  async videoComplete(uploadToken: string) {
    const res = await new Promise(async (resolve, reject) => {
      const res = await requestNet({
        method: 'POST',
        url: `https://member.bilibili.com/arcopen/fn/archive/video/complete?upload_token=${uploadToken}`,
        headers: {
          ' Content-Type': 'application/json',
        },
      });
      resolve(res.data);
    });

    return res;
  }

  /**
   * 封面上传
   * @param accessToken
   * @returns
   */
  async coverUpload(path: string, accessToken: string) {
    const formData = new FormData();
    const fileName = path.split('/').pop() || path.split('\\').pop() || 'file';
    const fileStream = createReadStream(path);
    formData.append('file', fileStream, fileName);

    const res = await new Promise(async (resolve, reject) => {
      const res = await netRequest({
        method: 'POST',
        url: `plat/bilibili/cover/upload/${accessToken}`,
      });
      resolve(res.data);
    });

    return res;
  }

  /**
   * 视频稿件提交
   * @param accessToken
   * @param uploadToken
   * @param data
   * @returns
   */
  async archiveAddByUtoken(
    accessToken: string,
    uploadToken: string,
    data: {
      title: string; // 标题
      cover?: string; // 封面url
      tid: number; // 分区ID，由获取分区信息接口得到
      noReprint?: 0 | 1; // 是否允许转载 0-允许，1-不允许。默认0
      desc?: string; // 描述
      tag: string[]; // 标签
      copyright: 1 | 2; // 1-原创，2-转载(转载时source必填)
      source?: string; // 如果copyright为转载，则此字段表示转载来源
    },
  ) {
    const res = await new Promise(async (resolve, reject) => {
      const res = await netRequest({
        method: 'POST',
        url: `plat/bilibili/archive/add-by-utoken?accessToken=${accessToken}&uploadToken=${uploadToken}`,
        body: data,
      });
      resolve(res.data);
    });

    return res;
  }

  /**
   * 分区查询
   * @param accessToken
   * @returns
   */
  async archiveTypeList(accessToken: string) {
    const res = await new Promise(async (resolve, reject) => {
      const res = await netRequest({
        method: 'GET',
        url: `plat/bilibili/archive/type/list/${accessToken}`,
      });
      resolve(res.data);
    });

    return res;
  }
}
export const BilibiliPlat = new Bilibili();
