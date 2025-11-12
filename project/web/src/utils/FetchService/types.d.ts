export interface RequestParams extends RequestInit {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  data?: Dictionary;
  params?: Dictionary;
}

export type Dictionary<T = any> = {
  [key: string]: T;
};

export interface IFetchServiceConfig<T = Response> {
  baseURL: string;
  requestInterceptor?: (
    requestParams: RequestParams,
  ) => RequestParams | void | null;
  responseInterceptor?: (response: Response) => T;
}
