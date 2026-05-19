import type { IImgFile, IPlatOption, IVideoFile } from '@/components/PublishDialog/publishDialog.type'
import { ImageIcon, Plus, Tag, Trash2, Video } from 'lucide-react'
import NextImage from 'next/image'
import { useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  TWITTER_MAX_ALT_TEXT_LENGTH,
  TWITTER_MAX_TAGGED_USERS,
} from './constants'

type TwitterOption = NonNullable<IPlatOption['twitter']>

interface TwitterMediaSectionProps {
  option: TwitterOption
  images: IImgFile[]
  video?: IVideoFile
  hasPoll: boolean
  onChange: (patch: Partial<TwitterOption>) => void
}

export default function TwitterMediaSection({ option, images, video, hasPoll, onChange }: TwitterMediaSectionProps) {
  const { t } = useTransClient('publish')
  const [tagInput, setTagInput] = useState('')
  const hasImages = images.length > 0
  const hasVideo = Boolean(video)
  const hasMedia = hasImages || hasVideo
  const taggedUserIds = option.mediaTaggedUserIds ?? []
  const mediaMetadata = option.mediaMetadata ?? []

  const updateAltText = (index: number, altText: string) => {
    const nextMetadata = [...mediaMetadata]
    while (nextMetadata.length <= index) {
      nextMetadata.push({})
    }
    nextMetadata[index] = { ...nextMetadata[index], altText }
    onChange({ mediaMetadata: nextMetadata })
  }

  const addTaggedUser = () => {
    const value = tagInput.trim()
    if (!value || taggedUserIds.includes(value) || taggedUserIds.length >= TWITTER_MAX_TAGGED_USERS)
      return
    onChange({ mediaTaggedUserIds: [...taggedUserIds, value] })
    setTagInput('')
  }

  const removeTaggedUser = (userId: string) => {
    onChange({ mediaTaggedUserIds: taggedUserIds.filter(item => item !== userId) })
  }

  return (
    <section className="rounded-md border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium text-foreground">{t('twitter.sections.media')}</h4>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t('twitter.sections.mediaDesc')}</p>
        </div>
      </div>

      {hasPoll && (
        <p className="mt-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {t('twitter.mediaDisabledByPoll')}
        </p>
      )}

      {!hasMedia && (
        <div className="mt-4 rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          {t('twitter.noMediaOptions')}
        </div>
      )}

      {hasMedia && (
        <div className={cn('mt-4 space-y-4', hasPoll && 'opacity-60')}>
          {hasImages && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs text-muted-foreground">{t('twitter.tagUsers')}</Label>
              </div>
              <div className="flex flex-wrap gap-2">
                {taggedUserIds.map(userId => (
                  <span
                    key={userId}
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-foreground"
                  >
                    {userId}
                    <button
                      type="button"
                      className="cursor-pointer text-muted-foreground hover:text-destructive"
                      onClick={() => removeTaggedUser(userId)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              {taggedUserIds.length < TWITTER_MAX_TAGGED_USERS && (
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={event => setTagInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        addTaggedUser()
                      }
                    }}
                    placeholder={t('twitter.tagUsersPlaceholder')}
                    className="h-9"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addTaggedUser} disabled={!tagInput.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">{t('twitter.tagUsersLimit')}</p>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">{t('twitter.altText')}</Label>
            {images.map((imageFile, index) => (
              <div key={imageFile.id} className="grid gap-3 rounded-md border border-border p-3 md:grid-cols-[56px_minmax(0,1fr)]">
                <NextImage src={imageFile.imgUrl} alt="" width={56} height={56} className="h-14 w-14 rounded-md object-cover" unoptimized />
                <Textarea
                  value={mediaMetadata[index]?.altText ?? ''}
                  onChange={event => updateAltText(index, event.target.value)}
                  maxLength={TWITTER_MAX_ALT_TEXT_LENGTH}
                  placeholder={t('twitter.altTextImagePlaceholder')}
                  className="min-h-20 resize-none"
                />
              </div>
            ))}

            {video && (
              <div className="grid gap-3 rounded-md border border-border p-3 md:grid-cols-[56px_minmax(0,1fr)]">
                <div className="flex h-14 w-14 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Video className="h-5 w-5" />
                </div>
                <Textarea
                  value={mediaMetadata[0]?.altText ?? ''}
                  onChange={event => updateAltText(0, event.target.value)}
                  maxLength={TWITTER_MAX_ALT_TEXT_LENGTH}
                  placeholder={t('twitter.altTextVideoPlaceholder')}
                  className="min-h-20 resize-none"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
