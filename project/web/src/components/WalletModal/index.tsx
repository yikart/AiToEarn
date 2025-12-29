/**
 * WalletModal - 钱包管理弹窗组件
 * 用于管理用户钱包账户，可在其他页面调用
 */

'use client'

import type { WalletAccount, WalletAccountRequest, WalletAccountUpdateRequest } from '@/api/types/userWalletAccount'
import { Edit, MoreVertical, Star, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  createConnectedAccountApi,
  createWalletAccountApi,
  deleteWalletAccountApi,
  getConnectedAccountDashboardLinkApi,
  getConnectedAccountDetailApi,
  getConnectedAccountListApi,
  getConnectedAccountOnboardingLinkApi,
  getWalletAccountListApi,
  refreshConnectedAccountStatusApi,
  setDefaultWalletAccountApi,
  updateWalletAccountApi,
} from '@/api/payment'

import { WalletAccountType } from '@/api/types/userWalletAccount'
import { useTransClient } from '@/app/i18n/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { Pagination } from '@/components/ui/pagination'
import { Spin } from '@/components/ui/spin'
import countries from '@/data/countries_alpha2.json'
import { confirm } from '@/lib/confirm'
import { toast } from '@/lib/toast'
import { useUserStore } from '@/store/user'
// 邮箱正则表达式
const EMAIL_REGEX = /^(?!\.)(?!.*\.\.)([\w'+\-.]*)[\w+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i

// 中国手机号正则表达式（11位数字，1开头）
const PHONE_REGEX = /^1[3-9]\d{9}$/

// 身份证号正则表达式（支持国际身份证，限制宽松：6-30位字母数字组合，允许横线和空格）
const ID_CARD_REGEX = /^[A-Z0-9\s\-]{6,30}$/i

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
  // 新的 connected account 创建表单字段
  const [connectedForm, setConnectedForm] = useState<{
    country?: string
    email?: string
    entityType?: 'individual' | 'company'
  }>({
    country: 'US',
    email: '',
    entityType: 'individual',
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
      // 使用新的 connected-account 接口获取钱包列表
      const res = await getConnectedAccountListApi({ page, pageSize })
      if (res && res.data) {
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
    // 打开创建弹窗：对于新的 flow，我们弹出 connected-account 创建表单（保留 entityType 默认值）
    setConnectedForm({ country: 'US', email: '', entityType: 'individual' })
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

  // 创建 connected account（新的 Stripe 流程）
  async function onCreateConnectedAccount() {
    if (!connectedForm.email || !connectedForm.country || !connectedForm.entityType) {
      toast.error('Please fill country, email and entity type')
      return
    }

    setSubmitting(true)
    try {
      const res = await createConnectedAccountApi({
        country: connectedForm.country,
        email: connectedForm.email,
        entityType: connectedForm.entityType,
      })
      if (res && res.data && res.data.accountId) {
        toast.success(t('messages.createSuccess') || 'Create success')
        // 获取 onboarding link 并打开
        try {
          const linkResp = await getConnectedAccountOnboardingLinkApi(res.data.accountId)
          if (linkResp && linkResp.data && linkResp.data.url) {
            window.open(linkResp.data.url, '_blank')
          }
        }
        catch (e) {
          console.error('Get onboarding link failed', e)
        }
        fetchList(pagination.current, pagination.pageSize)
        setModalOpen(false)
      }
    }
    catch (error) {
      console.error('Create connected account error', error)
      toast.error(t('messages.createFailed') || 'Create failed')
    }
    finally {
      setSubmitting(false)
    }
  }

  // 获取 dashboard link 并打开
  async function openDashboardLink(accountId: string) {
    try {
      const res = await getConnectedAccountDashboardLinkApi(accountId)
      if (res && res.data && res.data.url) {
        window.open(res.data.url, '_blank')
      }
    }
    catch (e) {
      console.error('Get dashboard link failed', e)
      toast.error('Failed to open dashboard')
    }
  }

  // 刷新账户状态
  async function refreshAccountStatus(accountId: string) {
    try {
      const res = await refreshConnectedAccountStatusApi(accountId)
      if (res) {
        toast.success('Refreshed')
        fetchList(pagination.current, pagination.pageSize)
      }
    }
    catch (e) {
      console.error('Refresh failed', e)
      toast.error('Refresh failed')
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
                  {list.map(record => (
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
                              {record.account || (record as any).accountId}
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
        onOk={editing ? onSubmit : onCreateConnectedAccount}
        okText={t('actions.confirm' as any)}
        cancelText={t('actions.cancel' as any)}
        confirmLoading={submitting}
        width="90%"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {editing ? (
            <>
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
                  onChange={e => setFormData({ ...formData, userName: e.target.value })}
                  placeholder={t('form.userNamePlaceholder')}
                />
              </div>
              {/* rest of edit form stays the same */}
            </>
          ) : (
            // Connected account creation form
            <>
              <div className="space-y-2">
                <Label>Country</Label>
                <select
                  value={connectedForm.country}
                  onChange={e => setConnectedForm({ ...connectedForm, country: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {Array.isArray(countries) && countries.map((c: any) => (
                    <option key={c.code} value={c.code}>
                      {c.zh}
                      {' '}
                      -
                      {' '}
                      {c.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={connectedForm.email || ''}
                  onChange={e => setConnectedForm({ ...connectedForm, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Entity Type</Label>
                <select
                  value={connectedForm.entityType}
                  onChange={e => setConnectedForm({ ...connectedForm, entityType: e.target.value as any })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                </select>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  )
}
