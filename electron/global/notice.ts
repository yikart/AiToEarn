/*
 * @Author: nevin
 * @Date: 2025-03-24 23:18:06
 * @LastEditTime: 2025-03-24 23:19:06
 * @LastEditors: nevin
 * @Description: 系统通知
 */
import { Notification } from 'electron';
export const sysNotice = (title: string, body: string) =>
  new Promise((resolve, reject) => {
    if (!Notification.isSupported()) reject('当前系统不支持通知');

    const options = typeof title === 'object' ? title : { title, body };
    const notification = new Notification(options);
    notification.on('click', resolve);
    notification.show();
  });
