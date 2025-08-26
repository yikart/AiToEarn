import FetchService from "@/utils/FetchService/FetchService";
import { RequestParams } from "@/utils/FetchService/types";
import { useUserStore } from "@/store/user";
import { message } from "antd";

type ResponseType<T> = {
  code: string | number;
  data: T;
  message: string;
  url: string;
};

const fetchService = new FetchService({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/`,
  requestInterceptor(requestParams) {
    const token = useUserStore.getState().token;

    requestParams.headers = {
      ...(requestParams["headers"] || {}),
      Authorization: token ? `Bearer ${token}` : "",
    };

    // 添加语言头
    if (typeof window !== "undefined") {
      const lng = useUserStore.getState().lang;
      requestParams.headers = {
        ...requestParams.headers,
        "Accept-Language": lng,
      };
    }

    return requestParams;
  },
  responseInterceptor(response) {
    return response;
  },
});

export async function request<T>(params: RequestParams) {
  try {
    const res = await fetchService.request(params);
    const data: ResponseType<T> = await res.json();

    if (res.status === 401) {
      // useUserStore.getState().logout();
      // message.error({
      //   key: "NoPermission",
      //   content: "登录状态过期，请重新登录",
      // });
      return data;
    }

    if (data.code !== 0) {
      if (typeof window !== "undefined")
        message.warning({
          content: data.message || "网络繁忙，请稍后重试！",
          key: "apiErrorMessage",
        });
      return null;
    }

    return data;
  } catch (e) {
    console.warn(e);
    return null;
  }
}

export default {
  get<T>(url: string, data?: any) {
    return request<T>({
      url,
      params: data,
      method: "GET",
    });
  },
  post<T>(url: string, data?: any) {
    return request<T>({
      url,
      data: data,
      method: "POST",
    });
  },
  put<T>(url: string, data?: any) {
    return request<T>({
      url,
      data: data,
      method: "PUT",
    });
  },
  delete<T>(url: string, data?: any) {
    return request<T>({
      url,
      data: data,
      method: "DELETE",
    });
  },
};
