import { ExceptionCode } from '../enums/exception-code.enum'

const codeMessageMap: Partial<Record<ExceptionCode, string>> = {
  [ExceptionCode.Success]: '请求成功',
}
export function getCodeMessage(code: ExceptionCode) {
  return codeMessageMap[code] || '未知错误'
}
