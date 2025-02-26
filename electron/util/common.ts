import * as xml2js from 'xml2js';
// 公共工具类
export class CommonUtils {
  /**
   * 成功返回
   * @param msg
   * @param data
   * @returns {string}
   */
  static success(msg = '', data = null) {
    return JSON.stringify({
      code: 1,
      msg: msg,
      data: data,
    });
  }

  /**
   * 错误返回
   */
  static error(msg = '', data = null) {
    return JSON.stringify({
      code: 0,
      msg: msg,
      data: data,
    });
  }

  /**
   * cookie字符串或对象转String
   */
  static convertCookieToJson(cookieJson: any) {
    if (typeof cookieJson === 'string') {
      cookieJson = JSON.parse(cookieJson);
    }
    let cookieStr = '';
    cookieJson.forEach((cookie: any) => {
      cookieStr += `${cookie.name}=${cookie.value}; `;
    });
    return cookieStr;
  }

  /**
   * 睡眠指定时长
   */
  static waitFor(time: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, time);
    });
  }

  /**
   * 判断字符串是否是Json字符串
   */
  static isJsonString(str: string) {
    if (typeof str == 'string') {
      try {
        const obj = JSON.parse(str);
        return !!(typeof obj === 'object' && obj);
      } catch (e) {
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   * 转换xml为json对象
   */
  static xml2json(xml: any) {
    return new Promise((resolve, reject) => {
      const parser = new xml2js.Parser();
      parser.parseString(xml, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * 转换json对象为xml
   */
  static json2xml(json: object) {
    return new Promise((resolve, reject) => {
      try {
        const builder = new xml2js.Builder({
          rootName: 'CompleteMultipartUpload',
        });
        const xml = builder.buildObject(json);
        resolve(xml);
      } catch (err) {
        reject(err);
      }
    });
  }
}
