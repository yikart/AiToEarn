import FetchService from "@/utils/FetchService/FetchService";
import { RequestParams } from "@/utils/FetchService/types";

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
}

const requestPlatapi = new OtherRequest("https://platapi.yikart.cn/api/");
export async function requestPlatApi<T = any>(params: RequestParams) {
  const res = await requestPlatapi.request(params);
  return res.data.response_body as T;
}
