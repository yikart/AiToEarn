// plat构造器参数
import { Cookie } from "undici-types";

export interface IPlatConstrParams {
  // cookie
  cookieList: Cookie[];
  // 代理
  proxy?: string;
}
