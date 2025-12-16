/**
 * SettingsModal - 设置弹框组件
 * 包含个人资料、通用设置等功能
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, ExternalLink, LogOut, Settings, User } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useTransClient } from '@/app/i18n/client'
import { updateUserInfoApi } from '@/api/apiReq'
import { uploadToOss } from '@/api/oss'
import { AvatarCropModal } from '@/components/AvatarCropModal'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGetClientLng } from '@/hooks/useSystem'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store/user'
import { getOssUrl } from '@/utils/oss'

/** 设置页面类型 */
type SettingsTab = 'profile' | 'general'

export interface SettingsModalProps {
  /** 是否显示弹框 */
  open: boolean
  /** 关闭弹框回调 */
  onClose: () => void
}

/**
 * SettingsModal 设置弹框组件
 */
export const SettingsModal = ({ open, onClose }: SettingsModalProps) => {
  const { t } = useTransClient('settings')
  const token = useUserStore(state => state.token)

  // 是否已登录
  const isLoggedIn = !!token

  // 当前选中的标签页（未登录默认显示通用）
  const [activeTab, setActiveTab] = useState<SettingsTab>(isLoggedIn ? 'profile' : 'general')

  // 登录状态变化时重置标签
  useEffect(() => {
    if (!isLoggedIn) {
      setActiveTab('general')
    }
  }, [isLoggedIn])

  // 侧边栏配置（根据登录状态显示不同菜单）
  const sidebarItems: { key: SettingsTab, icon: React.ReactNode, label: string }[] = isLoggedIn
    ? [
        { key: 'profile', icon: <User size={18} />, label: t('tabs.profile') },
        { key: 'general', icon: <Settings size={18} />, label: t('tabs.general') },
      ]
    : [
        { key: 'general', icon: <Settings size={18} />, label: t('tabs.general') },
      ]

  // 渲染右侧内容
  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return isLoggedIn ? <ProfileContent onClose={onClose} /> : <GeneralContent />
      case 'general':
        return <GeneralContent />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-[720px] p-0 gap-0 overflow-hidden" aria-describedby={undefined}>
        {/* 无障碍标题（视觉隐藏） */}
        <DialogTitle className="sr-only">{t('title')}</DialogTitle>

        {/* 顶部标题栏 */}
        <div className="flex items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-900">{t('title')}</h2>
        </div>

        <div className="flex min-h-[400px]">
          {/* 左侧侧边栏 */}
          <div className="w-[180px] border-r border-gray-100 py-4 bg-gray-50/50">
            <nav className="flex flex-col gap-1 px-3">
              {sidebarItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left',
                    activeTab === item.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:bg-white/60 hover:text-gray-800',
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* 右侧内容区域 */}
          <div className="flex-1 p-6 overflow-auto">
            {renderContent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * 个人资料内容组件
 */
function ProfileContent({ onClose }: { onClose: () => void }) {
  const { t } = useTransClient('settings')
  const { t: tCommon } = useTransClient('common')
  const router = useRouter()
  const lng = useGetClientLng()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { userInfo, setUserInfo, clearLoginStatus } = useUserStore(
    useShallow((state) => ({
      userInfo: state.userInfo,
      setUserInfo: state.setUserInfo,
      clearLoginStatus: state.clearLoginStatus,
    })),
  )

  // 编辑状态
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(userInfo?.name || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // 裁剪弹窗状态
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // 获取用户头像（头像已存储为完整地址，但兼容旧数据）
  const avatarUrl = userInfo?.avatar ? getOssUrl(userInfo.avatar) : ''

  // 处理头像点击
  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  // 处理文件选择，打开裁剪弹窗
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.avatarTypeError'))
      return
    }

    // 验证文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('profile.avatarSizeError'))
      return
    }

    // 设置选中的文件并打开裁剪弹窗
    setSelectedFile(file)
    setCropModalOpen(true)

    // 清空 input 以便可以重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 处理裁剪完成，上传头像
  const handleCropComplete = async (blob: Blob) => {
    setIsUploadingAvatar(true)
    try {
      // 将 Blob 转换为 File
      const file = new File([blob], `avatar_${Date.now()}.png`, { type: 'image/png' })

      // 上传到 OSS
      const ossPath = await uploadToOss(file)

      // 更新用户信息，存储完整地址
      const response: any = await updateUserInfoApi({
        name: userInfo?.name || '',
        avatar: ossPath,
      })

      if (response?.code === 0 && response.data) {
        setUserInfo(response.data)
        toast.success(t('profile.avatarUpdateSuccess'))
        setCropModalOpen(false)
        setSelectedFile(null)
      } else {
        toast.error(response?.message || t('profile.avatarUpdateFailed'))
      }
    } catch (error) {
      console.error('头像上传失败:', error)
      toast.error(t('profile.avatarUpdateFailed'))
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // 关闭裁剪弹窗
  const handleCropModalClose = () => {
    setCropModalOpen(false)
    setSelectedFile(null)
  }

  // 保存用户名
  const handleSaveName = async () => {
    if (!editName.trim()) {
      toast.error(t('profile.nameRequired'))
      return
    }

    if (editName.length < 2 || editName.length > 20) {
      toast.error(t('profile.nameLengthError'))
      return
    }

    setIsSaving(true)
    try {
      const response: any = await updateUserInfoApi({
        name: editName.trim(),
        avatar: userInfo?.avatar,
      })

      if (response?.code === 0 && response.data) {
        setUserInfo(response.data)
        toast.success(t('profile.nameUpdateSuccess'))
        setIsEditingName(false)
      } else {
        toast.error(response?.message || t('profile.nameUpdateFailed'))
      }
    } catch (error) {
      toast.error(t('profile.nameUpdateFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  // 退出登录
  const handleLogout = () => {
    clearLoginStatus()
    toast.success(tCommon('logout'))
    onClose()
    router.push(`/${lng}/login`)
  }

  // 跳转到个人中心
  const handleGoToProfile = () => {
    onClose()
    router.push(`/${lng}/profile`)
  }

  // 计算累计收入和当前余额（分转元）
  const totalIncome = ((userInfo as any)?.totalIncome || 0) / 100
  const currentBalance = (userInfo?.income || 0) / 100

  return (
    <div className="space-y-5">
      {/* 用户信息卡片 */}
      <div className="flex items-center gap-4">
        {/* 头像 */}
        <div className="relative group cursor-pointer shrink-0" onClick={handleAvatarClick}>
          <Avatar className="h-14 w-14">
            <AvatarImage src={avatarUrl} alt={userInfo?.name || ''} />
            <AvatarFallback className="bg-gray-200 text-gray-600 text-lg font-medium">
              {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {/* 上传遮罩 */}
          <div className={cn(
            'absolute inset-0 flex items-center justify-center rounded-full bg-black/50 transition-opacity',
            isUploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}>
            {isUploadingAvatar ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera size={18} className="text-white" />
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* 用户名和邮箱 */}
        <div className="flex-1 min-w-0">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName()
                  if (e.key === 'Escape') {
                    setIsEditingName(false)
                    setEditName(userInfo?.name || '')
                  }
                }}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveName}
                disabled={isSaving}
                className="h-8 px-3 text-sm"
              >
                {isSaving ? t('profile.saving') : t('profile.save')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditingName(false)
                  setEditName(userInfo?.name || '')
                }}
                className="h-8 px-3 text-sm"
              >
                {t('profile.cancel')}
              </Button>
            </div>
          ) : (
            <div
              className="text-base font-medium text-gray-900 cursor-pointer hover:text-gray-600 transition-colors"
              onClick={() => setIsEditingName(true)}
            >
              {userInfo?.name || tCommon('unknownUser')}
            </div>
          )}
          <p className="text-sm text-gray-500 mt-1 truncate">{userInfo?.mail || '-'}</p>
        </div>

        {/* 跳转按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoToProfile}
          className="text-gray-400 hover:text-gray-600 h-9 px-2"
        >
          <ExternalLink size={18} />
        </Button>
      </div>

      {/* 收入信息 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">{t('profile.totalIncome')}</p>
          <p className="text-xl font-semibold text-gray-900">
            ¥{totalIncome.toFixed(2)}
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">{t('profile.currentBalance')}</p>
          <p className="text-xl font-semibold text-gray-900">
            ¥{currentBalance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* 退出登录按钮 */}
      <Button
        variant="ghost"
        className="w-full justify-center gap-2 text-gray-500 hover:text-red-600 hover:bg-red-50 h-10"
        onClick={handleLogout}
      >
        <LogOut size={18} />
        <span>{t('profile.logout')}</span>
      </Button>

      {/* 头像裁剪弹窗 */}
      <AvatarCropModal
        open={cropModalOpen}
        onClose={handleCropModalClose}
        imageFile={selectedFile}
        onCropComplete={handleCropComplete}
        isUploading={isUploadingAvatar}
      />
    </div>
  )
}

/**
 * 通用设置内容组件
 */
function GeneralContent() {
  const { t } = useTransClient('settings')
  const router = useRouter()
  const lng = useGetClientLng()

  // 语言选项
  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'zh-CN', label: '简体中文' },
  ]

  // 处理语言切换
  const handleLanguageChange = (newLng: string) => {
    const currentPath = location.pathname
    const pathWithoutLang = currentPath.replace(`/${lng}`, '') || '/'
    const newPath = `/${newLng}${pathWithoutLang}`
    router.push(newPath)
  }

  return (
    <div className="space-y-5">
      {/* 网站语言 */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-700">{t('general.language')}</h4>
          <p className="text-sm text-gray-400 mt-1">{t('general.languageDesc')}</p>
        </div>
        <Select value={lng} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languageOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default SettingsModal

