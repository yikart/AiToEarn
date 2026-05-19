import type { TwitterPollConfig, TwitterReplySettings } from '@/api/types/twitter'
import type { IPlatOption } from '@/components/PublishDialog/publishDialog.type'
import { BarChart3, Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NumberInput } from '@/components/ui/number-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  TWITTER_DEFAULT_POLL_DURATION,
  TWITTER_MAX_POLL_OPTIONS,
  TWITTER_MIN_POLL_OPTIONS,
  TWITTER_REPLY_SETTINGS,
} from './constants'

type TwitterOption = NonNullable<IPlatOption['twitter']>

interface TwitterPollSectionProps {
  option: TwitterOption
  hasMedia: boolean
  onChange: (patch: Partial<TwitterOption>) => void
}

export default function TwitterPollSection({ option, hasMedia, onChange }: TwitterPollSectionProps) {
  const { t } = useTransClient('publish')
  const poll = option.poll
  const enabled = Boolean(poll)

  const replyOptions = useMemo(() => {
    return TWITTER_REPLY_SETTINGS.map(value => ({
      value,
      label: t(`twitter.replySettings.${value}`),
    }))
  }, [t])

  const updatePoll = (patch: Partial<TwitterPollConfig>) => {
    onChange({
      poll: {
        options: poll?.options ?? ['', ''],
        durationMinutes: poll?.durationMinutes ?? TWITTER_DEFAULT_POLL_DURATION,
        replySettings: poll?.replySettings,
        ...patch,
      },
    })
  }

  const setPollEnabled = (checked: boolean) => {
    if (!checked) {
      onChange({ poll: undefined })
      return
    }
    onChange({
      poll: {
        options: ['', ''],
        durationMinutes: TWITTER_DEFAULT_POLL_DURATION,
      },
    })
  }

  const options = poll?.options ?? []

  return (
    <section className="rounded-md border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium text-foreground">{t('twitter.sections.poll')}</h4>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t('twitter.sections.pollDesc')}</p>
        </div>
        <Switch checked={enabled} onCheckedChange={setPollEnabled} disabled={hasMedia && !enabled} />
      </div>

      {hasMedia && (
        <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {t('twitter.pollMediaWarning')}
        </p>
      )}

      {enabled && (
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t('twitter.pollOptionsLabel')}</Label>
            {options.map((value, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-5 text-xs text-muted-foreground">{index + 1}</span>
                <Input
                  value={value}
                  onChange={(event) => {
                    const nextOptions = [...options]
                    nextOptions[index] = event.target.value
                    updatePoll({ options: nextOptions })
                  }}
                  maxLength={25}
                  placeholder={t('twitter.pollOptionPlaceholder', { n: index + 1 })}
                  className="h-9"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={options.length <= TWITTER_MIN_POLL_OPTIONS}
                  onClick={() => updatePoll({ options: options.filter((_, itemIndex) => itemIndex !== index) })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {options.length < TWITTER_MAX_POLL_OPTIONS && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => updatePoll({ options: [...options, ''] })}
              >
                <Plus className="h-4 w-4" />
                {t('twitter.addPollOption')}
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('twitter.duration')}</Label>
              <NumberInput
                value={poll?.durationMinutes ?? TWITTER_DEFAULT_POLL_DURATION}
                onValueChange={(value) => {
                  if (value != null)
                    updatePoll({ durationMinutes: value })
                }}
                min={5}
                max={10080}
                className="h-9"
              />
              <p className="text-xs text-muted-foreground">{t('twitter.durationRange')}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('twitter.pollReply')}</Label>
              <Select
                value={poll?.replySettings ?? 'everyone'}
                onValueChange={(value) => {
                  updatePoll({
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
          </div>
        </div>
      )}
    </section>
  )
}
