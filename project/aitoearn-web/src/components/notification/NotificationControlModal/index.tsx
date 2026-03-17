/**
 * NotificationControlModal - 通知控制设置弹窗
 * 用于管理各类通知的邮件推送开关
 */

'use client'

import type { NotificationControlItem } from '@/api/notification'
import { Mail } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import {
  getNotificationControl,
  NotificationType,
  updateNotificationControl,
} from '@/api/notification'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Spin } from '@/components/ui/spin'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/lib/toast'

interface NotificationControlModalProps {
  visible: boolean
  onClose: () => void
}

function getNotificationTypeLabel(type: string, t: (key: string) => string): string {
  const labelMap: Record<string, string> = {
    [NotificationType.TaskReminder]: t('controlTypes.taskReminder'),
    [NotificationType.UserWithdraw]: t('controlTypes.userWithdraw'),
    [NotificationType.TaskPunish]: t('controlTypes.taskPunish'),
    [NotificationType.TaskDemandAdd]: t('controlTypes.taskDemandAdd'),
    [NotificationType.TaskDemandBalanceNotEnough]: t('controlTypes.taskDemandBalanceNotEnough'),
    [NotificationType.AgentResult]: t('controlTypes.agentResult'),
  }
  return labelMap[type] || type
}

const NotificationControlModal: React.FC<NotificationControlModalProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTransClient('notification' as any)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [controls, setControls] = useState<NotificationControlItem[]>([])

  const fetchNotificationControl = async () => {
    try {
      setLoading(true)
      const response = await getNotificationControl()
      if (response && response.data) {
        setControls(response.data.controls || [])
      }
    }
    catch {
      toast.error(t('getControlFailed'))
    }
    finally {
      setLoading(false)
    }
  }

  const handleToggleEmail = (type: string, enabled: boolean) => {
    setControls(prev =>
      prev.map(item => (item.type === type ? { ...item, email: enabled } : item)),
    )
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const controlsRecord: Record<string, { email: boolean }> = {}
      controls.forEach((item) => {
        controlsRecord[item.type] = { email: item.email }
      })
      await updateNotificationControl({ controls: controlsRecord })
      toast.success(t('saveControlSuccess'))
      onClose()
    }
    catch {
      toast.error(t('saveControlFailed'))
    }
    finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (visible) {
      fetchNotificationControl()
    }
  }, [visible])

  return (
    <Modal
      title={(
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          <span className="text-base font-semibold">{t('controlTitle')}</span>
        </div>
      )}
      open={visible}
      onCancel={onClose}
      data-testid="notification-control-modal"
      footer={(
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="outline" disabled={saving}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving || loading} data-testid="notification-control-save-btn">
            {saving ? t('saving') : t('save')}
          </Button>
        </div>
      )}
      width={500}
    >
      <Spin spinning={loading}>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground mb-4">{t('controlDescription')}</p>
          {controls.map(item => (
            <div
              key={item.type}
              className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <span className="text-sm font-medium">
                  {getNotificationTypeLabel(item.type, t)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.email}
                  onCheckedChange={checked => handleToggleEmail(item.type, checked)}
                  data-testid="notification-control-switch"
                />
              </div>
            </div>
          ))}
          {controls.length === 0 && !loading && (
            <div className="text-center text-muted-foreground py-8">{t('noControlItems')}</div>
          )}
        </div>
      </Spin>
    </Modal>
  )
}

export default NotificationControlModal
