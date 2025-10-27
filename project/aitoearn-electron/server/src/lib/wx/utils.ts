/*
 * @Author: nevin
 * @Date: 2025-01-20 16:36:41
 * @LastEditTime: 2025-02-26 14:41:25
 * @LastEditors: nevin
 * @Description:
 */
import * as crypto from 'crypto';

export function generateSignature(sessionKey: string) {
  const hmac = crypto.createHmac('sha256', sessionKey);
  hmac.update('');
  return hmac.digest('hex');
}
