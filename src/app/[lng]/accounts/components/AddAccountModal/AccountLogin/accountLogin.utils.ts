import { Cookie } from "undici-types";

export function parseCookieString(cookieString: string): Cookie[] {
  return cookieString
    .split(";")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const eqIndex = pair.indexOf("=");
      let name = "",
        value = "";
      if (eqIndex !== -1) {
        name = pair.slice(0, eqIndex).trim();
        value = pair.slice(eqIndex + 1).trim();
      } else {
        name = pair.trim();
        value = "";
      }
      return { name, value } as Cookie;
    })
    .filter((cookie) => cookie.value !== ""); // 过滤掉 value 为空字符串的
}
