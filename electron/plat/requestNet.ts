import { net, session, Session } from 'electron';
import FormData from 'form-data';
import { ipv4Regular } from '../../commont/regular';

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
  // 代理配置，例如 "http=proxy1.com:8080"
  proxy?: string;
}

const requestNet = <T = any>({
  headers,
  body,
  method,
  url,
  isFile,
  formData,
  isReqFile,
  proxy,
}: IRequestNetParams): Promise<IRequestNetResult<T>> => {
  return new Promise(async (resolve, reject) => {
    try {
      let customSession: Session;

      // 如果传入了代理配置，动态设置代理
      if (proxy) {
        if (!ipv4Regular.test(proxy)) throw new Error('代理地址不合法');
        customSession = session.fromPartition(
          `persist:proxy-session-${Date.now()}`,
        );
        console.log(`http=${proxy};https=${proxy}`);
        await customSession.setProxy({
          proxyRules: `http=${proxy};https=${proxy}`,
        });

        headers = {
          ...(headers ? headers : {}),
          ...(proxy
            ? {
                'x-forwarded-for': proxy,
              }
            : {}),
        };
      }

      if (formData) {
        headers = {
          ...(headers ? headers : {}),
          ...formData.getHeaders(),
        };
      }

      const req = net.request({
        method: method || 'GET',
        url,
        // 如果有代理，使用自定义 session
        session: proxy ? customSession! : undefined,
        headers,
      });

      // 设置请求头
      if (headers) {
        Object.entries(headers).forEach(([key, value]) => {
          req.setHeader(key, value as string);
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
              parsedData = data as T;
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
    } catch (error) {
      console.error('请求失败：', error);
      reject(error);
    }
  });
};

export default requestNet;
