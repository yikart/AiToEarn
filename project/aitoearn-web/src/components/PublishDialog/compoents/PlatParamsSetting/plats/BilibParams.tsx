/**
 * BilibParams - B站平台参数设置
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { cn } from '@/lib/utils'

const BilibParams = memo(
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
      const { getBilibiliPartitions, bilibiliPartitions } = usePublishDialogData(
        useShallow(state => ({
          getBilibiliPartitions: state.getBilibiliPartitions,
          bilibiliPartitions: state.bilibiliPartitions,
        })),
      )

      useEffect(() => {
        getBilibiliPartitions()
      }, [getBilibiliPartitions])

      // 初始化Bilibili参数
      useEffect(() => {
        const option = pubItem.params.option
        if (!option.bilibili) {
          option.bilibili = {}
        }
        if (!option.bilibili.copyright) {
          option.bilibili.copyright = 1
          setOnePubParams(
            {
              option,
            },
            pubItem.account.id,
          )
        }
      }, [pubItem.account.id, setOnePubParams])

      // 将分区数据转换为 SearchableSelect 选项格式
      const partitionOptions = useMemo(() => {
        if (!bilibiliPartitions || !Array.isArray(bilibiliPartitions)) {
          return []
        }
        return bilibiliPartitions.map((partition: any) => ({
          value: partition.id.toString(),
          label: partition.name,
        }))
      }, [bilibiliPartitions])

      return (
        <>
          <PubParmasTextarea
            {...pubParmasTextareaCommonParams}
            extend={(
              <>
                <CommonTitleInput pubItem={pubItem} isMobile={isMobile} />

                {/* 分区选择 */}
                <div
                  className={cn('flex mt-2.5', isMobile ? 'flex-col gap-1.5' : 'items-center h-8')}
                >
                  <div
                    className={cn('shrink-0', isMobile ? 'text-sm font-medium' : 'w-[90px] mr-2.5')}
                  >
                    {t('form.partition')}
                  </div>
                  <SearchableSelect
                    options={partitionOptions}
                    value={pubItem.params.option.bilibili?.tid?.toString() ?? ''}
                    onValueChange={(value) => {
                      const option = pubItem.params.option
                      option.bilibili!.tid = Number(value)
                      setOnePubParams(
                        {
                          option,
                        },
                        pubItem.account.id,
                      )
                    }}
                    placeholder={t('form.partitionPlaceholder')}
                    searchPlaceholder={t('form.searchPlaceholder')}
                    emptyText={t('form.noResults')}
                    className="flex-1"
                  />
                </div>

                {/* 类型选择 */}
                <div
                  className={cn('flex mt-2.5', isMobile ? 'flex-col gap-1.5' : 'items-center h-8')}
                >
                  <div
                    className={cn('shrink-0', isMobile ? 'text-sm font-medium' : 'w-[90px] mr-2.5')}
                  >
                    {t('form.type')}
                  </div>
                  <RadioGroup
                    value={pubItem.params.option.bilibili?.copyright?.toString() ?? ''}
                    onValueChange={(value) => {
                      const option = pubItem.params.option
                      const numValue = Number(value)
                      option.bilibili!.copyright = numValue
                      if (numValue === 1) {
                        option.bilibili!.source = ''
                      }
                      setOnePubParams(
                        {
                          option,
                        },
                        pubItem.account.id,
                      )
                    }}
                    className={cn('flex gap-4', isMobile ? 'flex-col' : 'items-center')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1" id="bilibili-original" />
                      <Label htmlFor="bilibili-original" className="cursor-pointer">
                        {t('form.original')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="2" id="bilibili-reprint" />
                      <Label htmlFor="bilibili-reprint" className="cursor-pointer">
                        {t('form.reprint')}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* 来源输入（仅转载时显示） */}
                {pubItem.params.option.bilibili?.copyright === 2 && (
                  <div
                    className={cn(
                      'flex mt-2.5',
                      isMobile ? 'flex-col gap-1.5' : 'items-center h-8',
                    )}
                  >
                    <div
                      className={cn(
                        'shrink-0',
                        isMobile ? 'text-sm font-medium' : 'w-[90px] mr-2.5',
                      )}
                    >
                      {t('form.source')}
                    </div>
                    <Input
                      placeholder={t('form.sourcePlaceholder')}
                      value={pubItem.params.option.bilibili?.source || ''}
                      onChange={(e) => {
                        const option = pubItem.params.option
                        option.bilibili!.source = e.target.value
                        setOnePubParams(
                          {
                            option,
                          },
                          pubItem.account.id,
                        )
                      }}
                    />
                  </div>
                )}
              </>
            )}
          />
        </>
      )
    },
  ),
)

export default BilibParams
