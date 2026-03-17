/**
 * PlatParamsSetting - 平台参数设置组件
 * 根据平台类型显示对应的参数设置表单
 */
import type { CSSProperties, ForwardedRef } from 'react'
import type { IImgFile, PubItem } from '@/components/PublishDialog/publishDialog.type'
import { forwardRef, memo, useMemo } from 'react'

import { useShallow } from 'zustand/react/shallow'
import { AccountPlatInfoMap, PlatType } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import BilibParams from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/BilibParams'
import FacebookParams from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/FacebookParams'
import InstagramParams from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/InstagramParams'
import KwaiParams from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/KwaiParams'
import PinterestParams from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/PinterestParams'
import ThreadsParams from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/ThreadsParams'
import TikTokParams from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/TikTokParams'
import WxGzhParams from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/WxGzhParams'
import YouTubeParams from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/YouTubeParams'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { cn } from '@/lib/utils'
import DouyinParams from './plats/DouyinParams'
import XhsParams from './plats/XhsParams'

export interface IPlatParamsSettingRef {}

export interface IPlatParamsSettingProps {
  pubItem: PubItem
  style?: CSSProperties
  onImageToImage?: (imageFile: IImgFile) => void
  // 是否为移动端
  isMobile?: boolean
}

const PlatParamsSetting = memo(
  forwardRef(
    (
      { pubItem, style, onImageToImage, isMobile }: IPlatParamsSettingProps,
      ref: ForwardedRef<IPlatParamsSettingRef>,
    ) => {
      const { expandedPubItem, step, setExpandedPubItem } = usePublishDialog(
        useShallow(state => ({
          expandedPubItem: state.expandedPubItem,
          step: state.step,
          setExpandedPubItem: state.setExpandedPubItem,
        })),
      )
      const { t } = useTransClient('publish')

      const platConfig = useMemo(() => {
        return AccountPlatInfoMap.get(pubItem.account.type)!
      }, [pubItem])

      const PlatItemComp = useMemo(() => {
        switch (pubItem.account.type) {
          case PlatType.KWAI:
            return (
              <KwaiParams pubItem={pubItem} onImageToImage={onImageToImage} isMobile={isMobile} />
            )
          case PlatType.BILIBILI:
            return (
              <BilibParams pubItem={pubItem} onImageToImage={onImageToImage} isMobile={isMobile} />
            )
          case PlatType.WxGzh:
            return (
              <WxGzhParams pubItem={pubItem} onImageToImage={onImageToImage} isMobile={isMobile} />
            )
          case PlatType.Facebook:
            return (
              <FacebookParams
                pubItem={pubItem}
                onImageToImage={onImageToImage}
                isMobile={isMobile}
              />
            )
          case PlatType.Instagram:
            return (
              <InstagramParams
                pubItem={pubItem}
                onImageToImage={onImageToImage}
                isMobile={isMobile}
              />
            )
          case PlatType.YouTube:
            return (
              <YouTubeParams
                pubItem={pubItem}
                onImageToImage={onImageToImage}
                isMobile={isMobile}
              />
            )
          case PlatType.Pinterest:
            return (
              <PinterestParams
                pubItem={pubItem}
                onImageToImage={onImageToImage}
                isMobile={isMobile}
              />
            )
          case PlatType.Tiktok:
            return (
              <TikTokParams pubItem={pubItem} onImageToImage={onImageToImage} isMobile={isMobile} />
            )
          case PlatType.Threads:
            return (
              <ThreadsParams
                pubItem={pubItem}
                onImageToImage={onImageToImage}
                isMobile={isMobile}
              />
            )
          case PlatType.Douyin:
            return (
              <DouyinParams pubItem={pubItem} onImageToImage={onImageToImage} isMobile={isMobile} />
            )
          case PlatType.Xhs:
            return (
              <XhsParams pubItem={pubItem} onImageToImage={onImageToImage} isMobile={isMobile} />
            )
          default:
            return (
              <KwaiParams pubItem={pubItem} onImageToImage={onImageToImage} isMobile={isMobile} />
            )
        }
      }, [pubItem, onImageToImage, isMobile])

      // true=展开当前账号的参数设置 false=不展开
      const isExpand = useMemo(() => {
        if (step === 0)
          return true
        return expandedPubItem?.account.id === pubItem.account.id
      }, [expandedPubItem, pubItem, step])

      // 检查描述是否超过最大长度
      const isTextOverflow = platConfig.commonPubParamsConfig.desMax < pubItem.params.des.length

      return (
        <div
          className={cn(!isExpand && 'flex items-center')}
          onClick={e => e.stopPropagation()}
          style={style}
        >
          <div className="flex w-full min-w-0">
            {/* 平台图标 */}
            <div className="mt-[5px] mr-2.5 shrink-0">
              <img
                src={platConfig.icon}
                className="w-[25px] h-[25px] rounded-full"
                alt={platConfig.name}
              />
            </div>

            {isExpand ? (
              PlatItemComp
            ) : (
              <div
                className={cn(
                  'w-full min-w-0 border border-border rounded h-10',
                  'cursor-pointer flex items-center px-4 text-foreground',
                  'hover:border-primary/50 transition-colors',
                )}
                onClick={() => {
                  setExpandedPubItem(pubItem)
                }}
              >
                <p
                  className={cn(
                    'whitespace-nowrap overflow-hidden text-ellipsis',
                    isTextOverflow && 'bg-destructive/10',
                  )}
                >
                  {pubItem.params.des ? (
                    pubItem.params.des
                  ) : (
                    <span className="text-muted-foreground">
                      {t('form.descriptionPlaceholder')}
                      ...
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      )
    },
  ),
)

export default PlatParamsSetting
