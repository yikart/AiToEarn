import { net } from 'electron';
import { getUserToken } from '../user/comment';

export interface IRequestNetResult<T> {
  status: number;
  headers: Record<any, any>;
  data: T;
}

export interface IRequestNetParams {
  headers?: any;
  url: string;
  body?: any;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  isFile?: boolean;
  isToken?: boolean;
}

const netRequest = <T = any>({
  headers,
  body,
  method,
  url,
  isFile,
  isToken,
}: IRequestNetParams): Promise<IRequestNetResult<T>> => {
  return new Promise((resolve, reject) => {
    const req = net.request({
      method: method || 'GET',
      url: `${process.env.VITE_APP_URL}/${url}`,
    });

    // 设置请求头
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        // @ts-ignore
        req.setHeader(key, value);
      });
    }

    if (isToken) req.setHeader('Authorization', `Bearer ${getUserToken()}`);

    // 处理响应
    req.on('response', (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        let parsedData: T;
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          parsedData = undefined as any;
          console.log(e);
        }
        resolve({
          status: response.statusCode,
          headers: response.headers,
          data: parsedData,
        });
      });
    });

    // 错误处理
    req.on('error', (error) => {
      reject(error);
    });

    if (isFile) {
      req.setHeader('Content-Type', 'application/octet-stream');
      req.write(body);
    } else {
      // 发送请求体
      if (body) {
        req.setHeader('Content-Type', 'application/json');
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
    }

    req.end();
  });
};

export default netRequest;
