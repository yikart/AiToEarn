// 根据文件路径获取文件名和后缀
import { ProxyInfo } from '@@/utils.type';

// 提取路径中的文件名
export function getFilePathNameCommon(path: string) {
  if (!path)
    return {
      filename: '',
      suffix: '',
    };
  const path1 = path.split('\\')[path.split('\\').length - 1];
  const filename = path1.split('/')[path1.split('/').length - 1];
  return {
    filename,
    suffix: filename.split('.')[filename.split('.').length - 1],
  };
}

// 等待n毫秒
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 重试
 * @param max 重试上限
 * @param callback 每次循环的回调，返回boolean，为true则会结束循环
 * @param interval 重试间隔时间
 * @returns true=成功，false=失败
 */
export async function RetryWhile(
  callback: (count: number) => Promise<boolean | undefined>,
  max: number,
  interval: number = 1000,
) {
  let count = 0;
  let flag = true;
  while (true) {
    const isEnd = await callback(count);
    if (isEnd === true) break;
    if (count > max) {
      flag = false;
      break;
    }
    count++;
    await sleep(interval);
    console.log(`开始第 ${count} 次重试`);
  }
  return flag;
}

/**
 * 代理解析
 * @param proxyString
 */
export function parseProxyString(proxyString: string): ProxyInfo | false {
  const regex =
    /^(?:(\w+):\/\/)?([\d.]+:\d+)(?::([^:]+):([^{}\s]+))?(?:\[(.*?)\])?(?:{(.*?)})?$/;

  const match = proxyString.match(regex);
  if (!match) {
    return false; // 无法解析则返回 false
  }

  const [, protocol, ipAndPort, username, password, refreshUrl, remark] = match;

  return {
    protocol: protocol || 'http', // 如果未提供协议，默认为 http
    ipAndPort,
    username,
    password,
    refreshUrl,
    remark,
  };
}
