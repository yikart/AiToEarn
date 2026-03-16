/**
 * CreateGroupModal - 创建/编辑分组弹窗
 * 用于创建新分组或编辑已有分组
 */

'use client'

import type { CreateGroupData, MediaGroup } from '../../materialStore'
import { Image as ImageIcon, Video } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/lib/toast'

interface CreateGroupModalProps {
  /** 是否显示 */
  open: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 正在编辑的分组（null 表示创建模式） */
  editingGroup: MediaGroup | null
  /** 提交回调 */
  onSubmit: (data: CreateGroupData) => Promise<boolean>
  /** 是否提交中 */
  isSubmitting?: boolean
}

export function CreateGroupModal({
  open,
  onClose,
  editingGroup,
  onSubmit,
  isSubmitting,
}: CreateGroupModalProps) {
  const { t } = useTransClient('material')

  // 表单状态
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [type, setType] = useState<'video' | 'img'>('video')

  // 是否是编辑模式
  const isEditMode = !!editingGroup

  // 同步编辑数据
  useEffect(() => {
    if (open) {
      if (editingGroup) {
        setTitle(editingGroup.title)
        setDesc(editingGroup.desc || '')
        setType(editingGroup.type)
      }
      else {
        // 重置表单
        setTitle('')
        setDesc('')
        setType('video')
      }
    }
  }, [open, editingGroup])

  // 处理提交
  const handleSubmit = async () => {
    // 验证
    if (!title.trim()) {
      toast.error(t('mediaManagement.groupNamePlaceholder'))
      return
    }

    const data: CreateGroupData = {
      title: title.trim(),
      desc: desc.trim(),
      type,
    }

    const success = await onSubmit(data)
    if (success) {
      onClose()
    }
  }

  // 自定义 footer
  const footer = (
    <div className="flex justify-end gap-3">
      <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
        {t('mediaManagement.cancel')}
      </Button>
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || !title.trim()}
        loading={isSubmitting}
      >
        {isEditMode ? t('mediaManagement.save') : t('mediaManagement.create')}
      </Button>
    </div>
  )

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={isEditMode ? t('mediaManagement.editGroup') : t('mediaManagement.createGroup')}
      footer={footer}
      width={480}
      destroyOnClose
    >
      <div className="space-y-4 py-2">
        {/* 分组名称 */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">
            {t('mediaManagement.groupName')}
            <span className="text-destructive ml-1">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t('mediaManagement.groupNamePlaceholder')}
            maxLength={50}
            disabled={isSubmitting}
          />
        </div>

        {/* 描述 */}
        <div className="space-y-2">
          <Label htmlFor="desc" className="text-sm font-medium">
            {t('mediaManagement.description')}
          </Label>
          <Textarea
            id="desc"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder={t('mediaManagement.descriptionPlaceholder')}
            maxLength={200}
            rows={3}
            disabled={isSubmitting}
            className="resize-none"
          />
        </div>

        {/* 类型选择 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t('mediaManagement.type')}
            <span className="text-destructive ml-1">*</span>
          </Label>
          <Select
            value={type}
            onValueChange={value => setType(value as 'video' | 'img')}
            disabled={isSubmitting || isEditMode}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="video">
                <div className="flex items-center">
                  <Video className="w-4 h-4 mr-2 text-blue-500" />
                  {t('mediaManagement.video')}
                </div>
              </SelectItem>
              <SelectItem value="img">
                <div className="flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2 text-green-500" />
                  {t('mediaManagement.image')}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {isEditMode && (
            <p className="text-xs text-muted-foreground">
              {t('mediaManagement.typeCannotChangeAfterCreation')}
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
