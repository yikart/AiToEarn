import { Currency } from '../enums/currency.enum'

const CURRENCY_MAP: Record<string, Currency> = Object.fromEntries(
  Object.values(Currency).map(c => [c, c]),
)

export function parseCurrency(raw: string): Currency {
  const currency = CURRENCY_MAP[raw.toUpperCase()]
  if (!currency) {
    throw new Error(`Unsupported currency: ${raw}`)
  }
  return currency
}
