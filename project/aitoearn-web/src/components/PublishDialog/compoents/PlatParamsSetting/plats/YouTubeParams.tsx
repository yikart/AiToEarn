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
import { cn } from '@/utils/className'

const youtubeOptionItemClassName
  = 'flex min-h-9 items-center gap-2 rounded-md px-2 transition-colors hover:bg-accent'
const youtubeCheckboxClassName
  = 'h-4 w-4 rounded border-border bg-background text-primary shadow-none data-[state=checked]:border-primary/70 data-[state=checked]:bg-background data-[state=checked]:text-primary'
const youtubeOptionLabelClassName = 'cursor-pointer text-sm leading-5 text-foreground'

const YouTubeParams = memo(
  forwardRef(
    (
      { pubItem, isMobile }: IPlatsParamsProps,
      ref: ForwardedRef<IPlatsParamsRef>,
    ) => {
      const { t } = useTransClient('publish')
      const { t: tCommon } = useTransClient('common')
      const { pubParmasTextareaCommonParams, setOnePubParams } = usePlatParamsCommon(
        pubItem,
        isMobile,
      )
      const youtubeNotifyId = `youtube-notify-${pubItem.account.id}`
      const youtubeEmbedId = `youtube-embed-${pubItem.account.id}`
      const youtubeKidsId = `youtube-kids-${pubItem.account.id}`
      const { getYouTubeCategories, youTubeCategories, youTubeCategoriesLoading } = usePublishDialogData(
        useShallow(state => ({
          getYouTubeCategories: state.getYouTubeCategories,
          youTubeCategories: state.youTubeCategories,
          youTubeCategoriesLoading: state.youTubeCategoriesLoading,
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
        if (option.youtube.notifySubscribers === undefined) {
          option.youtube.notifySubscribers = true
          needsUpdate = true
        }
        if (option.youtube.embeddable === undefined) {
          option.youtube.embeddable = true
          needsUpdate = true
        }
        if (option.youtube.selfDeclaredMadeForKids === undefined) {
          option.youtube.selfDeclaredMadeForKids = false
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
                      loading={youTubeCategoriesLoading}
                      loadingText={tCommon('actions.loading')}
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
                        <SelectValue placeholder={t('form.selectPrivacyStatus')} />
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
                    {t('form.license')}
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
                      <SelectValue placeholder={t('form.licensePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">
                        {t('form.standardYouTubeLicense')}
                      </SelectItem>
                      <SelectItem value="creativeCommon">
                        {t('form.creativeCommonsLicense')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* YouTube 复选框选项 */}
                <div
                  className={cn(
                    'flex mt-2.5',
                    isMobile ? 'flex-col gap-1.5' : 'items-start',
                  )}
                >
                  <div
                    className={cn(
                      'shrink-0',
                      isMobile ? 'text-sm font-medium' : 'w-[90px] mr-2.5 pt-2',
                    )}
                  >
                    {t('form.youtubeOptions')}
                  </div>

                  <div
                    className={cn(
                      'grid flex-1 gap-2 rounded-md border border-border bg-background p-2',
                      isMobile ? 'grid-cols-1' : 'grid-cols-3',
                    )}
                  >
                    <div className={youtubeOptionItemClassName}>
                      <Checkbox
                        id={youtubeNotifyId}
                        checked={!!pubItem.params.option.youtube?.notifySubscribers}
                        className={youtubeCheckboxClassName}
                        onCheckedChange={(checked) => {
                          const option = pubItem.params.option
                          if (!option.youtube) {
                            option.youtube = {}
                          }
                          option.youtube.notifySubscribers = checked === true
                          setOnePubParams(
                            {
                              option,
                            },
                            pubItem.account.id,
                          )
                        }}
                      />
                      <Label htmlFor={youtubeNotifyId} className={youtubeOptionLabelClassName}>
                        {t('form.notifySubscribers')}
                      </Label>
                    </div>

                    <div className={youtubeOptionItemClassName}>
                      <Checkbox
                        id={youtubeEmbedId}
                        checked={!!pubItem.params.option.youtube?.embeddable}
                        className={youtubeCheckboxClassName}
                        onCheckedChange={(checked) => {
                          const option = pubItem.params.option
                          if (!option.youtube) {
                            option.youtube = {}
                          }
                          option.youtube.embeddable = checked === true
                          setOnePubParams(
                            {
                              option,
                            },
                            pubItem.account.id,
                          )
                        }}
                      />
                      <Label htmlFor={youtubeEmbedId} className={youtubeOptionLabelClassName}>
                        {t('form.allowEmbedding')}
                      </Label>
                    </div>

                    <div className={youtubeOptionItemClassName}>
                      <Checkbox
                        id={youtubeKidsId}
                        checked={!!pubItem.params.option.youtube?.selfDeclaredMadeForKids}
                        className={youtubeCheckboxClassName}
                        onCheckedChange={(checked) => {
                          const option = pubItem.params.option
                          if (!option.youtube) {
                            option.youtube = {}
                          }
                          option.youtube.selfDeclaredMadeForKids = checked === true
                          setOnePubParams(
                            {
                              option,
                            },
                            pubItem.account.id,
                          )
                        }}
                      />
                      <Label htmlFor={youtubeKidsId} className={youtubeOptionLabelClassName}>
                        {t('form.madeForKids')}
                      </Label>
                    </div>
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
