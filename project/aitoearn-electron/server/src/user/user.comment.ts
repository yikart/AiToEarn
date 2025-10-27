/*
 * @Author: nevin
 * @Date: 2025-01-15 14:32:41
 * @LastEditTime: 2025-02-26 00:34:45
 * @LastEditors: nevin
 * @Description:
 */
export function getGzhLoginKey(Ticket: string, key: string) {
  return `wxGzh:qrcode:${Ticket}:${key}`;
}
