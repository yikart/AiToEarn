/**
 * CreditsPreviewTable - Twitter 积分确认说明
 * 展示面向用户的功能单价。
 */
import type { TwitterCreditsRow } from '../../constants'
import { useTransClient } from '@/app/i18n/client'
import {
  TWITTER_READ_CREDIT_ROWS,
  TWITTER_WRITE_API_CREDIT_ROWS,
} from '../../constants'

function PriceGroup({ title, rows }: { title: string, rows: TwitterCreditsRow[] }) {
  const { t } = useTransClient('account')

  return (
    <section className="rounded-md border border-border bg-background">
      <div className="border-b border-border bg-muted/40 px-4 py-2">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
      </div>
      <div className="divide-y divide-border">
        {rows.map(row => (
          <div key={row.labelKey} className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <div className="text-sm text-foreground">{t(`twitter.creditsRows.${row.labelKey}`)}</div>
            </div>
            <div className="text-sm font-medium text-foreground">{t(`twitter.creditsPrices.${row.priceKey}`)}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function CreditsPreviewTable() {
  const { t } = useTransClient('account')

  return (
    <div className="w-full max-w-2xl space-y-4">
      <PriceGroup title={t('twitter.creditsSummary.readTitle')} rows={TWITTER_READ_CREDIT_ROWS} />
      <PriceGroup title={t('twitter.creditsSummary.writeTitle')} rows={TWITTER_WRITE_API_CREDIT_ROWS} />
    </div>
  )
}
