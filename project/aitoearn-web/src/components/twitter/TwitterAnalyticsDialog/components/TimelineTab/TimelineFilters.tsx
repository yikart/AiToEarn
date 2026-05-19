/**
 * TimelineFilters - 时间线筛选面板
 */
import { useTransClient } from '@/app/i18n/client'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface TimelineFiltersProps {
  excludeRetweets: boolean
  excludeReplies: boolean
  onChange: (key: 'retweets' | 'replies', value: boolean) => void
}

export default function TimelineFilters({ excludeRetweets, excludeReplies, onChange }: TimelineFiltersProps) {
  const { t } = useTransClient('account')

  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b border-border text-sm">
      <div className="flex items-center gap-2">
        <Switch
          id="exclude-retweets"
          checked={excludeRetweets}
          onCheckedChange={v => onChange('retweets', v)}
        />
        <Label htmlFor="exclude-retweets" className="text-xs cursor-pointer">{t('twitter.hideRetweets')}</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="exclude-replies"
          checked={excludeReplies}
          onCheckedChange={v => onChange('replies', v)}
        />
        <Label htmlFor="exclude-replies" className="text-xs cursor-pointer">{t('twitter.hideReplies')}</Label>
      </div>
    </div>
  )
}
