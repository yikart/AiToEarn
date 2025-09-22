/**
 * IP地理位置获取工具
 * 使用JSONP方式调用IP地理位置服务
 */

export interface IpLocationInfo {
  ip: string;
  location: string;
  asn: string;
  org: string;
}

/**
 * 获取IP地理位置信息
 * @returns Promise<IpLocationInfo>
 */
export const getIpLocation = (): Promise<IpLocationInfo> => {
  return new Promise((resolve, reject) => {
    // 创建全局回调函数
    const callbackName = `ipLocationCallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 定义回调函数
    (window as any)[callbackName] = (ip: string, location: string, asn: string, org: string) => {
      // 清理回调函数和script标签
      delete (window as any)[callbackName];
      const script = document.getElementById(`ip-location-script-${callbackName}`);
      if (script) {
        document.head.removeChild(script);
      }
      
      resolve({ ip, location, asn, org });
    };

    // 创建script标签
    const script = document.createElement('script');
    script.id = `ip-location-script-${callbackName}`;
    script.src = `https://ping0.cc/geo/jsonp/${callbackName}`;
    script.onerror = () => {
      // 清理回调函数
      delete (window as any)[callbackName];
      reject(new Error('获取IP地理位置信息失败'));
    };

    // 设置超时
    const timeout = setTimeout(() => {
      delete (window as any)[callbackName];
      const scriptElement = document.getElementById(`ip-location-script-${callbackName}`);
      if (scriptElement) {
        document.head.removeChild(scriptElement);
      }
      reject(new Error('获取IP地理位置信息超时'));
    }, 10000);

    // 监听加载完成
    script.onload = () => {
      clearTimeout(timeout);
    };

    // 添加到页面
    document.head.appendChild(script);
  });
};

/**
 * 从位置信息中提取国家
 * @param location 位置信息字符串
 * @returns 国家名称
 */
export const extractCountry = (location: string): string => {
  // 位置信息通常格式为: "国家 省份 城市" 或 "国家"
  const parts = location.split(' ');
  return parts[0] || location;
};

/**
 * 格式化地理位置信息
 * @param info IP地理位置信息
 * @returns 格式化后的字符串
 */
export const formatLocationInfo = (info: IpLocationInfo): string => {
  const country = extractCountry(info.location);
  return `${country} | ${info.ip}`;
};
