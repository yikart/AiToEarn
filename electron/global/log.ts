/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-02-22 19:21:08
 * @LastEditors: nevin
 * @Description: 日志组件
 */
import log from 'electron-log/main';

log.initialize();
console.log = log.log;
console.error = log.error;

export const logger = log;

export default log;
