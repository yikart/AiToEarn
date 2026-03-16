/**
 * FacebookParams - Facebook 平台参数设置
 */
import type { ForwardedRef } from 'react'
import type {
  IPlatsParamsProps,
  IPlatsParamsRef,
} from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/plats.type'
import { forwardRef, memo, useEffect } from 'react'
import { useTransClient } from '@/app/i18n/client'
import usePlatParamsCommon from '@/components/PublishDialog/compoents/PlatParamsSetting/hooks/usePlatParamsCoomon'
import PubParmasTextarea from '@/components/PublishDialog/compoents/PubParmasTextarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

const FacebookParams = memo(
  forwardRef(
    (
      { pubItem, onImageToImage, isMobile }: IPlatsParamsProps,
      ref: ForwardedRef<IPlatsParamsRef>,
    ) => {
      const { t } = useTransClient('publish')
      const { pubParmasTextareaCommonParams, setOnePubParams } = usePlatParamsCommon(
        pubItem,
        onImageToImage,
        isMobile,
      )

      // 初始化Facebook参数
      useEffect(() => {
        const option = pubItem.params.option
        if (!option.facebook?.content_category) {
          setOnePubParams(
            {
              option: {
                ...option,
                facebook: {
                  ...option.facebook,
                  content_category: 'post',
                },
              },
            },
            pubItem.account.id,
          )
        }
      }, [pubItem.account.id, setOnePubParams])

      return (
        <>
          <PubParmasTextarea
            {...pubParmasTextareaCommonParams}
            extend={(
              <>
                <div
                  className={cn('flex mt-2.5', isMobile ? 'flex-col gap-1.5' : 'items-center h-8')}
                >
                  <div
                    className={cn('shrink-0', isMobile ? 'text-sm font-medium' : 'w-[90px] mr-2.5')}
                  >
                    {t('form.type')}
                  </div>
                  <RadioGroup
                    value={pubItem.params.option.facebook?.content_category || 'video'}
                    onValueChange={(value) => {
                      const option = pubItem.params.option
                      setOnePubParams(
                        {
                          option: {
                            ...option,
                            facebook: {
                              ...option.facebook,
                              content_category: value,
                            },
                          },
                        },
                        pubItem.account.id,
                      )
                    }}
                    className={cn('flex gap-4', isMobile ? 'flex-col' : 'items-center')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="post" id="facebook-post" />
                      <Label htmlFor="facebook-post" className="cursor-pointer">
                        Post
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="reel" id="facebook-reel" />
                      <Label htmlFor="facebook-reel" className="cursor-pointer">
                        Reel
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="story" id="facebook-story" />
                      <Label htmlFor="facebook-story" className="cursor-pointer">
                        Story
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}
          />
        </>
      )
    },
  ),
)

export default FacebookParams
