/*
 * @Author: nevin
 * @Date: 2025-03-24 22:03:35
 * @LastEditTime: 2025-03-24 22:12:34
 * @LastEditors: nevin
 * @Description:
 */
import { net } from 'electron';
import FormData from 'form-data';

export interface IRequestNetResult<T> {
  status: number;
  headers: Record<any, any>;
  data: T;
}

export interface IRequestNetParams {
  headers?: Record<string, string | string[]>;
  url?: string;
  body?: any;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  // 是否请求文件
  isReqFile?: boolean;
  // body是否为文件
  isFile?: boolean;
  formData?: FormData;
}

const requestNet = <T = any>({
  headers,
  body,
  method,
  url,
  isFile,
  formData,
  isReqFile,
}: IRequestNetParams): Promise<IRequestNetResult<T>> => {
  return new Promise((resolve, reject) => {
    const req = net.request({
      method: method || 'GET',
      url,
    });

    if (formData) {
      headers = {
        ...(headers ? headers : {}),
        ...formData.getHeaders(),
      };
    }

    // 设置请求头
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        // @ts-ignore
        req.setHeader(key, value);
      });
    }

    // 处理响应
    req.on('response', (response) => {
      const chunks: Buffer<ArrayBufferLike>[] = [];
      let data = '';
      response.on('data', (chunk) => {
        if (isReqFile) {
          chunks.push(chunk);
        } else {
          data += chunk;
        }
      });

      response.on('end', () => {
        let parsedData: T;
        if (isReqFile) {
          const buffer = Buffer.concat(chunks);
          parsedData = buffer as any;
        } else {
          try {
            parsedData = JSON.parse(data);
          } catch (e) {
            parsedData = undefined as any;
            console.log(e);
          }
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

    if (formData) {
      formData.pipe(req as any);
      const cReq = formData.submit(url!, (err, res) => {
        cReq.end();
      });
    } else {
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
    }
  });
};

export default requestNet;
