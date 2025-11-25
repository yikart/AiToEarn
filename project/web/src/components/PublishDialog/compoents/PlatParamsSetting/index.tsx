import type { CSSProperties, ForwardedRef } from 'react'
import type { IImgFile, PubItem } from '@/components/PublishDialog/publishDialog.type'
import { forwardRef, memo, useEffect, useMemo } from 'react'

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
import styles from './platParamsSetting.module.scss'

export interface IPlatParamsSettingRef {}

export interface IPlatParamsSettingProps {
  pubItem: PubItem
  style?: CSSProperties
  onImageToImage?: (imageFile: IImgFile) => void
}

const PlatParamsSetting = memo(
  forwardRef(
    (
      { pubItem, style, onImageToImage }: IPlatParamsSettingProps,
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
            return <KwaiParams pubItem={pubItem} onImageToImage={onImageToImage} />
          case PlatType.BILIBILI:
            return <BilibParams pubItem={pubItem} onImageToImage={onImageToImage} />
          case PlatType.WxGzh:
            return <WxGzhParams pubItem={pubItem} onImageToImage={onImageToImage} />
          case PlatType.Facebook:
            return <FacebookParams pubItem={pubItem} onImageToImage={onImageToImage} />
          case PlatType.Instagram:
            return <InstagramParams pubItem={pubItem} onImageToImage={onImageToImage} />
          case PlatType.YouTube:
            return <YouTubeParams pubItem={pubItem} onImageToImage={onImageToImage} />
          case PlatType.Pinterest:
            return <PinterestParams pubItem={pubItem} onImageToImage={onImageToImage} />
          case PlatType.Tiktok:
            return <TikTokParams pubItem={pubItem} onImageToImage={onImageToImage} />
          case PlatType.Threads:
            return <ThreadsParams pubItem={pubItem} onImageToImage={onImageToImage} />
          default:
            return <KwaiParams pubItem={pubItem} onImageToImage={onImageToImage} />
        }
      }, [pubItem, onImageToImage])

      useEffect(() => {
        console.log(pubItem, 1111)
      }, [pubItem])

      // true=展开当前账号的参数设置 false=不展开
      const isExpand = useMemo(() => {
        if (step === 0)
          return true
        return expandedPubItem?.account.id === pubItem.account.id
      }, [expandedPubItem, pubItem])

      return (
        <div
          className={[
            styles.platParamsSetting,
            !isExpand ? styles.platParamsSetting_expand : '',
          ].join(' ')}
          onClick={e => e.stopPropagation()}
          style={style}
        >
          <div className="platParamsSetting-wrapper">
            <div className="platParamsSetting-icon">
              <img src={platConfig.icon} style={{ borderRadius: '50%' }} />
            </div>
            {isExpand
              ? (
                  PlatItemComp
                )
              : (
                  <div
                    className="platParamsSetting-des"
                    onClick={() => {
                      setExpandedPubItem(pubItem)
                    }}
                  >
                    <p
                      className={
                        platConfig.commonPubParamsConfig.desMax
                        < pubItem.params.des.length
                          ? 'platParamsSetting-textOverflow'
                          : ''
                      }
                    >
                      {pubItem.params.des
                        ? (
                            pubItem.params.des
                          )
                        : (
                            <span style={{ color: 'var(--grayColor7)' }}>
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
