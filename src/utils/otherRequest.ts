import FetchService from "@/utils/FetchService/FetchService";
import { RequestParams } from "@/utils/FetchService/types";
import { request } from "@/utils/request";

class OtherRequest {
  fetchService;

  constructor(baseURL: string) {
    this.fetchService = new FetchService({
      baseURL,
      requestInterceptor(requestParams) {
        return requestParams;
      },
      responseInterceptor(response) {
        return response;
      },
    });
  }

  async request<T = any>(params: RequestParams) {
    const res = await this.fetchService.request(params);
    return (await res.json()) as T;
  }

  get<T>(url: string, data?: any) {
    return request<T>({
      url,
      params: data,
      method: "GET",
    });
  }

  post<T>(url: string, data?: any) {
    return request<T>({
      url,
      data: data,
      method: "POST",
    });
  }

  put<T>(url: string, data?: any) {
    return request<T>({
      url,
      data: data,
      method: "PUT",
    });
  }

  delete<T>(url: string, data?: any) {
    return request<T>({
      url,
      data: data,
      method: "DELETE",
    });
  }
}

const requestPlatapi = new OtherRequest("https://platapi.yikart.cn/api/");
export async function requestPlatApi<T = any>(params: RequestParams) {
  return await requestPlatapi.request(params);
}
