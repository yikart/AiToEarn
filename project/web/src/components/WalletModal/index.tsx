/**
 * WalletModal - 钱包管理弹窗组件
 * 用于管理用户钱包账户，可在其他页面调用
 */

'use client'

import type { UserWalletAccount, UserWalletAccountCreateDto } from '@/api/userWalletAccount'
import { useEffect, useMemo, useState } from 'react'
import {
  createUserWalletAccount,
  deleteUserWalletAccount,
  EMAIL_REGEX,
  getUserWalletAccountList,
  updateUserWalletAccount,
} from '@/api/userWalletAccount'
import { useTransClient } from '@/app/i18n/client'
import { useUserStore } from '@/store/user'
import { toast } from '@/lib/toast'
import { confirm } from '@/lib/confirm'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { Spin } from '@/components/ui/spin'
import { Empty } from '@/components/ui/empty'

interface WalletModalProps {
  open: boolean
  onClose: () => void
}

export default function WalletModal({ open, onClose }: WalletModalProps) {
  const { t } = useTransClient('wallet')
  const { userInfo } = useUserStore()

  const [list, setList] = useState<UserWalletAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  const [formData, setFormData] = useState<Partial<UserWalletAccountCreateDto>>({
    userId: userInfo?._id || '',
    mail: '',
    userName: '',
    account: '',
    cardNum: '',
    phone: '',
    type: 'ZFB',
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<UserWalletAccount | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      fetchList(1, 10)
    }
  }, [open])

  async function fetchList(pageNo: number, pageSize: number) {
    setLoading(true)
    try {
      const res = await getUserWalletAccountList(pageNo, pageSize)
      if (res?.data) {
        setList(res.data.list || [])
        setPagination({ current: pageNo, pageSize, total: res.data.total || 0 })
      }
    }
    finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setFormData({
      userId: userInfo?._id || '',
      mail: '',
      userName: '',
      account: '',
      cardNum: '',
      phone: '',
      type: 'ZFB',
    })
    setFormErrors({})
    setModalOpen(true)
  }

  function onEdit(record: UserWalletAccount) {
    setEditing(record)
    setFormData({
      userId: record.userId,
      mail: record.mail,
      userName: record.userName,
      account: record.account,
      cardNum: record.cardNum,
      phone: record.phone,
      type: record.type,
    })
    setFormErrors({})
    setModalOpen(true)
  }

  async function onDelete(record: UserWalletAccount) {
    const result = await confirm({
      title: t('actions.deleteConfirm'),
      content: t('actions.deleteConfirmDesc') || '此操作不可恢复',
      okType: 'destructive',
      okText: t('actions.confirm' as any),
      cancelText: t('actions.cancel' as any),
    })

    if (result) {
      const res = await deleteUserWalletAccount(record._id)
      if (res) {
        toast.success(t('messages.deleteSuccess'))
        fetchList(pagination.current, pagination.pageSize)
      }
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {}

    if (!formData.userId) {
      errors.userId = t('form.required')
    }

    if (!formData.mail) {
      errors.mail = t('form.required')
    }
    else if (!EMAIL_REGEX.test(formData.mail)) {
      errors.mail = t('form.mailInvalid')
    }

    if (!formData.account) {
      errors.account = t('form.required')
    }

    if (!formData.type) {
      errors.type = t('form.required')
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function onSubmit() {
    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    try {
      if (editing) {
        const res = await updateUserWalletAccount(editing._id, formData as Partial<UserWalletAccountCreateDto>)
        if (res) {
          toast.success(t('messages.updateSuccess'))
          setModalOpen(false)
          fetchList(pagination.current, pagination.pageSize)
        }
      }
      else {
        const res = await createUserWalletAccount(formData as UserWalletAccountCreateDto)
        if (res) {
          toast.success(t('messages.createSuccess'))
          setModalOpen(false)
          fetchList(pagination.current, pagination.pageSize)
        }
      }
    }
    finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Modal
        title={t('title')}
        open={open}
        onCancel={onClose}
        footer={null}
        width="90%"
      >
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreate} size="sm">
              {t('actions.create')}
            </Button>
          </div>

          <Spin spinning={loading}>
            {list.length > 0 ? (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">{t('columns.userName')}</TableHead>
                        <TableHead className="w-[150px] hidden md:table-cell">{t('columns.mail')}</TableHead>
                        <TableHead className="w-[120px]">{t('columns.account')}</TableHead>
                        <TableHead className="w-[80px]">{t('columns.type')}</TableHead>
                        <TableHead className="w-[120px] hidden lg:table-cell">{t('columns.phone')}</TableHead>
                        <TableHead className="w-[120px] hidden lg:table-cell">{t('columns.cardNum')}</TableHead>
                        <TableHead className="w-[120px]">{t('columns.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {list.map((record) => (
                        <TableRow key={record._id}>
                          <TableCell className="truncate">{record.userName || '-'}</TableCell>
                          <TableCell className="truncate hidden md:table-cell">{record.mail}</TableCell>
                          <TableCell className="truncate">{record.account}</TableCell>
                          <TableCell>{record.type === 'ZFB' ? t('types.ZFB') : t('types.WX_PAY')}</TableCell>
                          <TableCell className="truncate hidden lg:table-cell">{record.phone || '-'}</TableCell>
                          <TableCell className="truncate hidden lg:table-cell">{record.cardNum || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onEdit(record)}
                              >
                                {t('actions.edit')}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onDelete(record)}
                                className="text-destructive hover:text-destructive"
                              >
                                {t('actions.delete')}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-center">
                  <Pagination
                    current={pagination.current}
                    pageSize={pagination.pageSize}
                    total={pagination.total}
                    onChange={(page, pageSize) => {
                      fetchList(page, pageSize || 10)
                    }}
                    showSizeChanger={false}
                    showQuickJumper={false}
                    showTotal={(total, range) => `${range[0]}-${range[1]} / ${total}`}
                    pageSizeOptions={['5', '10', '20']}
                  />
                </div>
              </>
            ) : (
              <Empty description={loading ? t('messages.loading') : t('messages.noData')} />
            )}
          </Spin>
        </div>
      </Modal>

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editing ? t('dialogs.editTitle') : t('dialogs.createTitle')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={onSubmit}
        okText={t('actions.confirm' as any)}
        cancelText={t('actions.cancel' as any)}
        confirmLoading={submitting}
        width="90%"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>{t('form.userId')}</Label>
            <Input
              value={formData.userId}
              disabled
              placeholder={t('form.userIdPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>
              {t('form.mail')}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              value={formData.mail}
              onChange={(e) => {
                setFormData({ ...formData, mail: e.target.value })
                if (formErrors.mail) {
                  setFormErrors({ ...formErrors, mail: '' })
                }
              }}
              placeholder={t('form.mailPlaceholder')}
              className={formErrors.mail ? 'border-destructive' : ''}
            />
            {formErrors.mail && (
              <p className="text-sm text-destructive">{formErrors.mail}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('form.userName')}</Label>
            <Input
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              placeholder={t('form.userNamePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>
              {t('form.account')}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              value={formData.account}
              onChange={(e) => {
                setFormData({ ...formData, account: e.target.value })
                if (formErrors.account) {
                  setFormErrors({ ...formErrors, account: '' })
                }
              }}
              placeholder={t('form.accountPlaceholder')}
              className={formErrors.account ? 'border-destructive' : ''}
            />
            {formErrors.account && (
              <p className="text-sm text-destructive">{formErrors.account}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('form.cardNum')}</Label>
            <Input
              value={formData.cardNum}
              onChange={(e) => setFormData({ ...formData, cardNum: e.target.value })}
              placeholder={t('form.cardNumPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('form.phone')}</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder={t('form.phonePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>
              {t('form.type')}
              <span className="text-destructive">*</span>
            </Label>
            <select
              value={formData.type}
              onChange={(e) => {
                setFormData({ ...formData, type: e.target.value as 'ZFB' | 'WX_PAY' })
                if (formErrors.type) {
                  setFormErrors({ ...formErrors, type: '' })
                }
              }}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="ZFB">{t('types.ZFB')}</option>
              <option value="WX_PAY">{t('types.WX_PAY')}</option>
            </select>
            {formErrors.type && (
              <p className="text-sm text-destructive">{formErrors.type}</p>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}

