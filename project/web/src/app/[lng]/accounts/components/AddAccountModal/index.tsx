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
          toast.warning(t('addAccountModal.platformNotLoggedIn' as any, { platform: platformName }))
          return
        }

        setSyncLoadingPlatform(platform)
        try {
          const result = await syncAccountToDatabase(platform, selectedSpaceId)
          if (result) {
            toast.success(t('addAccountModal.syncSuccess' as any))
            onAddSuccess(result)
            onClose()
          }
          else {
            toast.error(t('addAccountModal.syncFailed' as any))
          }
        }
        catch (error) {
          console.error('同步账号失败:', error)
          toast.error(t('addAccountModal.syncFailed' as any))
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
              title: t('addAccountModal.kwaiAuthWarning.title' as any),
              content: t('addAccountModal.kwaiAuthWarning.content' as any),
              okText: t('addAccountModal.kwaiAuthWarning.okText' as any),
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
            title={t('addAccountModal.title')}
            open={open}
            onOk={handleOk}
            onCancel={handleCancel}
            footer={null}
            width={650}
          >
            <div>
              <h1 className="text-sm mb-[15px]">{t('addAccountModal.subtitle')}</h1>

              {/* 空间选择器 */}
              {spaceSelectionRequired && (
                <div className="mb-5 pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold min-w-[80px]">{t('addAccountModal.addTo')}</span>
                    <Select value={selectedSpaceId} onValueChange={setSelectedSpaceId}>
                      <SelectTrigger className="w-[200px]">
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
                <div className="mb-5 p-3 bg-muted rounded-md border border-border text-xs text-muted-foreground">
                  <span>
                    {t('addAccountModal.currentSpace')}
                    :
                    {' '}
                    {accountGroupList.find(g => g.id === selectedSpaceId)?.name}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-3 overflow-y-auto overflow-x-hidden mb-5">
                <TooltipProvider>
                  {AccountPlatInfoArr.map(([key, value]) => {
                    const isAvailable = isPlatformAvailable(key as PlatType)
                    const isLoading = syncLoadingPlatform === key
                    return (
                      <Tooltip key={key}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            className="p-2 rounded-lg h-[90px] whitespace-normal flex flex-col items-center justify-center hover:bg-accent disabled:opacity-50"
                            disabled={!isAvailable || (spaceSelectionRequired && !selectedSpaceId) || isLoading}
                            onClick={() => handlePlatformClick(key as PlatType, value)}
                          >
                            <div className="flex flex-col items-center gap-2 w-full">
                              <img
                                src={value.icon}
                                className="w-10 h-10"
                                style={{ opacity: isAvailable ? 1 : 0.5 }}
                                alt={value.name}
                              />
                              <span className="text-xs text-center" style={{ opacity: isAvailable ? 1 : 0.5 }}>{value.name}</span>
                            </div>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{value.tips?.account}</p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </TooltipProvider>
              </div>

              {/* 属地限制提示 */}
              {isCnSpace !== null && (
                <div className="mt-4 p-3 bg-muted rounded-md text-xs text-muted-foreground text-center">
                  {isCnSpace
                    ? t('locationRestriction.cnSpace')
                    : t('locationRestriction.nonCnSpace')}
                </div>
              )}

              {/* 空间选择提示 */}
              {spaceSelectionRequired && !selectedSpaceId && (
                <div className="mt-4 p-3 bg-warning/10 rounded-md text-xs text-warning text-center">
                  {t('addAccountModal.pleaseChooseSpaceFirst')}
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
