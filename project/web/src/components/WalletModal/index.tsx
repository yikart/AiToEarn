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
// 邮箱正则表达式
const EMAIL_REGEX = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/

// 中国手机号正则表达式（11位数字，1开头）
const PHONE_REGEX = /^1[3-9]\d{9}$/

// 身份证号正则表达式（支持国际身份证，限制宽松：6-30位字母数字组合，允许横线和空格）
const ID_CARD_REGEX = /^[A-Za-z0-9\s\-]{6,30}$/
import { useTransClient } from '@/app/i18n/client'
import { useUserStore } from '@/store/user'
import { toast } from '@/lib/toast'
import { confirm } from '@/lib/confirm'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'
import { Spin } from '@/components/ui/spin'
import { Empty } from '@/components/ui/empty'
import { Badge } from '@/components/ui/badge'
import { MoreVertical, Edit, Trash2, Star } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
    // 编辑模式下只设置可编辑的字段
    setFormData({
      email: record.email || '',
      userName: record.userName || '',
      idCard: record.idCard || '',
      phone: record.phone || '',
    })
    setFormErrors({})
    setModalOpen(true)
  }

  async function onDelete(record: WalletAccount) {
    const deleteConfirmDesc = t('actions.deleteConfirmDesc')
    const result = await confirm({
      title: t('actions.deleteConfirm'),
      content: deleteConfirmDesc && deleteConfirmDesc !== 'actions.deleteConfirmDesc' ? deleteConfirmDesc : 'This operation cannot be undone. Are you sure you want to delete this wallet account?',
      okType: 'destructive',
      okText: t('actions.confirm' as any),
      cancelText: t('actions.cancel' as any),
    })

    console.log('result', result)

    if (result) {
      try {
        console.log('Deleting wallet account:', record.id)
        const res = await deleteWalletAccountApi(record.id)
        console.log('Delete response:', res)
        
        // request 函数返回格式：{ code, data, message, url } 或 null
        // 成功时 code === 0，返回整个响应对象
        // 失败时返回 null（request 函数内部已显示错误提示）
        if (res) {
          // 检查 code 是否为 0（成功）
          if (res.code === 0 || res.code === '0') {
            toast.success(t('messages.deleteSuccess'))
            fetchList(pagination.current, pagination.pageSize)
          }
          else {
            // code 不为 0，显示错误信息
            const errorMsg = res.message || t('messages.deleteFailed') || 'Delete failed'
            toast.error(errorMsg)
          }
        }
        else {
          // res 为 null，说明请求失败（request 函数已显示错误提示）
          console.warn('Delete wallet account failed: request returned null')
        }
      }
      catch (error) {
        console.error('Delete wallet account error:', error)
        toast.error(t('messages.deleteFailed') || 'Delete failed')
      }
    }
  }

  async function onSetDefault(record: WalletAccount) {
    try {
      const res = await setDefaultWalletAccountApi(record.id)
      if (res) {
        toast.success(t('messages.setDefaultSuccess') || 'Set as default successfully')
        fetchList(pagination.current, pagination.pageSize)
      }
    }
    catch (error) {
      toast.error(t('messages.setDefaultFailed') || 'Set as default failed')
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {}

    // 邮箱校验
    if (formData.email && !EMAIL_REGEX.test(formData.email)) {
      errors.email = t('form.mailInvalid') || 'Invalid email format'
    }

    // 创建模式下才需要验证账号和类型
    if (!editing) {
      // 账号必填
      if (!formData.account) {
        errors.account = t('form.required') || 'Account is required'
      }

      // 类型必填
      if (!formData.type) {
        errors.type = t('form.required') || 'Type is required'
      }
    }

    // 手机号校验
    if (formData.phone && formData.phone.trim() !== '') {
      if (!PHONE_REGEX.test(formData.phone.trim())) {
        errors.phone = 'Invalid phone number format. Please enter a valid 11-digit phone number'
      }
    }

    // 身份证号校验
    if (formData.idCard && formData.idCard.trim() !== '') {
      const trimmedIdCard = formData.idCard.trim()
      if (!ID_CARD_REGEX.test(trimmedIdCard)) {
        errors.idCard = 'Invalid ID number format. Please enter 6-30 alphanumeric characters'
      }
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
      [WalletAccountType.Alipay]: t('types.ZFB') || 'Alipay',
      [WalletAccountType.WechatPay]: t('types.WX_PAY') || 'WeChat Pay',
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {list.map((record) => (
                    <Card key={record.id} className="relative">
                      {/* 右上角状态标识 */}
                      <div className="absolute top-4 right-4 flex gap-2 z-10">
                        {record.isDefault && (
                            <Badge className="bg-primary text-primary-foreground">
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              Default
                            </Badge>
                        )}
                        {record.isVerified && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Verified
                          </Badge>
                        )}
                      </div>

                      {/* 卡片内容 */}
                      <div className="p-4 space-y-3">
                        {/* 类型和操作按钮 */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-lg mb-1">
                              {getTypeText(record.type)}
                            </div>
                            {record.userName && (
                              <div className="text-sm text-muted-foreground">
                                {record.userName}
                              </div>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!record.isDefault && (
                                <DropdownMenuItem onClick={() => onSetDefault(record)}>
                                  <Star className="mr-2 h-4 w-4" />
                                  Set as Default
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => onEdit(record)}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('actions.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDelete(record)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('actions.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* 账号信息 */}
                        <div className="space-y-2 pt-2 border-t">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">
                              {t('columns.account')}
                            </div>
                            <div className="font-mono text-sm break-all">
                              {record.account}
                            </div>
                          </div>

                          {record.email && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                {t('columns.mail')}
                              </div>
                              <div className="text-sm break-all">
                                {record.email}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            {record.phone && (
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">
                                  {t('columns.phone')}
                                </div>
                                <div className="text-sm">
                                  {record.phone}
                                </div>
                              </div>
                            )}
                            {record.idCard && (
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">
                                  {t('columns.cardNum')}
                                </div>
                                <div className="text-sm break-all">
                                  {record.idCard}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-center mt-6">
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

          {/* 创建模式下显示账号字段 */}
          {!editing && (
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
          )}

          <div className="space-y-2">
            <Label>{t('form.cardNum')}</Label>
            <Input
              value={formData.idCard || ''}
              onChange={(e) => {
                setFormData({ ...formData, idCard: e.target.value })
                if (formErrors.idCard) {
                  setFormErrors({ ...formErrors, idCard: '' })
                }
              }}
              placeholder={t('form.cardNumPlaceholder')}
              className={formErrors.idCard ? 'border-destructive' : ''}
              maxLength={30}
            />
            {formErrors.idCard && (
              <p className="text-sm text-destructive">{formErrors.idCard}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('form.phone')}</Label>
            <Input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => {
                // 只允许输入数字
                const value = e.target.value.replace(/\D/g, '')
                setFormData({ ...formData, phone: value })
                if (formErrors.phone) {
                  setFormErrors({ ...formErrors, phone: '' })
                }
              }}
              placeholder={t('form.phonePlaceholder')}
              className={formErrors.phone ? 'border-destructive' : ''}
              maxLength={11}
            />
            {formErrors.phone && (
              <p className="text-sm text-destructive">{formErrors.phone}</p>
            )}
          </div>

          {/* 创建模式下显示类型字段 */}
          {!editing && (
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
                <option value={WalletAccountType.Alipay}>{t('types.ZFB') || 'Alipay'}</option>
                <option value={WalletAccountType.WechatPay}>{t('types.WX_PAY') || 'WeChat Pay'}</option>
                <option value={WalletAccountType.StripeConnect}>Stripe Connect</option>
              </select>
              {formErrors.type && (
                <p className="text-sm text-destructive">{formErrors.type}</p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}

