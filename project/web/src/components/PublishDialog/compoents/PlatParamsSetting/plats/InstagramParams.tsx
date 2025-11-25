import type { ForwardedRef } from 'react'
import type {
  IPlatsParamsProps,
  IPlatsParamsRef,
} from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/plats.type'
import { Radio } from 'antd'
import { forwardRef, memo, useEffect } from 'react'

import { useTransClient } from '@/app/i18n/client'
import CommonTitleInput from '@/components/PublishDialog/compoents/PlatParamsSetting/common/CommonTitleInput'
import usePlatParamsCommon from '@/components/PublishDialog/compoents/PlatParamsSetting/hooks/usePlatParamsCoomon'
import PubParmasTextarea from '@/components/PublishDialog/compoents/PubParmasTextarea'
import styles from '../platParamsSetting.module.scss'

const InstagramParams = memo(
  forwardRef(
    ({ pubItem, onImageToImage }: IPlatsParamsProps, ref: ForwardedRef<IPlatsParamsRef>) => {
      const { t } = useTransClient('publish')
      const { pubParmasTextareaCommonParams, setOnePubParams }
        = usePlatParamsCommon(pubItem, onImageToImage)

      // 初始化Instagram参数
      useEffect(() => {
        const option = pubItem.params.option
        console.log('InstagramParams - Current option:', option)
        console.log('InstagramParams - Current instagram:', option.instagram)

        if (!option.instagram || !option.instagram.content_category) {
          console.log('InstagramParams - Setting default instagram option')
          setOnePubParams(
            {
              option: {
                ...option,
                instagram: {
                  ...option.instagram,
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
                  className={styles.commonTitleInput}
                  style={{ marginTop: '10px' }}
                >
                  <div className="platParamsSetting-label">
                    {t('form.type')}
                  </div>
                  <Radio.Group
                    value={
                      pubItem.params.option.instagram?.content_category
                      || 'video'
                    }
                    onChange={(e) => {
                      const option = pubItem.params.option
                      console.log(
                        'InstagramParams - onChange:',
                        e.target.value,
                      )
                      setOnePubParams(
                        {
                          option: {
                            ...option,
                            instagram: {
                              ...option.instagram,
                              content_category: e.target.value,
                            },
                          },
                        },
                        pubItem.account.id,
                      )
                    }}
                  >
                    <Radio value="post">Post</Radio>
                    <Radio value="reel">Reel</Radio>
                    <Radio value="story">Story</Radio>
                  </Radio.Group>
                </div>
              </>
            )}
          />
        </>
      )
    },
  ),
)

export default InstagramParams
