import { ResponseCode } from '../enums/response-code.enum'

const codeMessageMap: Partial<Record<ResponseCode, string>> = {
  [ResponseCode.Success]: '请求成功',
}
export function getCodeMessage(code: ResponseCode) {
  return codeMessageMap[code] || '未知错误'
}
