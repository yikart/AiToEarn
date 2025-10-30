import { Injectable } from '@nestjs/common';
// @ts-ignore
import kuaiShosignCore from './kuaiShoSignCore.js';
import qs from 'qs';
import { createHash } from 'crypto';

interface ISignParams {
  json: Record<string, any>;
  type: 'form-data' | 'json';
}

@Injectable()
export class KwaiSginService {
  exports: any = {};

  constructor() {
    const obj = {
      exports: {},
      id: 75407,
      loaded: true,
    };
    kuaiShosignCore[75407](obj);
    this.exports = obj.exports;
  }

  /**
   * 输入：
   * sign({
   *   url: '/rest/cp/creator/comment/report/menu',
   *   type: 'json',
   *   json: {
   *     'kuaishou.web.cp.api_ph': '19af6d5b24cb170a03331ce9254b1204154c',
   *   },
   * })
   * 输出：
   * /rest/cp/creator/comment/report/menu?__NS_sig3=4656112138efc7727e1b18193ee992f9c3278f63070705050a0b0812
   * @param params
   */
  sign(params: ISignParams): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const md5 = this.md5(params);
      console.log('md5：', md5);

      this.exports.realm.global['$encode'](md5, {
        suc(s: string) {
          resolve(`${s}`);
        },
        err(e: string) {
          console.error('签名失败：', e);
          reject(e);
        },
      });
    });
  }

  private md5({ json, type }: ISignParams) {
    let str = '';
    if (type === 'form-data') {
      str = qs.stringify(json);
    } else {
      str = JSON.stringify(json);
    }
    return createHash('md5').update(str).digest('hex');
  }
}
