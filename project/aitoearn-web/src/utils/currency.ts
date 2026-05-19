/** 当前环境对应的货币代码 */
export const appCurrency = 'USD'

/** 当前环境对应的货币符号 */
export const appCurrencySymbol = '$'

/** 货币代码到符号的映射（优先查找，覆盖常见货币） */
const currencySymbolMap: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  PHP: '₱',
  THB: '฿',
  KRW: '₩',
  VND: '₫',
  INR: '₹',
  IDR: 'Rp',
  MYR: 'RM',
  SGD: 'S$',
  HKD: 'HK$',
  TWD: 'NT$',
  AUD: 'A$',
  CAD: 'C$',
  NZD: 'NZ$',
  BRL: 'R$',
  MXN: 'MX$',
  RUB: '₽',
  TRY: '₺',
  ZAR: 'R',
  AED: 'د.إ',
  SAR: '﷼',
  NGN: '₦',
  EGP: 'E£',
  PKR: '₨',
  BDT: '৳',
  ARS: 'AR$',
}

/** Intl.NumberFormat 兜底缓存（处理 Map 中未覆盖的货币） */
const intlSymbolCache = new Map<string, string>()

/** 根据货币代码获取对应符号，优先硬编码 Map，未命中走 Intl.NumberFormat 兜底 */
export function getCurrencySymbol(currency?: string): string {
  if (!currency)
    return appCurrencySymbol
  if (currencySymbolMap[currency])
    return currencySymbolMap[currency]
  const cached = intlSymbolCache.get(currency)
  if (cached)
    return cached
  try {
    const symbol = new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    })
      .formatToParts(0)
      .find(p => p.type === 'currency')
      ?.value ?? currency
    intlSymbolCache.set(currency, symbol)
    return symbol
  }
  catch {
    return currency
  }
}

/** 分转元，格式化为两位小数 */
export function formatCents(cents: number | null | undefined): string {
  if (cents == null || Number.isNaN(cents))
    return '0.00'
  return (cents / 100).toFixed(2)
}

/** 货币展示结构化数据 */
export interface CurrencyDisplay {
  /** 货币符号，如 '₱' */
  symbol: string
  /** 格式化后的金额，如 '100.00' */
  amount: string
  /** 货币代码，如 'PHP' */
  code: string
  /** 完整文本，如 '₱100.00 PHP'（纯文本场景用） */
  text: string
}

/**
 * 生成货币展示结构化数据
 * @param value 金额值
 * @param currencyCode 货币代码，默认 appCurrency
 * @param isCents 是否为分（默认 true，会除以 100；false 则直接使用原值）
 */
export function formatCurrencyDisplay(
  value: number | string | null | undefined,
  currencyCode?: string,
  isCents: boolean = true,
): CurrencyDisplay {
  const code = currencyCode || appCurrency
  const symbol = getCurrencySymbol(code)
  const amount = isCents
    ? formatCents(typeof value === 'string' ? Number(value) : value)
    : String(value ?? '0.00')
  return {
    symbol,
    amount,
    code,
    text: `${symbol}${amount} ${code}`,
  }
}
