/** 当前环境对应的货币代码 */
export const appCurrency = 'USD'

/** 当前环境对应的货币符号 */
export const appCurrencySymbol = '$'

/** 货币代码到符号的映射 */
const currencySymbolMap: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
}

/** 根据货币代码获取对应符号，未知货币回退到当前环境符号 */
export function getCurrencySymbol(currency?: string): string {
  if (!currency)
    return appCurrencySymbol
  return currencySymbolMap[currency] || appCurrencySymbol
}

/** 分转元，格式化为两位小数 */
export function formatCents(cents: number | null | undefined): string {
  if (cents == null || Number.isNaN(cents))
    return '0.00'
  return (cents / 100).toFixed(2)
}
