import requestNet from './requestNet';

// 代理地址有效性检测
export async function proxyCheck(proxy: string) {
  try {
    const res = await requestNet({
      url: 'https://httpbin.org/ip',
      method: 'GET',
      proxy,
    });
    console.log(res);
    if (res.status === 200 || res.status === 201 || res.data.length > 100000) {
      return true;
    }
    return false;
  } catch (e) {
    console.log(e);
    return false;
  }
}
