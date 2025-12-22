/**
 * WalletModal - 钱包管理弹窗组件
 * 用于管理用户钱包账户，可在其他页面调用
 */

'use client'

import type { WalletAccount, WalletAccountRequest, WalletAccountUpdateRequest } from '@/api/types/userWalletAccount'
import { WalletAccountType } from '@/api/types/userWalletAccount'
import { useEffect, useState } from 'react'
import {
  createWalletAccountApi,
  deleteWalletAccountApi,
  getWalletAccountListApi,
  updateWalletAccountApi,
  setDefaultWalletAccountApi,
} from '@/api/payment'
import { EMAIL_REGEX } from '@/api/userWalletAccount'
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

  const [list, setList] = useState<WalletAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  const [formData, setFormData] = useState<Partial<WalletAccountRequest>>({
    email: '',
    userName: '',
    account: '',
    idCard: '',
    phone: '',
    type: WalletAccountType.Alipay,
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<WalletAccount | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      fetchList(1, 10)
    }
  }, [open])

  async function fetchList(page: number, pageSize: number) {
    setLoading(true)
    try {
      const res = await getWalletAccountListApi({ page, pageSize })
      if (res?.data) {
        setList(res.data.list || [])
        setPagination({ current: page, pageSize, total: res.data.total || 0 })
      }
    }
    finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setFormData({
      email: '',
      userName: '',
      account: '',
      idCard: '',
      phone: '',
      type: WalletAccountType.Alipay,
    })
    setFormErrors({})
    setModalOpen(true)
  }

  function onEdit(record: WalletAccount) {
    setEditing(record)
    setFormData({
      email: record.email || '',
      userName: record.userName || '',
      account: record.account || '',
      idCard: record.idCard || '',
      phone: record.phone || '',
      type: record.type,
    })
    setFormErrors({})
    setModalOpen(true)
  }

  async function onDelete(record: WalletAccount) {
    const result = await confirm({
      title: t('actions.deleteConfirm'),
      content: t('actions.deleteConfirmDesc') || '此操作不可恢复',
      okType: 'destructive',
      okText: t('actions.confirm' as any),
      cancelText: t('actions.cancel' as any),
    })

    if (result) {
      const res = await deleteWalletAccountApi(record.id)
      if (res) {
        toast.success(t('messages.deleteSuccess'))
        fetchList(pagination.current, pagination.pageSize)
      }
    }
  }

  async function onSetDefault(record: WalletAccount) {
    try {
      const res = await setDefaultWalletAccountApi(record.id)
      if (res) {
        toast.success(t('messages.setDefaultSuccess') || '设置成功')
        fetchList(pagination.current, pagination.pageSize)
      }
    }
    catch (error) {
      toast.error(t('messages.setDefaultFailed') || '设置失败')
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {}

    if (formData.email && !EMAIL_REGEX.test(formData.email)) {
      errors.email = t('form.mailInvalid')
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
        const updateData: WalletAccountUpdateRequest = {
          email: formData.email,
          userName: formData.userName,
          phone: formData.phone,
          idCard: formData.idCard,
        }
        const res = await updateWalletAccountApi(editing.id, updateData)
        if (res) {
          toast.success(t('messages.updateSuccess'))
          setModalOpen(false)
          fetchList(pagination.current, pagination.pageSize)
        }
      }
      else {
        const createData: WalletAccountRequest = {
          account: formData.account,
          email: formData.email,
          userName: formData.userName,
          phone: formData.phone,
          idCard: formData.idCard,
          type: formData.type!,
        }
        const res = await createWalletAccountApi(createData)
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

  // 获取类型显示文本
  const getTypeText = (type: WalletAccountType) => {
    const typeMap: Record<WalletAccountType, string> = {
      [WalletAccountType.Alipay]: t('types.ZFB') || '支付宝',
      [WalletAccountType.WechatPay]: t('types.WX_PAY') || '微信支付',
      [WalletAccountType.StripeConnect]: 'Stripe Connect',
    }
    return typeMap[type] || type
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
                        <TableRow key={record.id}>
                          <TableCell className="truncate">{record.userName || '-'}</TableCell>
                          <TableCell className="truncate hidden md:table-cell">{record.email || '-'}</TableCell>
                          <TableCell className="truncate">{record.account}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{getTypeText(record.type)}</span>
                              {record.isDefault && (
                                <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                                  默认
                                </span>
                              )}
                              {record.isVerified && (
                                <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                                  已验证
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="truncate hidden lg:table-cell">{record.phone || '-'}</TableCell>
                          <TableCell className="truncate hidden lg:table-cell">{record.idCard || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {!record.isDefault && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onSetDefault(record)}
                                >
                                  设为默认
                                </Button>
                              )}
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
            <Label>
              {t('form.mail')}
            </Label>
            <Input
              value={formData.email || ''}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value })
                if (formErrors.email) {
                  setFormErrors({ ...formErrors, email: '' })
                }
              }}
              placeholder={t('form.mailPlaceholder')}
              className={formErrors.email ? 'border-destructive' : ''}
            />
            {formErrors.email && (
              <p className="text-sm text-destructive">{formErrors.email}</p>
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
              value={formData.idCard || ''}
              onChange={(e) => setFormData({ ...formData, idCard: e.target.value })}
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
                setFormData({ ...formData, type: e.target.value as WalletAccountType })
                if (formErrors.type) {
                  setFormErrors({ ...formErrors, type: '' })
                }
              }}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value={WalletAccountType.Alipay}>{t('types.ZFB') || '支付宝'}</option>
              <option value={WalletAccountType.WechatPay}>{t('types.WX_PAY') || '微信支付'}</option>
              <option value={WalletAccountType.StripeConnect}>Stripe Connect</option>
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

