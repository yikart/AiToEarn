import { net, session, Session } from 'electron';
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
  // 代理配置，例如 "http=proxy1.com:8080"
  proxy?: string;
}

export const convertToProxyFormat = (url: string): string => {
  const urlPattern = /^(https?):\/\/([^:\/]+(:\d+)?)(\/.*)?$/; // 匹配协议、域名/IP 和端口号
  const ipPattern = /^\d{1,3}(\.\d{1,3}){3}(:\d+)?$/; // 匹配 IP 地址格式以及可选端口号

  if (ipPattern.test(url)) {
    // 如果是 IP 地址（可能带端口号），默认使用 HTTP 协议
    return `http=${url}`;
  } else if (urlPattern.test(url)) {
    // 如果是 URL，提取协议、域名/IP 和端口号
    const [, protocol, domainWithPort] = url.match(urlPattern)!;
    return `${protocol}=${domainWithPort}`;
  } else {
    return url;
  }
};

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
        const proxyFormat = convertToProxyFormat(proxy);
        console.log('代理地址：', proxyFormat);
        customSession = session.fromPartition(
          `persist:proxy-session-${Date.now()}`,
        );
        await customSession.setProxy({ proxyRules: proxyFormat });

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
      reject(error);
    }
  });
};

export default requestNet;
