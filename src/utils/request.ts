import FetchService from "@/utils/FetchService/FetchService";
import { RequestParams } from "@/utils/FetchService/types";
import { API_BASE_URL } from "@/constant";
// import { useUserStore } from "@/store/user";

type ResponseType<T> = {
  code: string | number;
  data: T;
  msg: string;
  url: string;
};

export const fetchService = new FetchService({
  baseURL: API_BASE_URL,
  requestInterceptor(requestParams) {
    // const token = useUserStore.getState().token;

    requestParams.headers = {
      ...(requestParams["headers"] || {}),
      // Authorization: token,
    };

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

    if (data.code === "Unauthorized") {
      // useUserStore.getState().clearLoginStatus();
      return null;
    }

    if (data.code !== 0) {
      // if (typeof window !== "undefined")
      //   message.warning(data.msg || "网络繁忙，请稍后重试！");
      // return null;
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
