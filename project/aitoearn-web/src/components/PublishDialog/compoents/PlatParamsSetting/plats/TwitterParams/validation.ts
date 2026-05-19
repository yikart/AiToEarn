import type { IPubParams } from '@/components/PublishDialog/publishDialog.type'

type TranslateFn = (key: string, options?: Record<string, number | string>) => string

export function getTwitterPublishValidationMessages(params: IPubParams, t: TranslateFn) {
  const errors: string[] = []

  if (params.images) {
    for (const img of params.images) {
      if (img.size > 5 * 1024 * 1024) {
        errors.push(t('validation.twitterImageSize'))
        break
      }
      if (img.width > 8192 || img.height > 8192) {
        errors.push(t('validation.twitterImageResolution'))
        break
      }
    }
  }

  if (params.video) {
    if (params.video.duration < 0.5 || params.video.duration > 140) {
      errors.push(t('validation.twitterVideoDuration'))
    }
    if (params.video.size > 512 * 1024 * 1024) {
      errors.push(t('validation.twitterVideoSize'))
    }
  }

  const poll = params.option?.twitter?.poll
  if (poll) {
    const validOptions = poll.options.map(option => option.trim()).filter(Boolean)
    if (validOptions.length < 2) {
      errors.push(t('validation.twitterPollMinOptions'))
    }
    if (poll.options.some(option => option.trim().length === 0 || option.trim().length > 25)) {
      errors.push(t('validation.twitterPollOptionInvalid'))
    }
    if (poll.durationMinutes < 5 || poll.durationMinutes > 10080) {
      errors.push(t('validation.twitterPollDuration'))
    }
    if ((params.images && params.images.length > 0) || params.video) {
      errors.push(t('validation.twitterPollNoMedia'))
    }
  }

  const taggedUserIds = params.option?.twitter?.mediaTaggedUserIds ?? []
  if (taggedUserIds.length > 10) {
    errors.push(t('validation.twitterTaggedUsersLimit'))
  }

  const mediaMetadata = params.option?.twitter?.mediaMetadata ?? []
  if (mediaMetadata.some(item => (item.altText?.length ?? 0) > 1000)) {
    errors.push(t('validation.twitterAltTextMax'))
  }

  return errors
}
