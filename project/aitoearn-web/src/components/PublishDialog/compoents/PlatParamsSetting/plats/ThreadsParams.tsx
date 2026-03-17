/**
 * ThreadsParams - Threads 平台参数设置
 */
import type { ForwardedRef } from 'react'
import type { ThreadsLocationItem } from '@/api/plat/threads'
import type {
  IPlatsParamsProps,
  IPlatsParamsRef,
} from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/plats.type'
import { debounce } from 'lodash'
import { Loader2 } from 'lucide-react'
import { forwardRef, memo, useCallback, useEffect, useRef, useState } from 'react'
import { apiGetThreadsLocations } from '@/api/plat/threads'
import { useTransClient } from '@/app/i18n/client'
import usePlatParamsCommon from '@/components/PublishDialog/compoents/PlatParamsSetting/hooks/usePlatParamsCoomon'
import PubParmasTextarea from '@/components/PublishDialog/compoents/PubParmasTextarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const ThreadsParams = memo(
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

      const [locations, setLocations] = useState<ThreadsLocationItem[]>([])
      const [loading, setLoading] = useState(false)
      const [searchKeyword, setSearchKeyword] = useState('')
      const debouncedSearchRef = useRef<ReturnType<typeof debounce> | null>(null)

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
          if (!keyword) {
            return
          }

          try {
            setLoading(true)
            const response: any = await apiGetThreadsLocations(pubItem.account.id, keyword || '')
            console.log('response', response)
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

      // 初始加载位置列表
      useEffect(() => {
        fetchLocations()
      }, [fetchLocations])

      // 处理位置选择
      const handleLocationChange = (locationId: string) => {
        const selectedLocation = locations.find(loc => loc.id === locationId)
        const option = pubItem.params.option

        // 构建 threads 对象，如果没有选择位置则不包含 location_id
        const threadsOption = {
          ...option.threads,
        }

        if (selectedLocation?.id) {
          threadsOption.location_id = selectedLocation.id
        }
        else {
          // 如果没有选择位置，删除 location_id 属性
          delete threadsOption.location_id
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
        if (debouncedSearchRef.current) {
          debouncedSearchRef.current(value)
        }
      }, [])

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
                    {t('form.location' as any)}
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <Input
                      placeholder={t('form.searchLocation' as any) || 'Search location...'}
                      value={searchKeyword}
                      onChange={e => handleSearch(e.target.value)}
                      className="h-8"
                    />
                    <Select
                      value={pubItem.params.option.threads?.location_id ?? ''}
                      onValueChange={handleLocationChange}
                    >
                      <SelectTrigger className="w-full h-8">
                        <SelectValue placeholder={t('form.selectLocation' as any)} />
                      </SelectTrigger>
                      <SelectContent>
                        {loading ? (
                          <div className="flex items-center justify-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : locations.length > 0 ? (
                          locations.map(location => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.label}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="text-center py-2 text-sm text-muted-foreground">
                            {t('form.noLocationsFound' as any) || 'No locations found'}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
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
