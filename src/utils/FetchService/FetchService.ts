import { Dictionary, IFetchServiceConfig, RequestParams } from "./types";

/**
 * 泛型：
 * T=返回类型
 */
class FetchService<T = Response> {
  baseURL: string;
  // 请求拦截
  requestInterceptor?: (
    requestParams: RequestParams,
  ) => RequestParams | void | null;
  // 响应拦截
  responseInterceptor?: (response: Response) => T;

  constructor({
    baseURL,
    requestInterceptor,
    responseInterceptor,
  }: IFetchServiceConfig<T>) {
    this.baseURL = baseURL;
    this.requestInterceptor = requestInterceptor;
    this.responseInterceptor = responseInterceptor;
  }

  // 过滤一个字典 value 为undefined的key
  private _filterDictUndefined(data: Dictionary) {
    return Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined),
    );
  }

  public async request(requestParams: RequestParams): Promise<T> {
    return new Promise(async (resolve, reject) => {
      // 请求拦截
      if (this.requestInterceptor) {
        const newRequestParams = this.requestInterceptor(requestParams);
        if (!newRequestParams) return reject(null);
        requestParams = newRequestParams;
      }

      // body 参数处理
      const fetchURL = this.baseURL + requestParams.url;
      if (!requestParams.body && requestParams.data) {
        requestParams.data = this._filterDictUndefined(requestParams.data);

        requestParams = {
          ...requestParams,
          body: JSON.stringify(requestParams.data),
          headers: {
            ...(requestParams["headers"] || {}),
            "content-type": "application/json",
          },
        };
      }

      // params 参数处理
      let params: string | null = null;
      if (requestParams.params) {
        requestParams.params = this._filterDictUndefined(requestParams.params);
        params = new URLSearchParams(requestParams.params).toString();
      }

      const res = await fetch(
        params ? `${fetchURL}?${params}` : fetchURL,
        requestParams,
      );

      if (this.responseInterceptor) {
        return resolve(this.responseInterceptor(res));
      }

      resolve(res as T);
    });
  }
}

export default FetchService;
