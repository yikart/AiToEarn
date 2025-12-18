/**
 * ProfileTab - 个人资料设置 Tab
 */

'use client'

import { Camera, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { useShallow } from 'zustand/shallow'
import { updateUserInfoApi } from '@/api/apiReq'
import { uploadToOss } from '@/api/oss'
import { useTransClient } from '@/app/i18n/client'
import { AvatarCropModal } from '@/components/AvatarCropModal'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store/user'
import { getOssUrl } from '@/utils/oss'

interface ProfileTabProps {
  onClose: () => void
}

export function ProfileTab({ onClose }: ProfileTabProps) {
  const { t } = useTransClient('settings')
  const { t: tCommon } = useTransClient('common')
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { userInfo, getUserInfo, clearLoginStatus } = useUserStore(
    useShallow(state => ({
      userInfo: state.userInfo,
      getUserInfo: state.getUserInfo,
      clearLoginStatus: state.clearLoginStatus,
    })),
  )

  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(userInfo?.name || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const avatarUrl = userInfo?.avatar ? getOssUrl(userInfo.avatar) : ''

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file)
      return

    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.avatarTypeError'))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('profile.avatarSizeError'))
      return
    }

    setSelectedFile(file)
    setCropModalOpen(true)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCropComplete = async (blob: Blob) => {
    setIsUploadingAvatar(true)
    try {
      const file = new File([blob], `avatar_${Date.now()}.png`, { type: 'image/png' })
      const ossPath = await uploadToOss(file)

      const response = await updateUserInfoApi({
        name: userInfo?.name || '',
        avatar: ossPath,
      })

      if (response?.code === 0 && response.data) {
        await getUserInfo()
        toast.success(t('profile.avatarUpdateSuccess'))
        setCropModalOpen(false)
        setSelectedFile(null)
      }
      else {
        toast.error(response?.message || t('profile.avatarUpdateFailed'))
      }
    }
    catch (error) {
      console.error('头像上传失败:', error)
      toast.error(t('profile.avatarUpdateFailed'))
    }
    finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleCropModalClose = () => {
    setCropModalOpen(false)
    setSelectedFile(null)
  }

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
      const response = await updateUserInfoApi({
        name: editName.trim(),
        avatar: userInfo?.avatar,
      })

      if (response?.code === 0 && response.data) {
        await getUserInfo()
        toast.success(t('profile.nameUpdateSuccess'))
        setIsEditingName(false)
      }
      else {
        toast.error(response?.message || t('profile.nameUpdateFailed'))
      }
    }
    catch (error) {
      toast.error(t('profile.nameUpdateFailed'))
    }
    finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    clearLoginStatus()
    toast.success(tCommon('logout'))
    onClose()
    router.push('/auth/login')
  }

  const totalIncome = ((userInfo as any)?.totalIncome || 0) / 100
  const currentBalance = (userInfo?.income || 0) / 100

  return (
    <div className="space-y-6">
      {/* 用户信息卡片 */}
      <div className="flex items-center gap-4">
        <div className="group relative shrink-0 cursor-pointer" onClick={handleAvatarClick}>
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl} alt={userInfo?.name || ''} />
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className={cn(
            'absolute inset-0 flex items-center justify-center rounded-full bg-black/50 transition-opacity',
            isUploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
          >
            {isUploadingAvatar
              ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              : <Camera size={20} className="text-white" />}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        <div className="min-w-0 flex-1">
          {isEditingName
            ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter')
                        handleSaveName()
                      if (e.key === 'Escape') {
                        setIsEditingName(false)
                        setEditName(userInfo?.name || '')
                      }
                    }}
                  />
                  <Button size="sm" onClick={handleSaveName} disabled={isSaving} className="h-8">
                    {isSaving ? t('profile.saving') : t('profile.save')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingName(false)
                      setEditName(userInfo?.name || '')
                    }}
                    className="h-8"
                  >
                    {t('profile.cancel')}
                  </Button>
                </div>
              )
            : (
                <div
                  className="cursor-pointer text-lg font-semibold text-foreground transition-colors hover:text-primary"
                  onClick={() => setIsEditingName(true)}
                >
                  {userInfo?.name || tCommon('unknownUser')}
                </div>
              )}
          <p className="mt-1 truncate text-sm text-muted-foreground">{userInfo?.mail || '-'}</p>
        </div>
      </div>

      {/* 收入信息 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-muted p-4">
          <p className="mb-1 text-sm text-muted-foreground">{t('profile.totalIncome')}</p>
          <p className="text-2xl font-bold text-foreground">¥{totalIncome.toFixed(2)}</p>
        </div>
      </div>

      {/* 退出登录按钮 */}
      <Button
        variant="ghost"
        className="h-11 w-full justify-center gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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

