import type { TwitterOption, TwitterPollConfig, TwitterReplySettings } from './types'
import { BarChart3, Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NumberInput } from '@/components/ui/number-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  TWITTER_DEFAULT_POLL_DURATION,
  TWITTER_MAX_POLL_OPTIONS,
  TWITTER_MIN_POLL_OPTIONS,
  TWITTER_REPLY_SETTINGS,
} from './constants'

interface TwitterPollSectionProps {
  option: TwitterOption
  hasMedia: boolean
  onChange: (patch: Partial<TwitterOption>) => void
}

export default function TwitterPollSection({
  option,
  hasMedia,
  onChange,
}: TwitterPollSectionProps) {
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
    <section className="p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium text-foreground">{t('twitter.sections.poll')}</h4>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={setPollEnabled}
        />
      </div>

      {enabled && hasMedia && (
        <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
          {t('twitter.pollMediaWarning')}
        </p>
      )}

      {enabled && (
        <div className="mt-3 space-y-3 rounded-md border border-border bg-muted/20 p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs font-normal text-muted-foreground">
                {t('twitter.pollOptionsLabel')}
              </Label>
              {options.length < TWITTER_MAX_POLL_OPTIONS && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => updatePoll({ options: [...options, ''] })}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t('twitter.addPollOption')}
                </Button>
              )}
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {options.map((value, index) => (
                <div
                  key={index}
                  className="group flex h-9 items-center gap-2 rounded-md border border-input bg-background px-2 shadow-sm transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                  <Input
                    value={value}
                    onChange={(event) => {
                      const nextOptions = [...options]
                      nextOptions[index] = event.target.value
                      updatePoll({ options: nextOptions })
                    }}
                    maxLength={25}
                    placeholder={t('twitter.pollOptionPlaceholder', { n: index + 1 })}
                    className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground opacity-70 hover:text-destructive group-hover:opacity-100"
                    disabled={options.length <= TWITTER_MIN_POLL_OPTIONS}
                    onClick={() =>
                      updatePoll({ options: options.filter((_, itemIndex) => itemIndex !== index) })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-normal text-muted-foreground">
                {t('twitter.durationWithRange', { range: t('twitter.durationRange') })}
              </Label>
              <NumberInput
                value={poll?.durationMinutes ?? TWITTER_DEFAULT_POLL_DURATION}
                onValueChange={(value) => {
                  if (value != null)
                    updatePoll({ durationMinutes: value })
                }}
                min={5}
                max={10080}
                className="h-8"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-normal text-muted-foreground">
                {t('twitter.pollReply')}
              </Label>
              <Select
                value={poll?.replySettings ?? 'everyone'}
                onValueChange={(value) => {
                  updatePoll({
                    replySettings:
                      value === 'everyone' ? undefined : (value as TwitterReplySettings),
                  })
                }}
              >
                <SelectTrigger className="h-8">
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
