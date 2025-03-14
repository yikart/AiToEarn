// @ts-ignore
import kuaiShosignCore from './kuaiShoSignCore.js';
import qs from 'qs';
// @ts-ignore
import crypto from 'crypto-js';

interface ISignParams {
  json: Record<string, any>;
  type: 'form-data' | 'json';
  url: string;
}

// 快手平台签名
class KwaiSign {
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
  sign(params: ISignParams) {
    return new Promise(async (resolve, reject) => {
      const { url } = params;
      const md5 = this.md5(params);

      this.exports.realm.global['$encode'](md5, {
        suc(s: string) {
          console.log('签名成功：', s);
          resolve(`${url}?__NS_sig3=${s}`);
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
    return crypto.MD5(str).toString();
  }
}

const kwaiSign = new KwaiSign();
export default kwaiSign;
