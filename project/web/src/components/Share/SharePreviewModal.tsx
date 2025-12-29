/**
 * SharePreviewModal - 分享预览弹窗组件
 * 用于预览生成的分享图片并提供下载/发布功能
 */
'use client'

import { useRouter } from 'next/navigation'
import React, { useCallback, useState } from 'react'
import { uploadToOss } from '@/api/oss'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { PubType } from '@/app/config/publishConfig'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/lib/toast'
import { useAccountStore } from '@/store/account'
import { usePublishDialogStorageStore } from '../PublishDialog/usePublishDialogStorageStore'

interface SharePreviewModalProps {
  open: boolean
  onClose: () => void
  blobs: Blob[]
  urls: string[] // object URLs
  taskId: string
}

/**
 * 上传 Blob 数组到 OSS
 * @param blobs - 待上传的 Blob 数组
 * @returns 上传成功的 URL 数组
 */
async function uploadBlobsToOss(blobs: Blob[]): Promise<string[]> {
  const uploadedUrls: string[] = []
  for (let i = 0; i < blobs.length; i++) {
    const file = new File(
      [blobs[i]],
      `aitoearn_export_${Date.now()}_${i}.png`,
      { type: blobs[i].type || 'image/png' },
    )
    try {
      const url = await uploadToOss(file)
      uploadedUrls.push(url as string)
    }
    catch (err) {
      console.error('Upload failed for blob', err)
    }
  }
  return uploadedUrls
}

export function SharePreviewModal({
  open,
  onClose,
  blobs,
  urls,
  taskId,
}: SharePreviewModalProps) {
  const { t } = useTransClient('share')
  const router = useRouter()
  const { accountList, getAccountList } = useAccountStore()
  const [uploading, setUploading] = useState(false)

  // 下载图片
  const downloadBlobs = useCallback(async () => {
    try {
      for (let i = 0; i < blobs.length; i++) {
        const blob = blobs[i]
        const a = document.createElement('a')
        const url = URL.createObjectURL(blob)
        a.href = url
        a.download
          = blobs.length === 1
            ? `aitoearn_conversation_${taskId}.png`
            : `aitoearn_${taskId}_${i + 1}.png`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      }
      toast.success(t('download') || 'Downloaded')
    }
    catch (e) {
      console.error(e)
      toast.error(t('downloadFailed') || 'Download failed')
    }
  }, [blobs, taskId, t])

  // Agent 分享：上传图片并跳转到首页
  const handleAgentShare = useCallback(async () => {
    if (!blobs || blobs.length === 0) {
      toast.error(t('noImagesToShare') || 'No images to share')
      return
    }

    try {
      setUploading(true)
      const uploadedUrls = await uploadBlobsToOss(blobs)

      if (uploadedUrls.length === 0) {
        toast.error(t('uploadFailed') || 'Upload failed')
        return
      }

      const payloadPrompt
        = t('agentSharePrompt')
          || 'Share this image to social media. Copy write freely.'
      const params = new URLSearchParams()
      params.set('aiGenerated', 'true')
      params.set(
        'medias',
        encodeURIComponent(
          JSON.stringify(uploadedUrls.map(u => ({ type: 'IMAGE', url: u }))),
        ),
      )
      params.set('description', encodeURIComponent(payloadPrompt))

      onClose()
      router.push(`/?${params.toString()}`)
      toast.success(t('agentShareSaved') || 'Ready to share on Home')
    }
    catch (e) {
      console.error(e)
      toast.error(t('agentShareFailed') || 'Failed to prepare agent share')
    }
    finally {
      setUploading(false)
    }
  }, [blobs, onClose, router, t])

  // 发布分享：上传图片并跳转到账号页面
  const handlePublishShare = useCallback(async () => {
    if (!blobs || blobs.length === 0) {
      toast.error(t('noImagesToShare') || 'No images to share')
      return
    }

    try {
      usePublishDialogStorageStore.getState().clearPubData()
      setUploading(true)

      // 确保账号列表已加载
      if (!accountList || accountList.length === 0) {
        await getAccountList()
      }

      // 筛选支持图文发布且在线的账号
      const candidates = (useAccountStore.getState().accountList || []).filter(
        (acc) => {
          const plat = AccountPlatInfoMap.get(acc.type as any)
          return acc.status !== 0 && plat?.pubTypes?.has(PubType.ImageText)
        },
      )

      if (!candidates || candidates.length === 0) {
        toast.error(
          t('noAvailablePublishAccounts') || 'No available accounts to publish',
        )
        return
      }

      // 上传图片
      const uploadedUrls = await uploadBlobsToOss(blobs)

      if (uploadedUrls.length === 0) {
        toast.error(t('uploadFailed') || 'Upload failed')
        return
      }

      const medias = uploadedUrls.map(u => ({ type: 'IMAGE', url: u }))
      const title = ''
      const description
        = t('publishShareDescription')
          || 'I generated this conversation on aitoearn using agent, check it out!'
      const tags = ['aitoearn', 'agent']

      // 构建 URL 参数并跳转到账号页面
      const params = new URLSearchParams()
      params.set('aiGenerated', 'true')
      params.set('medias', encodeURIComponent(JSON.stringify(medias)))
      params.set('description', encodeURIComponent(description))
      params.set('title', encodeURIComponent(title))
      params.set('tags', encodeURIComponent(JSON.stringify(tags)))
      params.set('accountId', candidates[0].id)

      onClose()
      router.push(`/accounts?${params.toString()}`)
    }
    catch (e) {
      console.error(e)
      toast.error(t('publishShareFailed') || 'Failed to prepare publish')
    }
    finally {
      setUploading(false)
    }
  }, [blobs, accountList, getAccountList, onClose, router, t])

  return (
    <Modal open={open} onCancel={onClose} title={t('previewTitle')}>
      <div className="max-w-3xl mx-auto">
        <div className="bg-card rounded-md border p-4 flex justify-center">
          {urls[0] ? (
            <img
              src={urls[0]}
              alt="preview"
              className="max-h-[40vh] object-contain"
            />
          ) : (
            <div className="text-sm text-muted-foreground">
              {t('noPreview')}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleAgentShare}
            loading={uploading}
            className="cursor-pointer"
          >
            {t('agentShare')}
          </Button>
          <Button
            variant="outline"
            onClick={handlePublishShare}
            loading={uploading}
            className="cursor-pointer"
          >
            {t('publishShare')}
          </Button>
          <Button
            onClick={downloadBlobs}
            disabled={uploading}
            className="cursor-pointer"
          >
            {t('download')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default SharePreviewModal
