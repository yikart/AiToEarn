import { ICurrency, RefundStatus } from '../stripe.interface'

export interface IRefund {
  payment_intent: string
  amount: number
  reason?: string
  status?: RefundStatus
  currency?: ICurrency
  metadata?: object
}
