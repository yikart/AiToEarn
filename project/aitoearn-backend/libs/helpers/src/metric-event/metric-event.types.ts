import { MetricEventName } from './metric-event.constants'

export type MetricEventNameValue = (typeof MetricEventName)[keyof typeof MetricEventName]

export interface MetricEventRecordInput {
  bizKey?: string
  properties?: Record<string, unknown>
  source?: 'backend' | 'frontend'
  timestamp?: number
}
