/**
 * TikTokParams - TikTok 平台参数设置
 */
import type { ForwardedRef } from 'react'
import type {
  IPlatsParamsProps,
  IPlatsParamsRef,
} from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/plats.type'
import type { IPlatOption } from '@/components/PublishDialog/publishDialog.type'
import { AlertTriangle } from 'lucide-react'
import { forwardRef, memo, useEffect, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import usePlatParamsCommon from '@/components/PublishDialog/compoents/PlatParamsSetting/hooks/usePlatParamsCoomon'
import PubParmasTextarea from '@/components/PublishDialog/compoents/PubParmasTextarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import http from '@/utils/request'

const DEFAULT_TIKTOK_OPTION = {
  privacy_level: 'PUBLIC_TO_EVERYONE',
  comment_disabled: false,
  duet_disabled: false,
  stitch_disabled: false,
  brand_organic_toggle: false,
  brand_content_toggle: false,
  brand_disclosure_enabled: false,
}

/** 浅拷贝 option 并确保 tiktok 对象存在 */
function ensureTiktokOption(option: IPlatOption): IPlatOption & { tiktok: NonNullable<IPlatOption['tiktok']> } {
  const newOption = { ...option }
  if (!newOption.tiktok) {
    newOption.tiktok = { ...DEFAULT_TIKTOK_OPTION }
  }
  return newOption as IPlatOption & { tiktok: NonNullable<IPlatOption['tiktok']> }
}

// TikTok Creator Info 接口类型
interface TikTokCreatorInfo {
  max_video_post_duration_sec: number
  privacy_level_options: string[]
  stitch_disabled: boolean
  comment_disabled: boolean
  creator_avatar_url: string
  creator_nickname: string
  creator_username: string
  duet_disabled: boolean
}

const TikTokParams = memo(
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

      const [creatorInfo, setCreatorInfo] = useState<TikTokCreatorInfo | null>(null)
      const [loading, setLoading] = useState(false)

      // 获取 TikTok Creator Info
      const fetchCreatorInfo = async () => {
        if (pubItem.account.id.includes('material-fake-tiktok-'))
          return

        try {
          setLoading(true)
          const response = await http.get<TikTokCreatorInfo>(
            `plat/tiktok/creator/info/${pubItem.account.id}`,
          )
          if (response && response.code === 0) {
            setCreatorInfo(response.data as TikTokCreatorInfo)
          }
        }
        catch (error) {
          console.error('Failed to fetch TikTok creator info:', error)
        }
        finally {
          setLoading(false)
        }
      }

      // 初始化 TikTok 参数
      useEffect(() => {
        const option = pubItem.params.option
        if (!option.tiktok) {
          option.tiktok = { ...DEFAULT_TIKTOK_OPTION }
          setOnePubParams({ option }, pubItem.account.id)
        }
        fetchCreatorInfo()
      }, [pubItem.account.id, pubItem.account.account])

      // 隐私级别选项映射
      const getPrivacyLevelLabel = (value: string) => {
        switch (value) {
          case 'PUBLIC_TO_EVERYONE':
            return t('tiktok.privacy.public')
          case 'MUTUAL_FOLLOW_FRIENDS':
            return t('tiktok.privacy.friends')
          case 'SELF_ONLY':
            return t('tiktok.privacy.private')
          default:
            return value
        }
      }

      // 获取合规声明文本和链接
      const getComplianceContent = () => {
        const { brand_organic_toggle, brand_content_toggle } = pubItem.params.option.tiktok || {}

        // 根据选择确定链接
        const linkUrl = brand_content_toggle
          ? 'https://www.tiktok.com/legal/page/global/bc-policy/en'
          : 'https://www.tiktok.com/legal/page/global/music-usage-confirmation/en'

        // 根据选择确定文本
        let text = ''
        if (brand_organic_toggle && brand_content_toggle) {
          text = t('tiktok.compliance.both')
        }
        else if (brand_content_toggle) {
          text = t('tiktok.compliance.branded')
        }
        else if (brand_organic_toggle) {
          text = t('tiktok.compliance.organic')
        }
        else {
          text = t('tiktok.compliance.default')
        }

        // 返回整个文本作为可点击的链接，同时附加简短提示（中/英）
        return (
          <div>
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline cursor-pointer block w-full"
            >
              {text}
            </a>
            <div className="mt-1.5 text-xs text-muted-foreground">
              {t('tiktok.compliance.processNote')}
            </div>
          </div>
        )
      }

      // 判断是否为私密隐私级别
      const isPrivate = pubItem.params.option.tiktok?.privacy_level === 'SELF_ONLY'

      // 判断是否已选择品牌内容
      const hasBrandedContent = pubItem.params.option.tiktok?.brand_content_toggle === true

      // 内容披露警告条件：开启了披露但未选择任何选项
      const showDisclosureWarning
        = pubItem.params.option.tiktok?.brand_disclosure_enabled === true
          && !pubItem.params.option.tiktok?.brand_organic_toggle
          && !pubItem.params.option.tiktok?.brand_content_toggle

      return (
        <>
          <PubParmasTextarea
            {...pubParmasTextareaCommonParams}
            extend={(
              <>
                {/* Creator Info Display */}
                {creatorInfo && (
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
                      {t('tiktok.creatorInfo')}
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded">
                      <img
                        src={creatorInfo.creator_avatar_url}
                        alt="Creator Avatar"
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="font-medium">{creatorInfo.creator_nickname}</span>
                      <span className="text-muted-foreground">
                        (@
                        {creatorInfo.creator_username}
                        )
                      </span>
                    </div>
                  </div>
                )}

                {/* Privacy Level Selection */}
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
                    {t('tiktok.privacy.title')}
                  </div>
                  <div className="flex-1">
                    <Select
                      value={pubItem.params.option.tiktok?.privacy_level ?? ''}
                      onValueChange={(value) => {
                        const option = ensureTiktokOption(pubItem.params.option)
                        option.tiktok.privacy_level = value
                        setOnePubParams({ option }, pubItem.account.id)
                      }}
                    >
                      <SelectTrigger className="w-full h-8">
                        <SelectValue placeholder={t('tiktok.privacy.placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {(creatorInfo?.privacy_level_options || [
                          'PUBLIC_TO_EVERYONE',
                          'MUTUAL_FOLLOW_FRIENDS',
                          'SELF_ONLY',
                        ]).map((level) => {
                          // 当已选择品牌内容时，禁用私密选项
                          const isOptionDisabled = level === 'SELF_ONLY' && hasBrandedContent
                          return (
                            <SelectItem
                              key={level}
                              value={level}
                              disabled={isOptionDisabled}
                              className={isOptionDisabled ? 'opacity-50' : ''}
                            >
                              {getPrivacyLevelLabel(level)}
                              {isOptionDisabled
                                && ` (${t('tiktok.commercial.brandedContentPrivacyRestriction')})`}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Allow users to interact */}
                <div
                  className={cn('flex mt-2.5', isMobile ? 'flex-col gap-1.5' : 'items-center h-8')}
                >
                  <div
                    className={cn('shrink-0', isMobile ? 'text-sm font-medium' : 'w-[90px] mr-2.5')}
                  >
                    {t('tiktok.interactions.title')}
                  </div>
                  <div className={cn('flex gap-4 ml-1', isMobile && 'flex-wrap')}>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tiktok-comment"
                        checked={!pubItem.params.option.tiktok?.comment_disabled}
                        disabled={creatorInfo?.comment_disabled}
                        onCheckedChange={(checked) => {
                          const option = ensureTiktokOption(pubItem.params.option)
                          option.tiktok.comment_disabled = !checked
                          setOnePubParams({ option }, pubItem.account.id)
                        }}
                      />
                      <Label htmlFor="tiktok-comment" className="cursor-pointer text-sm">
                        {t('tiktok.interactions.comment')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tiktok-duet"
                        checked={!pubItem.params.option.tiktok?.duet_disabled}
                        disabled={creatorInfo?.duet_disabled}
                        onCheckedChange={(checked) => {
                          const option = ensureTiktokOption(pubItem.params.option)
                          option.tiktok.duet_disabled = !checked
                          setOnePubParams({ option }, pubItem.account.id)
                        }}
                      />
                      <Label htmlFor="tiktok-duet" className="cursor-pointer text-sm">
                        {t('tiktok.interactions.duet')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tiktok-stitch"
                        checked={!pubItem.params.option.tiktok?.stitch_disabled}
                        disabled={creatorInfo?.stitch_disabled}
                        onCheckedChange={(checked) => {
                          const option = ensureTiktokOption(pubItem.params.option)
                          option.tiktok.stitch_disabled = !checked
                          setOnePubParams({ option }, pubItem.account.id)
                        }}
                      />
                      <Label htmlFor="tiktok-stitch" className="cursor-pointer text-sm">
                        {t('tiktok.interactions.stitch')}
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Commercial Content Disclosure */}
                <div
                  className={cn('flex mt-2.5', isMobile ? 'flex-col gap-1.5' : 'items-center h-8')}
                >
                  <div
                    className={cn('shrink-0', isMobile ? 'text-sm font-medium' : 'w-[90px] mr-2.5')}
                  >
                    {t('tiktok.commercial.title')}
                  </div>
                  <div className="flex items-center gap-2 ml-1">
                    <Switch
                      id="tiktok-disclosure"
                      checked={!!pubItem.params.option.tiktok?.brand_disclosure_enabled}
                      onCheckedChange={(checked) => {
                        const option = ensureTiktokOption(pubItem.params.option)

                        if (!checked) {
                          // 关闭时，隐藏披露并清空所有商业内容选项
                          option.tiktok.brand_disclosure_enabled = false
                          option.tiktok.brand_organic_toggle = false
                          option.tiktok.brand_content_toggle = false
                        }
                        else {
                          // 开启时，仅展示子选项，子选项默认不选中，需要用户手动选择
                          option.tiktok.brand_disclosure_enabled = true
                          option.tiktok.brand_organic_toggle = false
                          option.tiktok.brand_content_toggle = false
                        }
                        setOnePubParams({ option }, pubItem.account.id)
                      }}
                    />
                    <Label htmlFor="tiktok-disclosure" className="text-xs cursor-pointer">
                      {t('tiktok.commercial.toggle')}
                    </Label>
                  </div>
                </div>

                {pubItem.params.option.tiktok?.brand_disclosure_enabled && (
                  <div
                    className={cn(
                      'mt-3 p-3 rounded-lg border border-border bg-muted/30',
                      !isMobile && 'ml-[100px]',
                    )}
                  >
                    {/* 内容披露警告：开启了披露但未选择任何选项 */}
                    {showDisclosureWarning && (
                      <Alert variant="destructive" className="mb-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {t('tiktok.commercial.disclosureWarning')}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* 选项容器 */}
                    <div className="space-y-3">
                      {/* 您的品牌选项 */}
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="tiktok-brand-organic"
                          className="mt-0.5"
                          checked={!!pubItem.params.option.tiktok?.brand_organic_toggle}
                          onCheckedChange={(checked) => {
                            const option = ensureTiktokOption(pubItem.params.option)
                            option.tiktok.brand_organic_toggle = !!checked
                            setOnePubParams({ option }, pubItem.account.id)
                          }}
                        />
                        <div className="flex flex-col gap-0.5">
                          <Label
                            htmlFor="tiktok-brand-organic"
                            className="cursor-pointer text-sm font-medium"
                          >
                            {t('tiktok.commercial.yourBrandTitle')}
                          </Label>
                          <span className="text-xs text-muted-foreground">
                            {t('tiktok.commercial.yourBrandDesc')}
                          </span>
                        </div>
                      </div>

                      {/* 品牌内容选项 - 当隐私为私密时禁用 */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'flex items-start space-x-3',
                                isPrivate && 'opacity-50',
                              )}
                            >
                              <Checkbox
                                id="tiktok-brand-content"
                                className="mt-0.5"
                                checked={!!pubItem.params.option.tiktok?.brand_content_toggle}
                                disabled={isPrivate}
                                onCheckedChange={(checked) => {
                                  const option = ensureTiktokOption(pubItem.params.option)
                                  option.tiktok.brand_content_toggle = !!checked
                                  setOnePubParams({ option }, pubItem.account.id)
                                }}
                              />
                              <div className="flex flex-col gap-0.5">
                                <Label
                                  htmlFor="tiktok-brand-content"
                                  className={cn(
                                    'cursor-pointer text-sm font-medium',
                                    isPrivate && 'cursor-not-allowed',
                                  )}
                                >
                                  {t('tiktok.commercial.brandedContentTitle')}
                                </Label>
                                <span className="text-xs text-muted-foreground">
                                  {t('tiktok.commercial.brandedContentDesc')}
                                </span>
                              </div>
                            </div>
                          </TooltipTrigger>
                          {isPrivate && (
                            <TooltipContent>
                              <p>{t('tiktok.commercial.brandedContentPrivacyRestriction')}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* 合规声明 */}
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="text-xs text-muted-foreground">{getComplianceContent()}</div>
                    </div>
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

export default TikTokParams
