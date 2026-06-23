import type { TwitterOption } from './types'
import type {
  IImgFile,
  IVideoFile,
} from '@/components/PublishDialog/publishDialog.type'
import { ImageIcon, Plus, Tag, Trash2, Video } from 'lucide-react'
import { useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { OssImage } from '@/components/common/OssImage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utils/className'
import { TWITTER_MAX_ALT_TEXT_LENGTH, TWITTER_MAX_TAGGED_USERS } from './constants'

interface TwitterMediaSectionProps {
  option: TwitterOption
  images: IImgFile[]
  video?: IVideoFile
  hasPoll: boolean
  onChange: (patch: Partial<TwitterOption>) => void
}

export default function TwitterMediaSection({
  option,
  images,
  video,
  hasPoll,
  onChange,
}: TwitterMediaSectionProps) {
  const { t } = useTransClient('publish')
  const [tagInput, setTagInput] = useState('')
  const hasImages = images.length > 0
  const hasVideo = Boolean(video)
  const hasMedia = hasImages || hasVideo
  const taggedUserIds = option.mediaTaggedUserIds ?? []
  const mediaMetadata = option.mediaMetadata ?? []
  const mediaCount = images.length + (video ? 1 : 0)
  const altTextCount = mediaMetadata.filter(item => item.altText?.trim()).length

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
    <section className="p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium text-foreground">{t('twitter.sections.media')}</h4>
            {hasMedia && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {altTextCount}
                /
                {mediaCount}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {t('twitter.sections.mediaDesc')}
          </p>
        </div>
      </div>

      {hasPoll && (
        <p className="mt-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
          {t('twitter.mediaDisabledByPoll')}
        </p>
      )}

      {!hasMedia && (
        <div className="mt-2 rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-center text-xs text-muted-foreground">
          {t('twitter.noMediaOptions')}
        </div>
      )}

      {hasMedia && (
        <div className={cn('mt-3 space-y-3', hasPoll && 'opacity-60')}>
          {hasImages && (
            <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-xs font-normal text-muted-foreground">
                    {t('twitter.tagUsers')}
                  </Label>
                </div>
                <span className="text-xs text-muted-foreground">
                  {taggedUserIds.length}
                  /
                  {TWITTER_MAX_TAGGED_USERS}
                </span>
              </div>
              {taggedUserIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {taggedUserIds.map(userId => (
                    <span
                      key={userId}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-xs text-foreground"
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
              )}
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
                    className="h-8"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={addTaggedUser}
                    disabled={!tagInput.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">{t('twitter.tagUsersLimit')}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-normal text-muted-foreground">
              {t('twitter.altText')}
            </Label>
            {images.map((imageFile, index) => (
              <div
                key={imageFile.id}
                className="grid gap-2 rounded-md border border-border bg-background p-2 md:grid-cols-[44px_minmax(0,1fr)]"
              >
                <OssImage
                  src={imageFile.ossUrl ?? imageFile.imgUrl}
                  alt=""
                  width={44}
                  height={44}
                  thumbnailSize={44}
                  className="h-11 w-11 rounded-md object-cover"
                />
                <Textarea
                  value={mediaMetadata[index]?.altText ?? ''}
                  onChange={event => updateAltText(index, event.target.value)}
                  maxLength={TWITTER_MAX_ALT_TEXT_LENGTH}
                  placeholder={t('twitter.altTextImagePlaceholder')}
                  className="min-h-14 resize-none py-1.5 text-sm"
                />
              </div>
            ))}

            {video && (
              <div className="grid gap-2 rounded-md border border-border bg-background p-2 md:grid-cols-[44px_minmax(0,1fr)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Video className="h-5 w-5" />
                </div>
                <Textarea
                  value={mediaMetadata[0]?.altText ?? ''}
                  onChange={event => updateAltText(0, event.target.value)}
                  maxLength={TWITTER_MAX_ALT_TEXT_LENGTH}
                  placeholder={t('twitter.altTextVideoPlaceholder')}
                  className="min-h-14 resize-none py-1.5 text-sm"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
