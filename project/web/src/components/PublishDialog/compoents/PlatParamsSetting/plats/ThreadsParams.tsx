import type { ForwardedRef } from 'react'
import type { ThreadsLocationItem } from '@/api/plat/threads'
import type {
  IPlatsParamsProps,
  IPlatsParamsRef,
} from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/plats.type'
import { Input, Select } from 'antd'
import { debounce } from 'lodash'
import { forwardRef, memo, useCallback, useEffect, useRef, useState } from 'react'
import { apiGetThreadsLocations } from '@/api/plat/threads'
import { useTransClient } from '@/app/i18n/client'
import usePlatParamsCommon from '@/components/PublishDialog/compoents/PlatParamsSetting/hooks/usePlatParamsCoomon'
import PubParmasTextarea from '@/components/PublishDialog/compoents/PubParmasTextarea'
// 去掉标题输入
import styles from '../platParamsSetting.module.scss'

const { Search } = Input

const ThreadsParams = memo(
  forwardRef(
    ({ pubItem }: IPlatsParamsProps, ref: ForwardedRef<IPlatsParamsRef>) => {
      const { t } = useTransClient('publish')
      const { pubParmasTextareaCommonParams, setOnePubParams }
        = usePlatParamsCommon(pubItem)

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
                threads: {
                },
              },
            },
            pubItem.account.id,
          )
        }
      }, [pubItem.account.id, setOnePubParams])

      // 获取位置列表
      const fetchLocations = useCallback(async (keyword?: string) => {
        if (!keyword) {
          return
        }

        try {
          setLoading(true)
          const response: any = await apiGetThreadsLocations(
            pubItem.account.id,
            keyword || '',
          )
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
      }, [pubItem.account.id])

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
                  className={styles.commonTitleInput}
                  style={{ marginTop: '10px' }}
                >
                  <div className="platParamsSetting-label">
                    {t('form.location' as any)}
                  </div>
                  <Select
                    placeholder={t('form.selectLocation' as any)}
                    value={pubItem.params.option.threads?.location_id || undefined}
                    onChange={handleLocationChange}
                    loading={loading}
                    style={{ width: '100%' }}
                    showSearch
                    filterOption={false}
                    onSearch={val => handleSearch(val)}
                    options={locations.map(location => ({
                      value: location.id,
                      label: location.label,
                    }))}
                    allowClear
                  />
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
