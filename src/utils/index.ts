import moment from 'moment';
import { message } from 'antd';
/**
 * 生成唯一ID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 获取文件路径中的文件名
export function getFilePathName(path: string) {
  if (!path) return '';
  const path1 = path.split('\\')[path.split('\\').length - 1];
  return path1.split('/')[path1.split('/').length - 1];
}

// 格式化时间
export function formatTime(
  time: string | number | Date,
  format: string = 'YYYY-MM-DD HH:MM:SS',
) {
  return moment(time).format(format);
}

/**
 * 将数值转换为 hh:mm:ss 格式的字符串
 * 7 -> 00:00:07
 * @param seconds - 要转换的秒数
 * @returns 格式化后的时间字符串
 */
export function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
}

function handlePositionError(e: GeolocationPositionError) {
  switch (e.code) {
    case e.PERMISSION_DENIED:
      message.warning('位置服务被拒绝');
      break;
    case e.POSITION_UNAVAILABLE:
      message.warning('暂时获取不到位置信息');
      break;
    case e.TIMEOUT:
      message.warning('获取信息超时');
      break;
    default:
      message.warning('未知错误');
      break;
  }
}

// 获取位置信息
export async function getLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve) => {
    function handlePosition(position: GeolocationPosition) {
      resolve(position);
    }

    const options = {
      //是否使用高精度设备，如GPS。默认是true
      enableHighAccuracy: true,
      //超时时间，单位毫秒，默认为0
      timeout: 5000,
      //使用设置时间内的缓存数据，单位毫秒
      //默认为0，即始终请求新数据
      //如设为Infinity，则始终使用缓存数据
      maximumAge: 0,
    };
    console.log(navigator.permissions);
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then(function (result) {
          console.debug('permissions:', result.state);
          if (result.state === 'granted') {
            navigator.geolocation.getCurrentPosition(
              handlePosition,
              handlePositionError,
              options,
            );
          } else if (result.state === 'prompt') {
            navigator.geolocation.getCurrentPosition(
              handlePosition,
              handlePositionError,
              options,
            );
          } else if (result.state === 'denied') {
            alert(
              'Permission denied. Please allow location access in your browser settings.',
            );
          }
        });
    } else {
      navigator.geolocation.getCurrentPosition(
        handlePosition,
        handlePositionError,
        options,
      );
    }
  });
}
