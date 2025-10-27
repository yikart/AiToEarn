import { net, session, Session } from 'electron';
import FormData from 'form-data';
import { ipv4Regular } from '../../commont/regular';
import { parseProxyString } from '../../commont/utils';
import { ProxyInfo } from '@@/utils.type';

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
  let customSession: Session;
  let proxyInfo: ProxyInfo | false;
  return new Promise(async (resolve, reject) => {
    try {
      // 如果传入了代理配置，动态设置代理
      if (proxy) {
        // 解析代理信息
        proxyInfo = parseProxyString(proxy);
        if (proxyInfo === false || !ipv4Regular.test(proxyInfo.ipAndPort))
          throw new Error('代理地址不合法');
        customSession = session.fromPartition(
          `persist:proxy-session-${Date.now()}`,
        );
        const proxyUrl = `${proxyInfo.protocol}://${proxyInfo.ipAndPort}`;
        const proxyRules = `http=${proxyUrl};https=${proxyUrl}`;
        console.log(proxyRules);
        await customSession.setProxy({
          proxyRules,
        });

        headers = {
          ...(headers ? headers : {}),
          ...(proxy
            ? {
                'x-forwarded-for': proxyInfo.ipAndPort,
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

      if (proxyInfo && typeof proxyInfo === 'object') {
        req.on('login', (authInfo, callback) => {
          callback(
            (proxyInfo as ProxyInfo).username,
            (proxyInfo as ProxyInfo).password,
          );
        });
      }

      // 错误处理
      req.on('error', (error) => {
        console.log('error:', error);
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
      console.log('请求失败：', error);
      reject(error);
    }
  });
};

export default requestNet;
