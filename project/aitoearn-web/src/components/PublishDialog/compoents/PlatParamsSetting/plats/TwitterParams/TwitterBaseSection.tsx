import type { TwitterReplySettings } from '@/api/types/twitter'
import type { IPlatOption } from '@/components/PublishDialog/publishDialog.type'
import { Bot, MessageCircle } from 'lucide-react'
import { useMemo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { TWITTER_REPLY_SETTINGS } from './constants'

type TwitterOption = NonNullable<IPlatOption['twitter']>

interface TwitterBaseSectionProps {
  option: TwitterOption
  onChange: (patch: Partial<TwitterOption>) => void
}

export default function TwitterBaseSection({ option, onChange }: TwitterBaseSectionProps) {
  const { t } = useTransClient('publish')

  const replyOptions = useMemo(() => {
    return TWITTER_REPLY_SETTINGS.map(value => ({
      value,
      label: t(`twitter.replySettings.${value}`),
    }))
  }, [t])

  return (
    <section className="rounded-md border border-border bg-background p-4">
      <div className="mb-4 flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium text-foreground">{t('twitter.sections.basic')}</h4>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{t('twitter.replyTo')}</Label>
          <Select
            value={option.replySettings ?? 'everyone'}
            onValueChange={(value) => {
              onChange({
                replySettings: value === 'everyone' ? undefined : value as TwitterReplySettings,
              })
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="everyone">{t('twitter.everyone')}</SelectItem>
              {replyOptions.map(item => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{t('twitter.aiContent')}</Label>
          <div className="flex h-9 items-center justify-between rounded-md border border-border px-3">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Bot className="h-4 w-4 text-muted-foreground" />
              {t('twitter.containsAi')}
            </div>
            <Switch
              checked={!!option.madeWithAi}
              onCheckedChange={checked => onChange({ madeWithAi: checked })}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
