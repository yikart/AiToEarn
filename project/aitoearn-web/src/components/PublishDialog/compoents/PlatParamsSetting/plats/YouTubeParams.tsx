/**
 * YouTubeParams - YouTube 平台参数设置
 */
import type { ForwardedRef } from 'react'
import type {
  IPlatsParamsProps,
  IPlatsParamsRef,
} from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/plats.type'
import { forwardRef, memo, useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import CommonTitleInput from '@/components/PublishDialog/compoents/PlatParamsSetting/common/CommonTitleInput'
import usePlatParamsCommon from '@/components/PublishDialog/compoents/PlatParamsSetting/hooks/usePlatParamsCoomon'
import PubParmasTextarea from '@/components/PublishDialog/compoents/PubParmasTextarea'
import { usePublishDialogData } from '@/components/PublishDialog/usePublishDialogData'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const YouTubeParams = memo(
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
      const { getYouTubeCategories, youTubeCategories } = usePublishDialogData(
        useShallow(state => ({
          getYouTubeCategories: state.getYouTubeCategories,
          youTubeCategories: state.youTubeCategories,
        })),
      )

      useEffect(() => {
        getYouTubeCategories(pubItem.account.id)
      }, [getYouTubeCategories, pubItem.account.id])

      // 当获取到视频分类列表后，默认选中第一个分类
      useEffect(() => {
        if (youTubeCategories.length > 0 && !pubItem.params.option.youtube?.categoryId) {
          const option = pubItem.params.option
          if (!option.youtube) {
            option.youtube = {}
          }
          option.youtube.categoryId = youTubeCategories[0].id
          setOnePubParams(
            {
              option,
            },
            pubItem.account.id,
          )
        }
      }, [
        youTubeCategories,
        pubItem.params.option.youtube?.categoryId,
        pubItem.account.id,
        setOnePubParams,
      ])

      // 初始化YouTube参数
      useEffect(() => {
        const option = pubItem.params.option
        if (!option.youtube) {
          option.youtube = {}
        }
        let needsUpdate = false

        if (!option.youtube.privacyStatus) {
          option.youtube.privacyStatus = 'public'
          needsUpdate = true
        }
        if (!option.youtube.license) {
          option.youtube.license = 'youtube'
          needsUpdate = true
        }
        if ((option.youtube as any).notifySubscribers === undefined) {
          ;(option.youtube as any).notifySubscribers = true
          needsUpdate = true
        }
        if ((option.youtube as any).embeddable === undefined) {
          ;(option.youtube as any).embeddable = true
          needsUpdate = true
        }
        if ((option.youtube as any).selfDeclaredMadeForKids === undefined) {
          ;(option.youtube as any).selfDeclaredMadeForKids = false
          needsUpdate = true
        }

        if (needsUpdate) {
          setOnePubParams(
            {
              option,
            },
            pubItem.account.id,
          )
        }
      }, [pubItem.account.id, setOnePubParams])

      // 将分类数据转换为 SearchableSelect 选项格式
      const categoryOptions = useMemo(() => {
        return youTubeCategories.map(item => ({
          value: item.id,
          label: item.snippet.title,
        }))
      }, [youTubeCategories])

      return (
        <>
          <PubParmasTextarea
            {...pubParmasTextareaCommonParams}
            extend={(
              <>
                <CommonTitleInput pubItem={pubItem} isMobile={isMobile} />

                <div
                  className={cn(
                    'flex gap-2.5 mt-2.5',
                    isMobile ? 'flex-col' : 'flex-row items-center',
                  )}
                >
                  {/* 分类选择 */}
                  <div
                    className={cn(
                      'flex',
                      isMobile ? 'flex-col gap-1.5' : 'items-center h-8 flex-1',
                    )}
                  >
                    <div
                      className={cn(
                        'shrink-0',
                        isMobile ? 'text-sm font-medium' : 'w-[90px] mr-2.5',
                      )}
                    >
                      {t('form.category')}
                    </div>
                    <SearchableSelect
                      options={categoryOptions}
                      value={pubItem.params.option.youtube?.categoryId ?? ''}
                      onValueChange={(value) => {
                        const option = pubItem.params.option
                        if (!option.youtube) {
                          option.youtube = {}
                        }
                        option.youtube.categoryId = value
                        setOnePubParams(
                          {
                            option,
                          },
                          pubItem.account.id,
                        )
                      }}
                      placeholder={t('form.categoryPlaceholder')}
                      searchPlaceholder={t('form.searchPlaceholder')}
                      emptyText={t('form.noResults')}
                      className="flex-1"
                    />
                  </div>

                  {/* 隐私状态 */}
                  <div
                    className={cn(
                      'flex',
                      isMobile ? 'flex-col gap-1.5' : 'items-center h-8 flex-1',
                    )}
                  >
                    <div
                      className={cn(
                        'shrink-0',
                        isMobile ? 'text-sm font-medium' : 'w-[90px] mr-2.5',
                      )}
                    >
                      {t('form.privacyStatus')}
                    </div>
                    <Select
                      value={pubItem.params.option.youtube?.privacyStatus ?? ''}
                      onValueChange={(value) => {
                        const option = pubItem.params.option
                        if (!option.youtube) {
                          option.youtube = {}
                        }
                        option.youtube.privacyStatus = value
                        setOnePubParams(
                          {
                            option,
                          },
                          pubItem.account.id,
                        )
                      }}
                    >
                      <SelectTrigger className="w-full h-8">
                        <SelectValue placeholder="请选择隐私状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">{t('form.public')}</SelectItem>
                        <SelectItem value="unlisted">{t('form.unlisted')}</SelectItem>
                        <SelectItem value="private">{t('form.private')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 许可证 */}
                <div
                  className={cn('flex mt-2.5', isMobile ? 'flex-col gap-1.5' : 'items-center h-8')}
                >
                  <div
                    className={cn('shrink-0', isMobile ? 'text-sm font-medium' : 'w-[90px] mr-2.5')}
                  >
                    {t('form.license' as any)}
                  </div>
                  <Select
                    value={pubItem.params.option.youtube?.license ?? ''}
                    onValueChange={(value) => {
                      const option = pubItem.params.option
                      if (!option.youtube) {
                        option.youtube = {}
                      }
                      option.youtube.license = value
                      setOnePubParams(
                        {
                          option,
                        },
                        pubItem.account.id,
                      )
                    }}
                  >
                    <SelectTrigger className="w-full h-8">
                      <SelectValue placeholder={t('form.licensePlaceholder' as any)} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">
                        {t('form.standardYouTubeLicense' as any)}
                      </SelectItem>
                      <SelectItem value="creativeCommon">
                        {t('form.creativeCommonsLicense' as any)}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* YouTube 复选框选项 */}
                <div
                  className={cn(
                    'flex mt-5 flex-wrap gap-2',
                    isMobile ? 'flex-col' : 'flex-row items-center justify-between',
                  )}
                >
                  {!isMobile && <div className="w-10" />}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="youtube-notify"
                      checked={!!(pubItem.params.option.youtube as any)?.notifySubscribers}
                      onCheckedChange={(checked) => {
                        const option = pubItem.params.option
                        if (!option.youtube) {
                          option.youtube = {}
                        }
                        ;(option.youtube as any).notifySubscribers = checked
                        setOnePubParams(
                          {
                            option,
                          },
                          pubItem.account.id,
                        )
                      }}
                    />
                    <Label htmlFor="youtube-notify" className="cursor-pointer text-sm">
                      Notify Subscribers
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="youtube-embed"
                      checked={!!(pubItem.params.option.youtube as any)?.embeddable}
                      onCheckedChange={(checked) => {
                        const option = pubItem.params.option
                        if (!option.youtube) {
                          option.youtube = {}
                        }
                        ;(option.youtube as any).embeddable = checked
                        setOnePubParams(
                          {
                            option,
                          },
                          pubItem.account.id,
                        )
                      }}
                    />
                    <Label htmlFor="youtube-embed" className="cursor-pointer text-sm">
                      Allow Embedding
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="youtube-kids"
                      checked={!!(pubItem.params.option.youtube as any)?.selfDeclaredMadeForKids}
                      onCheckedChange={(checked) => {
                        const option = pubItem.params.option
                        if (!option.youtube) {
                          option.youtube = {}
                        }
                        ;(option.youtube as any).selfDeclaredMadeForKids = checked
                        setOnePubParams(
                          {
                            option,
                          },
                          pubItem.account.id,
                        )
                      }}
                    />
                    <Label htmlFor="youtube-kids" className="cursor-pointer text-sm">
                      Made for Kids
                    </Label>
                  </div>
                </div>
              </>
            )}
          />
        </>
      )
    },
  ),
)

export default YouTubeParams
