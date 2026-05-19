/**
 * TwitterParams - Twitter 发布参数设置
 * 重写为独立模块，统一管理回复权限、AI 标记、投票与媒体增强。
 */
import type { ForwardedRef } from 'react'
import type {
  IPlatsParamsProps,
  IPlatsParamsRef,
} from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/plats.type'
import type { IPlatOption } from '@/components/PublishDialog/publishDialog.type'
import { forwardRef, memo, useEffect } from 'react'
import usePlatParamsCommon from '@/components/PublishDialog/compoents/PlatParamsSetting/hooks/usePlatParamsCoomon'
import PubParmasTextarea from '@/components/PublishDialog/compoents/PubParmasTextarea'
import TwitterBaseSection from './TwitterBaseSection'
import TwitterMediaSection from './TwitterMediaSection'
import TwitterPollSection from './TwitterPollSection'
import { useTwitterPublishOption } from './useTwitterPublishOption'

type TwitterOption = NonNullable<IPlatOption['twitter']>

const TwitterParams = memo(
  forwardRef(
    (
      { pubItem, onImageToImage, isMobile }: IPlatsParamsProps,
      ref: ForwardedRef<IPlatsParamsRef>,
    ) => {
      const { pubParmasTextareaCommonParams, setOnePubParams } = usePlatParamsCommon(
        pubItem,
        onImageToImage,
        isMobile,
      )
      const { twitterOption, updateTwitterOption } = useTwitterPublishOption(pubItem, setOnePubParams)
      const images = pubItem.params.images ?? []
      const video = pubItem.params.video
      const hasImages = images.length > 0
      const hasVideo = Boolean(video)
      const hasMedia = hasImages || hasVideo
      const hasPoll = Boolean(twitterOption.poll)

      useEffect(() => {
        const patch: Partial<TwitterOption> = {}

        if ((!hasImages || hasVideo) && twitterOption.mediaTaggedUserIds?.length) {
          patch.mediaTaggedUserIds = undefined
        }
        if (!hasMedia && twitterOption.mediaMetadata?.length) {
          patch.mediaMetadata = undefined
        }

        if (Object.keys(patch).length > 0) {
          updateTwitterOption(patch)
        }
      }, [
        hasImages,
        hasMedia,
        hasVideo,
        twitterOption.mediaMetadata,
        twitterOption.mediaTaggedUserIds,
        updateTwitterOption,
      ])

      return (
        <PubParmasTextarea
          {...pubParmasTextareaCommonParams}
          extend={(
            <div className="space-y-3 border-t border-border bg-muted/20 p-3">
              <TwitterBaseSection option={twitterOption} onChange={updateTwitterOption} />
              <TwitterPollSection option={twitterOption} hasMedia={hasMedia} onChange={updateTwitterOption} />
              <TwitterMediaSection
                option={twitterOption}
                images={images}
                video={video}
                hasPoll={hasPoll}
                onChange={updateTwitterOption}
              />
            </div>
          )}
        />
      )
    },
  ),
)

TwitterParams.displayName = 'TwitterParams'

export default TwitterParams
