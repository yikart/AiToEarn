'use client'

import type { SocialAccount } from '@/api/types/account.type'
import { ClientType } from '@/app/[lng]/accounts/accounts.enums'
import {
  CheckCircleOutlined,
  DeleteOutlined,
  DownOutlined,
  PlusOutlined,
  UpOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { Avatar, Button as AntButton, Modal, Popover, Skeleton, Tooltip } from 'antd'
import { toast } from '@/lib/toast'
import Image from 'next/image'
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useShallow } from 'zustand/react/shallow'
import { createAccountGroupApi, updateAccountApi } from '@/api/account'
import { apiUpdateAccountGroupSortRank, apiUpdateAccountSortRank } from '@/api/accountSort'
import { bilibiliSkip } from '@/app/[lng]/accounts/plat/BilibiliLogin'
import { FacebookPagesModal, facebookSkip } from '@/app/[lng]/accounts/plat/FacebookLogin'
import { instagramSkip } from '@/app/[lng]/accounts/plat/InstagramLogin'
import { kwaiSkip } from '@/app/[lng]/accounts/plat/kwaiLogin'
import { linkedinSkip } from '@/app/[lng]/accounts/plat/LinkedinLogin'
import { pinterestSkip } from '@/app/[lng]/accounts/plat/PinterestLogin'
import { threadsSkip } from '@/app/[lng]/accounts/plat/ThreadsLogin'
import { tiktokSkip } from '@/app/[lng]/accounts/plat/TiktokLogin'
import { twitterSkip } from '@/app/[lng]/accounts/plat/TwtterLogin'
import { wxGzhSkip } from '@/app/[lng]/accounts/plat/WxGzh'
import { youtubeSkip } from '@/app/[lng]/accounts/plat/YoutubeLogin'
import { AccountStatus } from '@/app/config/accountConfig'
import { AccountPlatInfoMap, PlatType } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import DownloadAppModal from '@/components/common/DownloadAppModal'
import { useAccountStore } from '@/store/account'
import {
  extractCountry,
  formatLocationInfo,
  getIpLocation,
} from '@/utils/ipLocation'
import type { IpLocationInfo } from '@/utils/ipLocation'
import { getOssUrl } from '@/utils/oss'
import AddAccountModal from '../AddAccountModal'
import DeleteUserConfirmModal from '../AccountSidebar/DeleteUserConfirmModal'
import MCPManagerModal from '../AccountSidebar/MCPManagerModal'
import type { IMCPManagerModalRef } from '../AccountSidebar/MCPManagerModal'
import UserManageModal from '../AccountSidebar/UserManageModal'
import type { IUserManageModalRef } from '../AccountSidebar/UserManageModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface IAccountTopBarRef {}

export interface IAccountTopBarProps {
  activeAccountId: string
  onAccountChange: (info: SocialAccount) => void
  excludePlatforms?: PlatType[]
  topExtra?: React.ReactNode
  isInteractivePage?: boolean
}

function AccountStatusView({ account }: { account: SocialAccount }) {
  const { t } = useTransClient('account')
  if (account.status === AccountStatus.USABLE) {
    return (
      <span className="flex items-center gap-1 text-success">
        <CheckCircleOutlined />
        {t('online')}
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1 text-warning">
      <WarningOutlined />
      {t('offline')}
    </span>
  )
}

function AccountPopoverInfo({
  accountInfo,
  onDeleteClick,
}: {
  accountInfo: SocialAccount
  onDeleteClick?: (account: SocialAccount) => void
}) {
  const { t } = useTransClient('account')
  const platInfo = AccountPlatInfoMap.get(accountInfo.type)!

  const getClientTypeLabel = (clientType?: ClientType) => {
    if (!clientType) return null
    if (clientType === ClientType.WEB) {
      return t('clientType.web' as any)
    }
    if (clientType === ClientType.APP) {
      return t('clientType.app' as any)
    }
    return null
  }

  return (
    <div
      className="p-4 space-y-3 min-w-[280px]"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex gap-3">
        <Avatar src={getOssUrl(accountInfo.avatar)} size="large" />
        <div className="flex-1 space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground">{t('nickname')}:</span>
            <span className="font-medium">{accountInfo.nickname}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground">{t('fansCount')}:</span>
            <span className="font-medium">{accountInfo.fansCount ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t('loginStatus')}:</span>
          <AccountStatusView account={accountInfo} />
        </div>
        <AntButton
          type="primary"
          danger
          ghost
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => onDeleteClick?.(accountInfo)}
        >
          {t('deleteAccount' as any)}
        </AntButton>
      </div>

      {accountInfo.clientType && (
        <div className="flex gap-2 text-sm">
          <span className="text-muted-foreground">{t('clientType.label' as any)}:</span>
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
            {getClientTypeLabel(accountInfo.clientType)}
          </span>
        </div>
      )}
    </div>
  )
}

