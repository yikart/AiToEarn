/**
 * AddAccountModal - 添加账号弹窗
 * 支持添加各平台社交媒体账号
 */

import type { ForwardedRef } from 'react'
import type { SocialAccount } from '@/api/types/account.type'
import type { IpLocationInfo } from '@/utils/ipLocation'
import { toast } from '@/lib/toast'
import { confirm } from '@/lib/confirm'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { forwardRef, memo, useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { kwaiSkip } from '@/app/[lng]/accounts/plat/kwaiLogin'
import { AccountPlatInfoArr, AccountPlatInfoMap, PlatType } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import DownloadAppModal from '@/components/common/DownloadAppModal'
import { useAccountStore } from '@/store/account'
import type { PluginPlatformType } from '@/store/plugin'
import { PLUGIN_SUPPORTED_PLATFORMS, PluginStatus, usePluginStore } from '@/store/plugin'
import { getIpLocation } from '@/utils/ipLocation'
import { bilibiliSkip } from '../../plat/BilibiliLogin'
import { FacebookPagesModal, facebookSkip } from '../../plat/FacebookLogin'
import { instagramSkip } from '../../plat/InstagramLogin'
import { linkedinSkip } from '../../plat/LinkedinLogin'
import { pinterestSkip } from '../../plat/PinterestLogin'
import { threadsSkip } from '../../plat/ThreadsLogin'
import { tiktokSkip } from '../../plat/TiktokLogin'
import { twitterSkip } from '../../plat/TwtterLogin'
import { wxGzhSkip } from '../../plat/WxGzh'
import { youtubeSkip } from '../../plat/YoutubeLogin'

export interface IAddAccountModalRef {}

export interface IAddAccountModalProps {
  open: boolean
  onClose: () => void
  onAddSuccess: (accountInfo: SocialAccount) => void
  // 目标空间ID，用于根据空间属地(CN)过滤可添加平台
  targetGroupId?: string
  // 是否显示空间选择器（当从AccountSidebar的"添加账号"按钮打开时显示）
  showSpaceSelector?: boolean
  // 自动触发平台，用于在打开时直接尝试跳转授权
  autoTriggerPlatform?: PlatType
}

const AddAccountModal = memo(
  forwardRef(
    (
      { open, onClose, onAddSuccess, targetGroupId, showSpaceSelector = false, autoTriggerPlatform }: IAddAccountModalProps,
      ref: ForwardedRef<IAddAccountModalRef>,
    ) => {
      const { t } = useTransClient('account')
      const [showFacebookPagesModal, setShowFacebookPagesModal] = useState(false)
      const { accountGroupList, getAccountList } = useAccountStore(
        useShallow(state => ({
          accountGroupList: state.accountGroupList,
          getAccountList: state.getAccountList,
        })),
      )
      const [downloadVisible, setDownloadVisible] = useState(false)
      const [downloadPlatform, setDownloadPlatform] = useState<string>('')
      const aitoearnDownloadUrl = process.env.NEXT_PUBLIC_AITOEARN_APP_DOWNLOAD_URL || ''

      // 插件相关状态
      const pluginStatus = usePluginStore(state => state.status)
      const platformAccounts = usePluginStore(state => state.platformAccounts)
      const syncAccountToDatabase = usePluginStore(state => state.syncAccountToDatabase)
      const init = usePluginStore(state => state.init)
      const [syncLoadingPlatform, setSyncLoadingPlatform] = useState<PlatType | null>(null)

      // 空间选择相关状态
      const [selectedSpaceId, setSelectedSpaceId] = useState<string | undefined>(targetGroupId)
      const [spaceSelectionRequired, setSpaceSelectionRequired] = useState(false)

      // 判断location是否属于中国（CN）
      const isLocationCN = (location?: string | null): boolean => {
        if (!location)
          return false
        const upper = location.toUpperCase()
        return upper.startsWith('CN') || upper.includes('CHINA') || location.includes('中国')
      }

      // 当前目标空间是否视为中国属地
      const [isCnSpace, setIsCnSpace] = useState<boolean | null>(null)
      const [isLocLoading, setIsLocLoading] = useState(false)

      // 初始化空间选择 - 简化版本
      useEffect(() => {
        if (!open) {
          setSpaceSelectionRequired(false)
          setSelectedSpaceId(undefined)
          return
        }

        if (showSpaceSelector) {
          setSpaceSelectionRequired(true)
          // 默认选择第一个默认空间
          const defaultSpace = accountGroupList.find(group => group.isDefault)
          if (defaultSpace && !selectedSpaceId) {
            setSelectedSpaceId(defaultSpace.id)
          }
        }
        else {
          setSpaceSelectionRequired(false)
          if (targetGroupId) {
            setSelectedSpaceId(targetGroupId)
          }
        }
      }, [open, showSpaceSelector, targetGroupId, accountGroupList, selectedSpaceId])

      useEffect(() => {
        if (!open || !selectedSpaceId) {
          setIsCnSpace(null)
          setIsLocLoading(false)
          return
        }

        const currentSpace = (accountGroupList || []).find((g: any) => g.id === selectedSpaceId)
        if (!currentSpace) {
          setIsCnSpace(null)
          return
        }

        const shouldUseLocal = !currentSpace.proxyIp || currentSpace.proxyIp === ''
        if (!shouldUseLocal && currentSpace.ip && currentSpace.location) {
          setIsCnSpace(isLocationCN(currentSpace.location))
          return
        }

        let cancelled = false
        const fetchLocal = async () => {
          try {
            setIsLocLoading(true)
            const info: IpLocationInfo = await getIpLocation()
            if (!cancelled)
              setIsCnSpace(isLocationCN(info.location))
          }
          catch {
            if (!cancelled)
              setIsCnSpace(null)
          }
          finally {
            if (!cancelled)
              setIsLocLoading(false)
          }
        }
        fetchLocal()

        return () => {
          cancelled = true
        }
      }, [open, selectedSpaceId])

      // 自动触发平台授权
      useEffect(() => {
        if (open && autoTriggerPlatform && selectedSpaceId) {
          // 延迟一下确保弹窗完全打开
          const timer = setTimeout(() => {
            const platformInfo = AccountPlatInfoArr.find(([key]) => key === autoTriggerPlatform)
            if (platformInfo) {
              handlePlatformClick(autoTriggerPlatform, platformInfo[1])
            }
          }, 500)

          return () => clearTimeout(timer)
        }
      }, [open, autoTriggerPlatform, selectedSpaceId])

      // 判断平台是否在当前属地可用
      const isPlatformAvailable = (platType: PlatType): boolean => {
        // TODO: 暂时屏蔽国内平台 @@.@@
        return true
        if (isCnSpace === null)
          return true // 未确定属地时显示所有平台

        const cnOnlyPlatforms = new Set<PlatType>([
          PlatType.Douyin,
          PlatType.KWAI,
          PlatType.WxGzh,
          PlatType.WxSph,
          PlatType.BILIBILI,
        ])

        // 小红书是全球平台，不受IP限制
        if (platType === PlatType.Xhs) {
          return true
        }

        if (isCnSpace === true) {
          // 中国属地：仅国内平台可用
          return cnOnlyPlatforms.has(platType)
        }
        else {
          // 非中国属地：国内平台不可用
          return !cnOnlyPlatforms.has(platType)
        }
      }

      const handleOk = () => {
        onClose()
      }

      const handleCancel = () => {
        onClose()
      }

      // 处理Facebook授权成功后的页面选择
      const handleFacebookAuthSuccess = () => {
        setShowFacebookPagesModal(true)
      }

      // 处理Facebook页面选择成功
      const handleFacebookPagesSuccess = () => {
        setShowFacebookPagesModal(false)
        onClose()
        // 可以在这里添加成功提示或其他逻辑
      }

      /**
       * 检查平台是否为插件支持的平台
       */
      const isPluginSupportedPlatform = (platform: PlatType): platform is PluginPlatformType => {
        return PLUGIN_SUPPORTED_PLATFORMS.includes(platform as PluginPlatformType)
      }

      /**
       * 处理从插件同步账号
       * @param platform 平台类型（必须是插件支持的平台）
       */
      const handlePluginPlatformSync = async (platform: PluginPlatformType) => {
        const platformName = AccountPlatInfoMap.get(platform)?.name || platform

        // 检查插件是否就绪
        if (pluginStatus !== PluginStatus.READY) {
          // 插件未就绪，显示下载弹框（带插件Tab）
          setDownloadPlatform(platformName)
          setDownloadVisible(true)
          return
        }

        // 检查是否有账号
        const account = platformAccounts[platform]
        if (!account) {
          toast.warning(t('addAccountModal.platformNotLoggedIn', { platform: platformName }))
          return
        }

        setSyncLoadingPlatform(platform)
        try {
          const result = await syncAccountToDatabase(platform, selectedSpaceId)
          if (result) {
            toast.success(t('addAccountModal.syncSuccess'))
            onAddSuccess(result)
            onClose()
          }
          else {
            toast.error(t('addAccountModal.syncFailed'))
          }
        }
        catch (error) {
          console.error('同步账号失败:', error)
          toast.error(t('addAccountModal.syncFailed'))
        }
        finally {
          setSyncLoadingPlatform(null)
        }
      }

      // 处理平台点击
      const handlePlatformClick = async (key: PlatType, value: any) => {
        // 如果需要选择空间但未选择，提示用户
        if (spaceSelectionRequired && !selectedSpaceId) {
          return
        }

        // 如果平台在当前属地不可用，则提示
        if (!isPlatformAvailable(key)) {
          return
        }

        // 如果该平台在PC端不可用，则提示下载Aitoearn App
        if (value.pcNoThis) {
          setDownloadPlatform(value.name)
          setDownloadVisible(true)
          return
        }

        // 检查是否为插件支持的平台
        if (isPluginSupportedPlatform(key)) {
          await handlePluginPlatformSync(key)
          return
        }

        // 记录授权前的账号数量，用于后续识别新账号
        const beforeAuthCount = accountGroupList.reduce((total, group) => total + group.children.length, 0)

        switch (key) {
          case PlatType.KWAI:
            // 快手授权前先显示提示
            // 在 onOk 回调中直接执行授权，确保 window.open 在用户交互上下文中
            await confirm({
              title: t('addAccountModal.kwaiAuthWarning.title'),
              content: t('addAccountModal.kwaiAuthWarning.content'),
              okText: t('addAccountModal.kwaiAuthWarning.okText'),
              cancelText: undefined, // 不显示取消按钮
              onOk: () => {
                // 在用户点击"我知道了"时立即执行授权，确保 window.open 在用户交互上下文中
                kwaiSkip(key, selectedSpaceId).catch((error) => {
                  console.error('快手授权失败:', error)
                })
              },
            })
            break
          case PlatType.BILIBILI:
            await bilibiliSkip(key, selectedSpaceId)
            break
          case PlatType.YouTube:
            await youtubeSkip(key, selectedSpaceId)
            break
          case PlatType.Twitter:
            await twitterSkip(key, selectedSpaceId)
            break
          case PlatType.Tiktok:
            await tiktokSkip(key, selectedSpaceId)
            break
          case PlatType.Facebook:
            try {
              await facebookSkip(key, selectedSpaceId)
              // Facebook授权成功后显示页面选择弹窗
              handleFacebookAuthSuccess()
            }
            catch (error) {
              console.error('Facebook授权失败:', error)
            }
            break
          case PlatType.Instagram:
            await instagramSkip(key, selectedSpaceId)
            break
          case PlatType.Threads:
            await threadsSkip(key, selectedSpaceId)
            break
          case PlatType.WxGzh:
            await wxGzhSkip(key, selectedSpaceId)
            break
          case PlatType.Pinterest:
            await pinterestSkip(key, selectedSpaceId)
            break
          case PlatType.LinkedIn:
            await linkedinSkip(key, selectedSpaceId)
            break
        }

        // 授权完成后刷新账号列表
        setTimeout(async () => {
          try {
            await getAccountList()
          }
          catch (error) {
          }
        }, 2000) // 等待3秒让授权完成
      }

      return (
        <>
          <Modal
            title={
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <span className="text-sm sm:text-base md:text-lg font-semibold">{t('addAccountModal.title')}</span>
              </div>
            }
            open={open}
            onOk={handleOk}
            onCancel={handleCancel}
            footer={null}
            width={750}
            className="add-account-responsive-modal"
          >
            <div className="w-full">
              <h1 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4 text-gray-700">
                {t('addAccountModal.subtitle')}
              </h1>

              {/* 空间选择器 */}
              {spaceSelectionRequired && (
                <div className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-border w-full">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <span className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                      {t('addAccountModal.addTo')}
                    </span>
                    <Select value={selectedSpaceId} onValueChange={setSelectedSpaceId}>
                      <SelectTrigger className="w-full sm:w-[220px] border-blue-200 h-9">
                        <SelectValue placeholder={t('pleaseChooseSpace')} />
                      </SelectTrigger>
                      <SelectContent>
                        {accountGroupList.map(g => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* 当前选择的空间信息 */}
              {selectedSpaceId && !spaceSelectionRequired && (
                <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 text-xs sm:text-sm text-gray-600 w-full">
                  <span className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                    <span>{t('addAccountModal.currentSpace')}:</span>
                    <span className="font-semibold text-gray-800">
                      {accountGroupList.find(g => g.id === selectedSpaceId)?.name}
                    </span>
                  </span>
                </div>
              )}

              {/* 平台网格 - 响应式优化 */}
              <div 
                className="
                  w-full grid gap-2 sm:gap-3 mb-3 sm:mb-4
                  overflow-y-auto overflow-x-hidden
                  max-h-[60vh] sm:max-h-[450px]
                  grid-cols-3
                  sm:grid-cols-4
                  md:grid-cols-5
                  lg:grid-cols-6
                  xl:grid-cols-7
                "
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e1 #f1f5f9'
                }}
              >
                <TooltipProvider>
                  {AccountPlatInfoArr.map(([key, value]) => {
                    const isAvailable = isPlatformAvailable(key as PlatType)
                    const isLoading = syncLoadingPlatform === key
                    return (
                      <Tooltip key={key}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            className={`
                              relative rounded-lg sm:rounded-xl whitespace-normal 
                              flex flex-col items-center justify-center
                              bg-gradient-to-br from-white to-gray-50
                              border border-gray-200 sm:border-[1.5px]
                              transition-all duration-300 ease-out
                              hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100/50
                              hover:-translate-y-1 hover:bg-gradient-to-br hover:from-white hover:to-blue-50
                              active:translate-y-0 active:scale-[0.98]
                              disabled:opacity-40 disabled:cursor-not-allowed 
                              disabled:hover:translate-y-0 disabled:hover:shadow-none
                              overflow-hidden group
                              p-2 sm:p-3
                              h-[90px] sm:h-[100px] md:h-[110px]
                              min-w-0 w-full
                              ${!isAvailable || (spaceSelectionRequired && !selectedSpaceId) ? 'grayscale' : ''}
                            `}
                            disabled={!isAvailable || (spaceSelectionRequired && !selectedSpaceId) || isLoading}
                            onClick={() => handlePlatformClick(key as PlatType, value)}
                          >
                            {/* 光泽效果 */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                            
                            <div className="flex flex-col items-center gap-1.5 sm:gap-2 w-full relative z-10">
                              {isLoading ? (
                                <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 border-b-2 border-blue-500" />
                                </div>
                              ) : (
                                <img
                                  src={value.icon}
                                  className={`
                                    w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11
                                    object-contain
                                    transition-all duration-300
                                    group-hover:scale-110 group-hover:rotate-[5deg]
                                    filter drop-shadow-md
                                  `}
                                  alt={value.name}
                                />
                              )}
                              <span 
                                className={`
                                  text-[11px] sm:text-xs text-center font-medium 
                                  leading-tight transition-all duration-300
                                  group-hover:text-blue-600 group-hover:font-semibold
                                  ${isAvailable ? 'text-gray-700' : 'text-gray-400'}
                                  line-clamp-2 w-full
                                `}
                              >
                                {value.name}
                              </span>
                            </div>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[200px] text-xs">
                          <p>{value.tips?.account}</p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </TooltipProvider>
              </div>

              {/* 属地限制提示 */}
              {isCnSpace !== null && (
                <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg text-amber-700 text-center border border-amber-200 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap w-full">
                  <span className="text-sm flex-shrink-0">ℹ️</span>
                  <span className="text-[11px] sm:text-xs leading-tight">
                    {isCnSpace
                      ? t('locationRestriction.cnSpace')
                      : t('locationRestriction.nonCnSpace')}
                  </span>
                </div>
              )}

              {/* 空间选择提示 */}
              {spaceSelectionRequired && !selectedSpaceId && (
                <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg text-amber-600 text-center border border-yellow-200 flex items-center justify-center gap-1.5 sm:gap-2 animate-pulse flex-wrap w-full">
                  <span className="text-sm flex-shrink-0">⚠️</span>
                  <span className="font-medium text-[11px] sm:text-xs leading-tight">
                    {t('addAccountModal.pleaseChooseSpaceFirst')}
                  </span>
                </div>
              )}
            </div>
          </Modal>

          {/* Facebook页面选择弹窗 */}
          <FacebookPagesModal
            open={showFacebookPagesModal}
            onClose={() => setShowFacebookPagesModal(false)}
            onSuccess={handleFacebookPagesSuccess}
          />

          {/* 下载Aitoearn App提示弹窗 */}
          <DownloadAppModal
            visible={downloadVisible}
            onClose={() => setDownloadVisible(false)}
            platform={downloadPlatform}
            appName="Aitoearn App"
            downloadUrl={aitoearnDownloadUrl}
            // 如果是插件支持的平台且插件未就绪，显示插件Tab
            showPluginTab={pluginStatus !== PluginStatus.READY}
            defaultTab="plugin"
            pluginStatus={
              pluginStatus === PluginStatus.INSTALLED_NO_PERMISSION
                ? 'no_permission'
                : pluginStatus === PluginStatus.NOT_INSTALLED || pluginStatus === PluginStatus.UNKNOWN
                  ? 'not_installed'
                  : 'ready'
            }
            onCheckPermission={() => init()}
          />
        </>
      )
    },
  ),
)
AddAccountModal.displayName = 'AddAccountModal'

export default AddAccountModal
