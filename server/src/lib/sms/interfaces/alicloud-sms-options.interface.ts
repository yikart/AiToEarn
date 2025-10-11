/*
 * @Author: lish
 * @Date: 2024-07-08 20:13:01
 * @LastEditors: lish
 * @LastEditTime: 2024-07-08 20:27:44
 * @Description: Do not edit
 */
export interface AlicloudSmsOptions {
  config: {
    /**
     * Alicloud account accessKey ID.
     *
     * @see https://usercenter.console.aliyun.com/#/manage/ak
     * @type {string}
     */
    accessKeyId: string;

    /**
     * Alicloud account accessKey secret.
     *
     * @see https://usercenter.console.aliyun.com/#/manage/ak
     * @type {string}
     */
    accessKeySecret: string;

    /**
     * Alicloud API service url.
     *
     * @default 'https://dysmsapi.aliyuncs.com'
     * @type {string}
     */
    endpoint?: string;

    /**
     * Alicloud SMS API version.
     *
     * @default 2017-05-25
     * @type {string}
     */
    apiVersion?: string;

    opts?: {
      /**
       * @default 3000
       * @type {number}
       */
      timeout?: number;

      /**
       * Format the parameter name to first letter upper case
       *
       * @default true
       * @type {boolean}
       */
      formatParams?: boolean;

      /**
       * Set the http method
       *
       * @default GET
       * @type {('GET' | 'POST')}
       */
      method?: 'GET' | 'POST';

      /**
       * Http request headers
       *
       * @type {object}
       */
      headers?: object;
    };
  };
  defaults?: {
    /**
     * SMS message template ID.
     *
     * @see 请在控制台模板管理页面模板CODE一列查看。
     * @type {string}
     */
    signName?: string;

    /**
     * Alicloud region ID.
     *
     * @type {string}
     */
    regionId?: string;

    templateCode?: string;
  };

  /**
   * Log sent message on dashboard.
   *
   * @default false
   * @type {boolean}
   * @memberof AlicloudSmsOptions
   */
  logger?: boolean;
}
