/**
 * ThreadsParams - Threads 平台参数设置
 */
import type { ForwardedRef } from 'react'
import type { ThreadsLocationItem } from '@/api/platforms/threads.types'
import type {
  IPlatsParamsProps,
  IPlatsParamsRef,
} from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/plats.type'
import { debounce } from 'lodash'
import { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiGetThreadsLocations } from '@/api/platforms/threads.api'
import { useTransClient } from '@/app/i18n/client'
import usePlatParamsCommon from '@/components/PublishDialog/compoents/PlatParamsSetting/hooks/usePlatParamsCoomon'
import PubParmasTextarea from '@/components/PublishDialog/compoents/PubParmasTextarea'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { cn } from '@/utils/className'

const ThreadsParams = memo(
  forwardRef(
    (
      { pubItem, isMobile }: IPlatsParamsProps,
      ref: ForwardedRef<IPlatsParamsRef>,
    ) => {
      const { t } = useTransClient('publish')
      const { pubParmasTextareaCommonParams, setOnePubParams } = usePlatParamsCommon(
        pubItem,
        isMobile,
      )
      const { t: tCommon } = useTransClient('common')

      const [locations, setLocations] = useState<ThreadsLocationItem[]>([])
      const [selectedLocationItem, setSelectedLocationItem] = useState<ThreadsLocationItem | null>(null)
      const [loading, setLoading] = useState(false)
      const [searchKeyword, setSearchKeyword] = useState('')
      const debouncedSearchRef = useRef<ReturnType<typeof debounce> | null>(null)
      const selectedLocationId = pubItem.params.option.threads?.location_id ?? ''

      const locationOptions = useMemo(() => {
        const selectedLocationExists = selectedLocationItem
          ? locations.some(location => location.id === selectedLocationItem.id)
          : true
        const optionLocations = selectedLocationItem && !selectedLocationExists
          ? [selectedLocationItem, ...locations]
          : locations

        return optionLocations.map(location => ({
          value: location.id,
          label: location.label,
          description: location.description,
        }))
      }, [locations, selectedLocationItem])

      // 初始化Threads参数
      useEffect(() => {
        const option = pubItem.params.option
        if (!option.threads) {
          setOnePubParams(
            {
              option: {
                ...option,
                threads: {},
              },
            },
            pubItem.account.id,
          )
        }
      }, [pubItem.account.id, setOnePubParams])

      // 获取位置列表
      const fetchLocations = useCallback(
        async (keyword?: string) => {
          const nextKeyword = keyword?.trim()
          if (!nextKeyword) {
            return
          }

          try {
            setLoading(true)
            const response = await apiGetThreadsLocations(pubItem.account.id, nextKeyword)
            if (response && response.code === 0) {
              setLocations(response.data)
            }
          }
          catch (error) {
            console.error('获取Threads位置列表失败:', error)
          }
          finally {
            setLoading(false)
          }
        },
        [pubItem.account.id],
      )

      // 创建防抖搜索函数
      useEffect(() => {
        debouncedSearchRef.current = debounce((keyword: string) => {
          fetchLocations(keyword)
        }, 500) // 增加防抖延迟到500ms

        // 清理函数
        return () => {
          if (debouncedSearchRef.current) {
            debouncedSearchRef.current.cancel()
          }
        }
      }, [fetchLocations])

      // 处理位置选择
      const handleLocationChange = (locationId: string) => {
        const nextSelectedLocation = locations.find(loc => loc.id === locationId)
          ?? (selectedLocationId === locationId ? selectedLocationItem : null)
        const option = pubItem.params.option

        // 构建 threads 对象，如果没有选择位置则不包含 location_id
        const threadsOption = {
          ...option.threads,
        }

        if (nextSelectedLocation?.id) {
          threadsOption.location_id = nextSelectedLocation.id
          setSelectedLocationItem(nextSelectedLocation)
          setSearchKeyword(nextSelectedLocation.label)
        }
        else {
          // 如果没有选择位置，删除 location_id 属性
          delete threadsOption.location_id
          setSelectedLocationItem(null)
        }

        setOnePubParams(
          {
            option: {
              ...option,
              threads: threadsOption,
            },
          },
          pubItem.account.id,
        )
      }

      // 处理搜索
      const handleSearch = useCallback((value: string) => {
        setSearchKeyword(value)
        if (!value.trim()) {
          debouncedSearchRef.current?.cancel()
          setLocations(selectedLocationItem ? [selectedLocationItem] : [])
          setLoading(false)
          return
        }

        if (debouncedSearchRef.current) {
          debouncedSearchRef.current(value)
        }
      }, [selectedLocationItem])

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
                    {t('form.location')}
                  </div>
                  <div className="flex-1">
                    <SearchableSelect
                      options={locationOptions}
                      value={selectedLocationId}
                      onValueChange={handleLocationChange}
                      placeholder={t('form.searchLocation')}
                      searchPlaceholder={t('form.searchLocation')}
                      emptyText={searchKeyword.trim() ? t('form.noResults') : t('form.searchLocation')}
                      loading={loading}
                      loadingMode="list"
                      loadingText={tCommon('actions.loading')}
                      searchValue={searchKeyword}
                      onSearchChange={handleSearch}
                      shouldFilter={false}
                    />
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

export default ThreadsParams
