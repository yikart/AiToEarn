import type { ForwardedRef } from 'react'
import type {
  IPlatsParamsProps,
  IPlatsParamsRef,
} from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/plats.type'
import type {
  IPlatOption,
  IWxSphEventInfo,
  IWxSphPoiInfo,
} from '@/components/PublishDialog/publishDialog.type'
import { Check, ChevronsUpDown, Loader2, MapPin, Search } from 'lucide-react'
import { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import usePlatParamsCommon from '@/components/PublishDialog/compoents/PlatParamsSetting/hooks/usePlatParamsCoomon'
import PubParmasTextarea from '@/components/PublishDialog/compoents/PubParmasTextarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import CommonTitleInput from '../common/CommonTitleInput'

interface WxSphLocationSearchItem {
  uid: string
  name: string
  longitude: number
  latitude: number
  address?: string
  province?: string
  city?: string
  region?: string
  fullAddress?: string
  poiCheckSum?: string
}

type WxSphOptionPatch = NonNullable<IPlatOption['wxSph']>

function buildWxSphOption(option: IPlatOption, patch: Partial<WxSphOptionPatch>): IPlatOption {
  const wxSphOption = { ...option.wxSph }
  delete wxSphOption.extLink

  return {
    ...option,
    wxSph: {
      ...wxSphOption,
      ...patch,
    },
  }
}

function mapLocationToPoiInfo(item: WxSphLocationSearchItem): IWxSphPoiInfo {
  return {
    latitude: item.latitude,
    longitude: item.longitude,
    poiCity: item.city,
    poiName: item.name,
    poiAddress: item.fullAddress || item.address,
    poiId: item.uid,
    province: item.province,
    region: item.region,
    fullAddress: item.fullAddress,
    poiCheckSum: item.poiCheckSum,
  }
}

function getLocationDescription(poiInfo?: IWxSphPoiInfo) {
  if (!poiInfo)
    return ''
  return poiInfo.fullAddress || poiInfo.poiAddress || poiInfo.poiCity || ''
}

function getLocationTitle(poiInfo?: IWxSphPoiInfo) {
  if (!poiInfo)
    return ''
  return poiInfo.poiName || poiInfo.fullAddress || poiInfo.poiAddress || ''
}

function getSearchErrorCode(error: unknown) {
  if (!error || typeof error !== 'object')
    return undefined

  const candidate = error as { code?: unknown }
  return typeof candidate.code === 'string' ? candidate.code : undefined
}

const WxSphParams = memo(
  forwardRef(
    (
      { pubItem, onImageToImage, isMobile }: IPlatsParamsProps,
      _ref: ForwardedRef<IPlatsParamsRef>,
    ) => {
      const { t } = useTransClient('publish')
      const { pubParmasTextareaCommonParams, setOnePubParams } = usePlatParamsCommon(
        pubItem,
        onImageToImage,
        isMobile,
      )
      const wxSphOption = pubItem.params.option.wxSph ?? {}
      const poiInfo = wxSphOption.poiInfo
      const activity = wxSphOption.activity
      const [locationOpen, setLocationOpen] = useState(false)
      const [locationQuery, setLocationQuery] = useState('')
      const [locationLoading, setLocationLoading] = useState(false)
      const [locationResults, setLocationResults] = useState<WxSphLocationSearchItem[]>([])
      const [locationError, setLocationError] = useState('')
      const locationCacheRef = useRef(new Map<string, WxSphLocationSearchItem[]>())
      const [activityOpen, setActivityOpen] = useState(false)
      const [activityQuery, setActivityQuery] = useState('')
      const [activityLoading, setActivityLoading] = useState(false)
      const [activityResults, setActivityResults] = useState<IWxSphEventInfo[]>([])
      const [activityError, setActivityError] = useState('')
      const activityCacheRef = useRef(new Map<string, IWxSphEventInfo[]>())

      const selectedLocationTitle = useMemo(() => getLocationTitle(poiInfo), [poiInfo])
      const selectedLocationDescription = useMemo(() => getLocationDescription(poiInfo), [poiInfo])

      const updateWxSphOption = useCallback(
        (patch: Partial<WxSphOptionPatch>) => {
          const option = buildWxSphOption(pubItem.params.option, patch)
          setOnePubParams({ option }, pubItem.account.id)
        },
        [pubItem.account.id, pubItem.params.option, setOnePubParams],
      )

      const clearPoiInfo = useCallback(() => {
        updateWxSphOption({ poiInfo: undefined })
        setLocationQuery('')
        setLocationResults([])
        setLocationError('')
      }, [updateWxSphOption])

      const clearActivity = useCallback(() => {
        updateWxSphOption({ activity: undefined })
        setActivityQuery('')
        setActivityResults([])
        setActivityError('')
      }, [updateWxSphOption])

      useEffect(() => {
        if (wxSphOption.extLink !== undefined)
          updateWxSphOption({})
      }, [updateWxSphOption, wxSphOption.extLink])

      useEffect(() => {
        const query = locationQuery.trim()
        if (!locationOpen) {
          setLocationLoading(false)
          return
        }

        if (query.length < 2) {
          setLocationResults([])
          setLocationLoading(false)
          setLocationError('')
          return
        }

        const cachedResults = locationCacheRef.current.get(query)
        if (cachedResults) {
          setLocationResults(cachedResults)
          setLocationLoading(false)
          setLocationError('')
          return
        }

        const plugin = typeof window !== 'undefined' ? window.AIToEarnPlugin : undefined
        const searchLocation = plugin?.wxSphSearchLocation?.bind(plugin)
        if (!searchLocation) {
          setLocationResults([])
          setLocationLoading(false)
          setLocationError(t('wxSph.search.pluginUnavailable'))
          return
        }

        let cancelled = false
        setLocationLoading(true)
        setLocationError('')

        const timer = window.setTimeout(async () => {
          try {
            const results = await searchLocation({ query })
            if (!cancelled) {
              locationCacheRef.current.set(query, results)
              setLocationResults(results)
            }
          }
          catch (error) {
            if (!cancelled) {
              const code = getSearchErrorCode(error)
              setLocationResults([])
              setLocationError(
                code
                  ? `${t('wxSph.location.searchFailed')} (${code})`
                  : t('wxSph.location.searchFailed'),
              )
            }
          }
          finally {
            if (!cancelled)
              setLocationLoading(false)
          }
        }, 350)

        return () => {
          cancelled = true
          window.clearTimeout(timer)
        }
      }, [locationOpen, locationQuery, t])

      useEffect(() => {
        const query = activityQuery.trim()
        if (!activityOpen) {
          setActivityLoading(false)
          return
        }

        if (query.length < 2) {
          setActivityResults([])
          setActivityLoading(false)
          setActivityError('')
          return
        }

        const cachedResults = activityCacheRef.current.get(query)
        if (cachedResults) {
          setActivityResults(cachedResults)
          setActivityLoading(false)
          setActivityError('')
          return
        }

        const plugin = typeof window !== 'undefined' ? window.AIToEarnPlugin : undefined
        const searchActivity = plugin?.wxSphSearchActivity?.bind(plugin)
        if (!searchActivity) {
          setActivityResults([])
          setActivityLoading(false)
          setActivityError(t('wxSph.search.pluginUnavailable'))
          return
        }

        let cancelled = false
        setActivityLoading(true)
        setActivityError('')

        const timer = window.setTimeout(async () => {
          try {
            const results = await searchActivity({ query })
            if (!cancelled) {
              activityCacheRef.current.set(query, results)
              setActivityResults(results)
            }
          }
          catch (error) {
            if (!cancelled) {
              const code = getSearchErrorCode(error)
              setActivityResults([])
              setActivityError(
                code
                  ? `${t('wxSph.activity.searchFailed')} (${code})`
                  : t('wxSph.activity.searchFailed'),
              )
            }
          }
          finally {
            if (!cancelled)
              setActivityLoading(false)
          }
        }, 350)

        return () => {
          cancelled = true
          window.clearTimeout(timer)
        }
      }, [activityOpen, activityQuery, t])

      return (
        <PubParmasTextarea
          {...pubParmasTextareaCommonParams}
          extend={(
            <>
              <CommonTitleInput pubItem={pubItem} isMobile={isMobile} />

              <div className="mt-4 grid grid-cols-[84px_minmax(0,1fr)] items-start gap-3">
                <Label className="pt-2 text-sm font-medium text-foreground">
                  {t('wxSph.location.title')}
                </Label>

                <div className="flex min-w-0 gap-2">
                  <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={locationOpen}
                        className="h-auto min-h-10 w-full justify-between gap-3 rounded-md bg-background px-3 py-2 text-left font-normal"
                      >
                        <span className="flex min-w-0 items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0">
                            <span
                              className={cn(
                                'block truncate text-sm',
                                !selectedLocationTitle && 'text-muted-foreground',
                              )}
                            >
                              {selectedLocationTitle || t('wxSph.location.searchPlaceholder')}
                            </span>
                            {selectedLocationDescription && (
                              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                {selectedLocationDescription}
                              </span>
                            )}
                          </span>
                        </span>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                      align="start"
                      allowInnerScroll
                    >
                      <Command shouldFilter={false}>
                        <CommandInput
                          value={locationQuery}
                          placeholder={t('wxSph.location.searchPlaceholder')}
                          onValueChange={setLocationQuery}
                        />
                        <CommandList>
                          {locationLoading && (
                            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>{t('wxSph.search.loading')}</span>
                            </div>
                          )}
                          <CommandEmpty>
                            {locationQuery.trim().length < 2
                              ? t('wxSph.search.minKeyword')
                              : locationError || t('wxSph.location.empty')}
                          </CommandEmpty>
                          {locationResults.map(item => (
                            <CommandItem
                              key={item.uid}
                              value={`${item.uid}-${item.name}`}
                              className="items-start gap-2 py-2"
                              onSelect={() => {
                                updateWxSphOption({ poiInfo: mapLocationToPoiInfo(item) })
                                locationCacheRef.current.set(item.name, [item])
                                setLocationResults([item])
                                setLocationError('')
                                setLocationOpen(false)
                                setLocationQuery(item.name)
                              }}
                            >
                              <Check
                                className={cn(
                                  'mt-0.5 h-4 w-4 shrink-0',
                                  poiInfo?.poiId === item.uid ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm text-foreground">
                                  {item.name}
                                </span>
                                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                  {item.fullAddress
                                    || item.address
                                    || item.city
                                    || t('wxSph.location.addressEmpty')}
                                </span>
                              </span>
                            </CommandItem>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {poiInfo?.poiId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-10 shrink-0 cursor-pointer px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={clearPoiInfo}
                    >
                      {t('wxSph.location.clear')}
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-[84px_minmax(0,1fr)] items-start gap-3">
                <Label className="pt-2 text-sm font-medium text-foreground">
                  {t('wxSph.activity.title')}
                </Label>

                <div className="flex min-w-0 gap-2">
                  <Popover open={activityOpen} onOpenChange={setActivityOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={activityOpen}
                        className="h-10 w-full justify-between gap-3 rounded-md bg-background px-3 text-left font-normal"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span
                            className={cn(
                              'truncate text-sm',
                              !activity?.eventName && 'text-muted-foreground',
                            )}
                          >
                            {activity?.eventName || t('wxSph.activity.searchPlaceholder')}
                          </span>
                        </span>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                      align="start"
                      allowInnerScroll
                    >
                      <Command shouldFilter={false}>
                        <CommandInput
                          value={activityQuery}
                          placeholder={t('wxSph.activity.searchPlaceholder')}
                          onValueChange={setActivityQuery}
                        />
                        <CommandList>
                          {activityLoading && (
                            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>{t('wxSph.search.loading')}</span>
                            </div>
                          )}
                          <CommandEmpty>
                            {activityQuery.trim().length < 2
                              ? t('wxSph.search.minKeyword')
                              : activityError || t('wxSph.activity.empty')}
                          </CommandEmpty>
                          {activityResults.map(item => (
                            <CommandItem
                              key={item.eventTopicId}
                              value={`${item.eventTopicId}-${item.eventName}`}
                              className="items-start gap-2 py-2"
                              onSelect={() => {
                                updateWxSphOption({ activity: item })
                                activityCacheRef.current.set(item.eventName, [item])
                                setActivityResults([item])
                                setActivityError('')
                                setActivityOpen(false)
                                setActivityQuery(item.eventName)
                              }}
                            >
                              <Check
                                className={cn(
                                  'mt-0.5 h-4 w-4 shrink-0',
                                  activity?.eventTopicId === item.eventTopicId
                                    ? 'opacity-100'
                                    : 'opacity-0',
                                )}
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm text-foreground">
                                  {item.eventName}
                                </span>
                                {item.eventCreatorNickname && (
                                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                    {item.eventCreatorNickname}
                                  </span>
                                )}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {activity?.eventTopicId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-10 shrink-0 cursor-pointer px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={clearActivity}
                    >
                      {t('wxSph.activity.clear')}
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-[84px_minmax(0,1fr)] items-start gap-3">
                <Label className="pt-2 text-sm font-medium text-foreground">
                  {t('wxSph.original.title')}
                </Label>
                <div className="flex min-h-10 items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
                  <Checkbox
                    id={`wx-sph-original-${pubItem.account.id}`}
                    checked={!!wxSphOption.isOriginal}
                    className="h-4 w-4 rounded border-border bg-background text-primary shadow-none data-[state=checked]:border-primary/70 data-[state=checked]:bg-background data-[state=checked]:text-primary"
                    onCheckedChange={checked =>
                      updateWxSphOption({ isOriginal: checked === true })}
                  />
                  <Label
                    htmlFor={`wx-sph-original-${pubItem.account.id}`}
                    className="cursor-pointer text-xs leading-5 text-muted-foreground"
                  >
                    {t('wxSph.original.hint')}
                  </Label>
                </div>
              </div>
            </>
          )}
        />
      )
    },
  ),
)

export default WxSphParams