const AccountTopBar = memo(
  forwardRef<IAccountTopBarRef, IAccountTopBarProps>(
    (
      {
        activeAccountId,
        onAccountChange,
        excludePlatforms = [],
        topExtra,
        isInteractivePage = false,
      },
      ref,
    ) => {
      const { t } = useTransClient('account')
      const {
        accountList: fullAccountList,
        getAccountList,
        getAccountGroup,
        accountGroupList,
        accountLoading,
      } = useAccountStore(
        useShallow(state => ({
          accountList: state.accountList,
          getAccountList: state.getAccountList,
          getAccountGroup: state.getAccountGroup,
          accountGroupList: state.accountGroupList,
          accountLoading: state.accountLoading,
        })),
      )

      const [userManageModalOpen, setUserManageModalOpen] = useState(false)
      const userManageModalRef = useRef<IUserManageModalRef>(null)
      const [mcpManagerModalOpen, setMcpManagerModalOpen] = useState(false)
      const mcpManagerModalRef = useRef<IMCPManagerModalRef>(null)
      const [deleteHitOpen, setDeleteHitOpen] = useState(false)
      const [deleteTarget, setDeleteTarget] = useState<SocialAccount | null>(null)

      const [ipLocationInfo, setIpLocationInfo] = useState<IpLocationInfo | null>(null)
      const [ipLocationLoading, setIpLocationLoading] = useState(false)

      const [openCreateGroup, setOpenCreateGroup] = useState(false)
      const [groupName, setGroupName] = useState('')
      const [createGroupLoading, setCreateGroupLoading] = useState(false)

      const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)
      const preAccountIds = useRef<Set<string>>(new Set())
      const pendingGroupIdRef = useRef<string | null>(null)
      const isAssigningRef = useRef(false)
      const snapshotReadyRef = useRef(false)

      const [showReauthConfirm, setShowReauthConfirm] = useState(false)
      const [reauthAccount, setReauthAccount] = useState<SocialAccount | null>(null)

      const [showFacebookPagesModal, setShowFacebookPagesModal] = useState(false)

      const [showAppDownloadModal, setShowAppDownloadModal] = useState(false)
      const [mobileOnlyPlatform, setMobileOnlyPlatform] = useState<string>('')

      // 当前选中的空间ID
      const [activeSpaceId, setActiveSpaceId] = useState<string>('')

      const accountList = useMemo(() => {
        if (isInteractivePage) {
          const allowedPlatforms = [
            PlatType.Facebook,
            PlatType.Instagram,
            PlatType.Threads,
            PlatType.Douyin,
            PlatType.Xhs,
          ]
          return fullAccountList.filter(
            account => !excludePlatforms.includes(account.type) && allowedPlatforms.includes(account.type),
          )
        }
        else {
          return fullAccountList.filter(
            account => !excludePlatforms.includes(account.type),
          )
        }
      }, [fullAccountList, excludePlatforms, isInteractivePage])

      const defaultActiveKey = useMemo(() => {
        return accountGroupList.find(v => v.isDefault)?.id
      }, [accountGroupList])

      // 初始化选中默认空间
      useEffect(() => {
        if (defaultActiveKey && !activeSpaceId) {
          setActiveSpaceId(defaultActiveKey)
        }
      }, [defaultActiveKey, activeSpaceId])

      useEffect(() => {
        const fetchIpLocation = async () => {
          try {
            setIpLocationLoading(true)
            const info = await getIpLocation()
            setIpLocationInfo(info)
          }
          catch (error) {
            console.error(t('messages.ipLocationError' as any), error)
          }
          finally {
            setIpLocationLoading(false)
          }
        }

        fetchIpLocation()
      }, [])

      const handleOfflineAccountClick = useCallback((account: SocialAccount) => {
        setReauthAccount(account)
        setShowReauthConfirm(true)
      }, [])

      const handleConfirmReauth = useCallback(async () => {
        if (!reauthAccount)
          return

        const platform = reauthAccount.type
        const targetSpaceId = reauthAccount.groupId

        setShowReauthConfirm(false)

        try {
          switch (platform) {
            case PlatType.KWAI:
              await kwaiSkip(platform, targetSpaceId)
              break
            case PlatType.BILIBILI:
              await bilibiliSkip(platform, targetSpaceId)
              break
            case PlatType.YouTube:
              await youtubeSkip(platform, targetSpaceId)
              break
            case PlatType.Twitter:
              await twitterSkip(platform, targetSpaceId)
              break
            case PlatType.Tiktok:
              await tiktokSkip(platform, targetSpaceId)
              break
            case PlatType.Facebook:
              try {
                await facebookSkip(platform, targetSpaceId)
                setShowFacebookPagesModal(true)
              }
              catch (error) {
                console.error(t('messages.facebookAuthFailed' as any), error)
              }
              break
            case PlatType.Instagram:
              await instagramSkip(platform, targetSpaceId)
              break
            case PlatType.Threads:
              await threadsSkip(platform, targetSpaceId)
              break
            case PlatType.WxGzh:
              await wxGzhSkip(platform, targetSpaceId)
              break
            case PlatType.Pinterest:
              await pinterestSkip(platform, targetSpaceId)
              break
            case PlatType.LinkedIn:
              await linkedinSkip(platform, targetSpaceId)
              break
            default:
              console.warn(`${t('messages.unsupportedPlatform' as any)}: ${platform}`)
              toast.warning(t('messages.platformNotSupported' as any, { platform }))
              return
          }

          setTimeout(async () => {
            try {
              await getAccountList()
              console.log(t('messages.accountListRefreshed' as any))
            }
            catch (error) {
              console.error(t('messages.refreshAccountListFailed' as any), error)
            }
          }, 3000)
        }
        catch (error) {
          console.error(t('messages.authFailed' as any), error)
          toast.error(`${t('messages.authFailed' as any)}，${t('messages.pleaseRetry' as any)}`)
        }
        finally {
          setReauthAccount(null)
        }
      }, [reauthAccount, getAccountList, t])

      const handleFacebookPagesSuccess = () => {
        setShowFacebookPagesModal(false)
      }

      const handleGroupSort = async (groupId: string, direction: 'up' | 'down') => {
        const sortedGroups = [...accountGroupList].sort((a, b) => (a.rank || 0) - (b.rank || 0))
        const currentIndex = sortedGroups.findIndex(g => g.id === groupId)

        if (currentIndex === -1)
          return

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
        if (newIndex < 0 || newIndex >= sortedGroups.length)
          return;

        [sortedGroups[currentIndex], sortedGroups[newIndex]] = [sortedGroups[newIndex], sortedGroups[currentIndex]]

        const updateList = sortedGroups.map((group, index) => ({
          id: group.id,
          rank: index,
        }))

        try {
          await apiUpdateAccountGroupSortRank({ list: updateList })
          await getAccountGroup()
          toast.success(t('messages.sortSuccess' as any))
        }
        catch (error) {
          toast.error(t('messages.sortFailed' as any))
        }
      }

      const createGroupCancel = () => {
        setOpenCreateGroup(false)
        setGroupName('')
      }

      const openAddAccountFlow = async () => {
        if (accountGroupList.length === 0) {
          toast.error(t('messages.createSpaceFirst' as any))
          return
        }

        if ((useAccountStore.getState().accountList || []).length === 0) {
          await getAccountList()
        }
        preAccountIds.current = new Set(
          (useAccountStore.getState().accountList || []).map(v => v.id),
        )
        snapshotReadyRef.current = true
        setIsAddAccountOpen(true)
      }

      useEffect(() => {
        const handleOpenAddAccount = async () => {
          const latestAccountGroupList = useAccountStore.getState().accountGroupList

          if (latestAccountGroupList.length === 0) {
            toast.error(t('messages.createSpaceFirst' as any))
            return
          }

          if ((useAccountStore.getState().accountList || []).length === 0) {
            await getAccountList()
          }
          preAccountIds.current = new Set(
            (useAccountStore.getState().accountList || []).map(v => v.id),
          )
          snapshotReadyRef.current = true
          setIsAddAccountOpen(true)
        }

        window.addEventListener('openAddAccountFlow', handleOpenAddAccount as EventListener)

        return () => {
          window.removeEventListener('openAddAccountFlow', handleOpenAddAccount as EventListener)
        }
      }, [])

      useEffect(() => {
        const maybeAssign = async () => {
          if (!pendingGroupIdRef.current)
            return
          if (isAssigningRef.current)
            return
          if (!snapshotReadyRef.current)
            return
          const currList = fullAccountList || []
          const newAccounts = currList.filter(
            a => !preAccountIds.current.has(a.id),
          )
          if (newAccounts.length === 0)
            return
          isAssigningRef.current = true
          try {
            const targetGroupId = pendingGroupIdRef.current!
            for (const acc of newAccounts) {
              try {
                await updateAccountApi({ id: acc.id, groupId: targetGroupId })
              }
              catch {}
            }
            await getAccountList()
            toast.success(t('accountAddedToSpace'))
          }
          finally {
            pendingGroupIdRef.current = null
            preAccountIds.current = new Set()
            isAssigningRef.current = false
            snapshotReadyRef.current = false
          }
        }
        maybeAssign()
      }, [fullAccountList])

      // 获取当前空间的账号
      const currentSpaceAccounts = useMemo(() => {
        const space = accountGroupList.find(g => g.id === activeSpaceId)
        if (!space) return []

        const accounts = isInteractivePage
          ? accountList.filter(account => account.groupId === space.id)
          : space.children || []

        return accounts.sort((a, b) => (a.rank || 0) - (b.rank || 0))
      }, [activeSpaceId, accountGroupList, accountList, isInteractivePage])

      return (
        <>
          <UserManageModal
            ref={userManageModalRef}
            open={userManageModalOpen}
            onCancel={() => setUserManageModalOpen(false)}
          />
          <MCPManagerModal
            ref={mcpManagerModalRef}
            open={mcpManagerModalOpen}
            onClose={setMcpManagerModalOpen}
          />

          <AddAccountModal
            open={isAddAccountOpen}
            onClose={async () => {
              setIsAddAccountOpen(false)
            }}
            onAddSuccess={async (acc) => {
              try {
                if (pendingGroupIdRef.current) {
                  await updateAccountApi({
                    id: acc.id,
                    groupId: pendingGroupIdRef.current,
                  })
                  toast.success(t('accountAddedToSpace'))
                }
              }
              finally {
                pendingGroupIdRef.current = null
                await getAccountList()
              }
            }}
            showSpaceSelector={true}
          />

          <Modal
            open={openCreateGroup}
            title={t('createSpace.title')}
            onCancel={createGroupCancel}
            footer={(
              <>
                <AntButton onClick={createGroupCancel}>
                  {t('createSpace.cancel')}
                </AntButton>
                <AntButton
                  type="primary"
                  onClick={async () => {
                    if (!groupName.trim()) {
                      toast.error(t('createSpace.nameRequired'))
                      return
                    }
                    setCreateGroupLoading(true)
                    try {
                      await createAccountGroupApi({
                        name: groupName.trim(),
                      })
                      await getAccountGroup()
                      createGroupCancel()
                    }
                    catch (error) {
                      toast.error(t('createSpace.failed'))
                    }
                    finally {
                      setCreateGroupLoading(false)
                    }
                  }}
                  loading={createGroupLoading}
                >
                  {t('createSpace.save')}
                </AntButton>
              </>
            )}
          >
            <div className="space-y-4">
              <label className="text-sm font-medium">{t('createSpace.name')}</label>
              <Input
                value={groupName}
                placeholder={t('createSpace.namePlaceholder')}
                onChange={e => setGroupName(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    if (!groupName.trim()) {
                      toast.error(t('createSpace.nameRequired'))
                      return
                    }
                    setCreateGroupLoading(true)
                    try {
                      await createAccountGroupApi({
                        name: groupName.trim(),
                      })
                      await getAccountGroup()
                      toast.success(t('createSpace.success'))
                      createGroupCancel()
                    }
                    catch (error) {
                      toast.error(t('createSpace.failed'))
                    }
                    finally {
                      setCreateGroupLoading(false)
                    }
                  }
                }}
              />
            </div>
          </Modal>

          {/* 顶部导航栏 */}
          <div className="flex flex-col border-b bg-background">
            {/* 第一行：空间标签页 + 操作按钮 */}
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              {/* 空间标签页 */}
              <div className="flex-1 min-w-0">
                {accountLoading ? (
                  <div className="flex gap-2">
                    <Skeleton.Button active size="small" />
                    <Skeleton.Button active size="small" />
                    <Skeleton.Button active size="small" />
                  </div>
                ) : (
                  <Tabs value={activeSpaceId} onValueChange={setActiveSpaceId}>
                    <TabsList className="h-9">
                      {accountGroupList
                        .sort((a, b) => (a.rank || 0) - (b.rank || 0))
                        .map((space) => {
                          const groupAccounts = isInteractivePage
                            ? accountList.filter(account => account.groupId === space.id)
                            : space.children || []
                          const totalCount = groupAccounts.length
                          const onlineCount = groupAccounts.filter(account => account.status === AccountStatus.USABLE).length

                          return (
                            <TabsTrigger
                              key={space.id}
                              value={space.id}
                              className="relative"
                            >
                              <span>{space.name}</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                {onlineCount}/{totalCount}
                              </span>
                            </TabsTrigger>
                          )
                        })}
                    </TabsList>
                  </Tabs>
                )}
              </div>

              {/* 操作按钮组 */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserManageModalOpen(true)}
                >
                  <UserOutlined className="mr-2" />
                  {t('accountManager')}
                </Button>

                <Button
                  size="sm"
                  className="bg-gradient-to-r from-[#625BF2] to-[#925BF2] hover:opacity-90"
                  onClick={() => setMcpManagerModalOpen(true)}
                >
                  {t('mcpManagerTit')}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={openAddAccountFlow}
                  data-driver-target="add-channel-btn"
                >
                  <PlusOutlined className="mr-2" />
                  {t('addAccount')}
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setOpenCreateGroup(true)}
                >
                  <PlusOutlined className="mr-2" />
                  {t('createSpace.button')}
                </Button>
              </div>
            </div>

            {/* 第二行：账号列表（水平滚动） */}
            <div className="px-4 pb-3">
              {topExtra}
              {accountLoading ? (
                <div className="flex gap-2">
                  <Skeleton.Avatar active size="large" />
                  <Skeleton.Avatar active size="large" />
                  <Skeleton.Avatar active size="large" />
                </div>
              ) : (
                <ScrollArea className="w-full">
                  <div className="flex gap-3 pb-2">
                    {currentSpaceAccounts.map((account) => {
                      if (excludePlatforms.includes(account.type)) return null

                      const platInfo = AccountPlatInfoMap.get(account.type)!
                      const isActive = activeAccountId === account.id
                      const isOffline = account.status === AccountStatus.DISABLE
                      const isMobileOnlyPlatform = isInteractivePage && (account.type === PlatType.Douyin || account.type === PlatType.Xhs)

                      return (
                        <div
                          key={account.id}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all cursor-pointer min-w-[100px] hover:border-primary/50",
                            isActive && "border-primary bg-primary/5",
                            !isActive && "border-border",
                            isOffline && "opacity-60",
                            isMobileOnlyPlatform && "relative"
                          )}
                          onClick={async () => {
                            if (isMobileOnlyPlatform) {
                              setMobileOnlyPlatform(account.type === PlatType.Douyin ? t('platformNames.douyin') : t('platformNames.xiaohongshu'))
                              setShowAppDownloadModal(true)
                              return
                            }

                            if (isOffline) {
                              if (account.type === PlatType.Xhs) {
                                setMobileOnlyPlatform(t('platformNames.xiaohongshu'))
                                setShowAppDownloadModal(true)
                                return
                              }
                              await handleOfflineAccountClick(account)
                              return
                            }
                            onAccountChange(account)
                          }}
                        >
                          <div className="relative">
                            <Avatar
                              src={getOssUrl(account.avatar)}
                              size={48}
                              className="border-2 border-background"
                            >
                              {account.nickname?.charAt(0)}
                            </Avatar>
                            {/* 平台图标 */}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center">
                              <Image
                                src={platInfo?.icon}
                                alt={platInfo?.name || ''}
                                width={12}
                                height={12}
                              />
                            </div>
                          </div>

                          <div className="text-center">
                            <Tooltip title={account.nickname}>
                              <div className="text-sm font-medium truncate max-w-[80px]">
                                {account.nickname}
                              </div>
                            </Tooltip>
                            <div className="text-xs text-muted-foreground mt-1">
                              {account.status === AccountStatus.USABLE ? (
                                <span className="text-success">{t('online')}</span>
                              ) : (
                                <span className="text-warning">{t('offline')}</span>
                              )}
                            </div>
                          </div>

                          {/* 更多操作 */}
                          <Popover
                            content={(
                              <AccountPopoverInfo
                                accountInfo={account}
                                onDeleteClick={(acc) => {
                                  setDeleteTarget(acc)
                                  setDeleteHitOpen(true)
                                }}
                              />
                            )}
                            placement="bottom"
                            trigger="click"
                          >
                            <button
                              className="text-xs text-muted-foreground hover:text-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              •••
                            </button>
                          </Popover>

                          {/* 移动端平台蒙层 */}
                          {isMobileOnlyPlatform && (
                            <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {t('mobileOnlySupport' as any)}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}
            </div>
          </div>

          <DeleteUserConfirmModal
            open={deleteHitOpen}
            deleteUsers={deleteTarget ? [deleteTarget] : []}
            onClose={() => {
              setDeleteHitOpen(false)
            }}
            onDeleteSuccess={async () => {
              await getAccountList()
              setDeleteTarget(null)
              toast.success(t('messages.deleteSuccess' as any))
            }}
          />

          <FacebookPagesModal
            open={showFacebookPagesModal}
            onClose={() => setShowFacebookPagesModal(false)}
            onSuccess={handleFacebookPagesSuccess}
          />

          {isInteractivePage && (
            <DownloadAppModal
              visible={showAppDownloadModal}
              onClose={() => setShowAppDownloadModal(false)}
              platform={mobileOnlyPlatform}
              zIndex={1000}
            />
          )}

          <Modal
            open={showReauthConfirm}
            title={t('reauthConfirm.title' as any)}
            onCancel={() => {
              setShowReauthConfirm(false)
              setReauthAccount(null)
            }}
            footer={(
              <AntButton
                type="primary"
                onClick={handleConfirmReauth}
              >
                {t('reauthConfirm.loginAgain' as any)}
              </AntButton>
            )}
          >
            <div>
              {reauthAccount && (
                <p className="mb-4">
                  {t('reauthConfirm.content' as any, {
                    platformName: AccountPlatInfoMap.get(reauthAccount.type)?.name || reauthAccount.type,
                    nickname: reauthAccount.nickname,
                    spaceName: accountGroupList.find(group => group.id === reauthAccount.groupId)?.name || t('defaultSpace'),
                  })}
                </p>
              )}
            </div>
          </Modal>
        </>
      )
    },
  ),
)

AccountTopBar.displayName = 'AccountTopBar'

export default AccountTopBar
