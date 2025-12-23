/**
 * IncomePage - 收入页面
 * 显示收入记录和提现记录
 */

'use client'

import type { IncomeRecord } from '@/api/types/income'
import type { WithdrawRecord } from '@/api/types/withdraw'
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, DollarOutlined, HistoryOutlined, WalletOutlined } from '@ant-design/icons'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { WithdrawRecordStatus, WithdrawStatus } from '@/api/types/withdraw'
import { getIncomeListApi, getIncomeDetailApi, createWithdrawApi, getWithdrawListApi } from '@/api/payment'
import { useTransClient } from '@/app/i18n/client'
import WalletAccountSelect from '@/components/WalletAccountSelect'
import WalletModal from '@/components/WalletModal'
import { useUserStore } from '@/store/user'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Spin } from '@/components/ui/spin'
import { Empty } from '@/components/ui/empty'
import { Pagination } from '@/components/ui/pagination'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import styles from './income.module.scss'

export default function IncomePage() {
  const router = useRouter()
  const params = useParams()
  const { userInfo, token, lang } = useUserStore()
  const { t } = useTransClient('income')
  const lng = params.lng as string

  // 收入记录相关状态
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([])
  const [incomeLoading, setIncomeLoading] = useState(false)
  const [incomePagination, setIncomePagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [incomeFilters, setIncomeFilters] = useState({
    type: undefined as 'reward_back' | 'task' | 'task_back' | 'task_withdraw' | undefined,
    status: undefined as 'pending' | 'withdrawn' | undefined,
  })

  // 提现记录相关状态
  const [withdrawRecords, setWithdrawRecords] = useState<WithdrawRecord[]>([])
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [withdrawPagination, setWithdrawPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  // 提现申请状态
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false)
  const [selectedIncomeRecord, setSelectedIncomeRecord] = useState<IncomeRecord | null>(null)
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false)
  const [selectedWalletAccountId, setSelectedWalletAccountId] = useState<string>('')

  // 钱包弹窗状态
  const [walletModalOpen, setWalletModalOpen] = useState(false)

  // 收入详情状态
  const [incomeDetailModalVisible, setIncomeDetailModalVisible] = useState(false)
  const [incomeDetail, setIncomeDetail] = useState<any>(null)
  const [incomeDetailLoading, setIncomeDetailLoading] = useState(false)

  // 获取收入记录
  const fetchIncomeRecords = async (page: number = 1, pageSize: number = 10) => {
    setIncomeLoading(true)
    try {
      const response = await getIncomeListApi({
        page,
        pageSize,
        ...(incomeFilters.type && { type: incomeFilters.type }),
        ...(incomeFilters.status && { status: incomeFilters.status }),
      })
      if (response?.data) {
        setIncomeRecords(response.data.list || [])
        setIncomePagination({
          current: page,
          pageSize,
          total: response.data.count || 0,
        })
      }
      else {
        toast.error(t('messages.getIncomeRecordsFailed'))
      }
    }
    catch (error) {
      toast.error(t('messages.getIncomeRecordsFailed'))
    }
    finally {
      setIncomeLoading(false)
    }
  }

  // 获取收入详情
  const fetchIncomeDetail = async (id: string) => {
    setIncomeDetailLoading(true)
    try {
      const response = await getIncomeDetailApi(id)
      if (response?.data || response) {
        setIncomeDetail(response?.data || response)
        setIncomeDetailModalVisible(true)
      }
      else {
        toast.error(t('messages.getIncomeDetailFailed'))
      }
    }
    catch (error) {
      toast.error(t('messages.getIncomeDetailFailed'))
    }
    finally {
      setIncomeDetailLoading(false)
    }
  }

  // 获取提现记录
  const fetchWithdrawRecords = async (page: number = 1, pageSize: number = 10) => {
    setWithdrawLoading(true)
    try {
      const response = await getWithdrawListApi({ page, pageSize })
      if (response?.data) {
        // 转换新API数据格式为旧格式以兼容现有代码
        const convertedRecords = (response.data.list || []).map((item: any) => ({
          _id: item.id,
          id: item.id,
          userId: item.userId,
          amount: item.amount,
          type: item.type === 'task' ? 'task' : 'reward',
          status: convertWithdrawStatus(item.status),
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
          desc: item.adminNote || item.metadata?.desc,
          flowId: item.flowId,
          screenshotUrls: item.screenshotUrls,
        }))
        setWithdrawRecords(convertedRecords as any)
        setWithdrawPagination({
          current: page,
          pageSize,
          total: response.data.count || 0,
        })
      }
      else {
        toast.error(t('messages.getWithdrawRecordsFailed'))
      }
    }
    catch (error) {
      toast.error(t('messages.getWithdrawRecordsFailed'))
    }
    finally {
      setWithdrawLoading(false)
    }
  }

  // 转换新API状态为旧状态枚举
  const convertWithdrawStatus = (status: string): WithdrawRecordStatus => {
    const statusMap: Record<string, WithdrawRecordStatus> = {
      pending: WithdrawRecordStatus.WAIT,
      approved: WithdrawRecordStatus.WAIT,
      paid: WithdrawRecordStatus.SUCCESS,
      failed: WithdrawRecordStatus.FAIL,
      rejected: WithdrawRecordStatus.FAIL,
    }
    return statusMap[status] || WithdrawRecordStatus.WAIT
  }

  // 提交提现申请
  const handleWithdraw = async (incomeRecord: IncomeRecord) => {
    setSelectedIncomeRecord(incomeRecord)
    setWithdrawModalVisible(true)
  }

  // 确认提现申请
  const handleConfirmWithdraw = async () => {
    if (!selectedIncomeRecord || !selectedWalletAccountId) {
      toast.error(t('messages.pleaseSelectWallet'))
      return
    }

    setWithdrawSubmitting(true)
    try {
      const response = await createWithdrawApi({
        amount: selectedIncomeRecord.amount,
        currency: (selectedIncomeRecord.currency as 'CNY' | 'UNK' | 'USD') || 'CNY',
        incomeRecordIds: [selectedIncomeRecord._id || selectedIncomeRecord.id],
        type: selectedIncomeRecord.type === 'task' ? 'task' : 'reward',
        walletAccountId: selectedWalletAccountId,
      })
      if (response) {
        toast.success(t('messages.withdrawSubmitted'))
        setWithdrawModalVisible(false)
        setSelectedIncomeRecord(null)
        setSelectedWalletAccountId('')
        // 刷新收入记录和提现记录
        fetchIncomeRecords(incomePagination.current, incomePagination.pageSize)
        fetchWithdrawRecords(withdrawPagination.current, withdrawPagination.pageSize)
      }
      else {
        toast.error(t('messages.withdrawFailed'))
      }
    }
    catch (error) {
      toast.error(t('messages.withdrawFailed'))
    }
    finally {
      setWithdrawSubmitting(false)
    }
  }

  // 获取收入类型显示文本
  const getIncomeTypeText = (type: string) => {
    const typeMap: { [key: string]: { color: string, text: string } } = {
      task: { color: 'green', text: t('incomeTypes.task') },
      task_back: { color: 'orange', text: t('incomeTypes.task_back') },
      reward_back: { color: 'blue', text: t('incomeTypes.reward_back') },
      task_withdraw: { color: 'purple', text: t('incomeTypes.task_withdraw' as any) },
    }
    const config = typeMap[type] || { color: 'default', text: type }
    return getBadgeClassName(config.color)
  }

  // 将 antd Tag 的 color 转换为 Badge 的样式类
  const getBadgeClassName = (color?: string) => {
    const colorMap: Record<string, string> = {
      orange: 'bg-orange-100 text-orange-800',
      green: 'bg-green-100 text-green-800',
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      red: 'bg-red-100 text-red-800',
      default: 'bg-gray-100 text-gray-800',
    }
    return colorMap[color || 'default'] || colorMap.default
  }

  // 获取提现状态显示
  const getWithdrawStatusTag = (status: WithdrawRecordStatus) => {
    const statusMap = {
      [WithdrawRecordStatus.WAIT]: { color: 'orange', text: t('withdrawStatus.wait'), icon: <ClockCircleOutlined /> },
      [WithdrawRecordStatus.SUCCESS]: { color: 'green', text: t('withdrawStatus.success'), icon: <CheckCircleOutlined /> },
      [WithdrawRecordStatus.FAIL]: { color: 'red', text: t('withdrawStatus.fail'), icon: <CloseCircleOutlined /> },
      [WithdrawRecordStatus.TASK_WITHDRAW]: { color: 'blue', text: t('withdrawStatus.task_withdraw' as any), icon: <DollarOutlined /> },
    }
    const config = statusMap[status] || { color: 'default', text: t('withdrawStatus.unknown') || 'Unknown', icon: null }
    return {
      className: getBadgeClassName(config.color),
      text: config.text,
      icon: config.icon,
    }
  }

  // 检查是否可以提现
  const canWithdraw = (record: IncomeRecord) => {
    // 仅 status = pending 且 type = task 的收入记录可提现
    return record.type === 'task' && (record.status === 'pending' || record.status === 0 || record.status === undefined)
  }

  useEffect(() => {
    if (!token) {
      toast.error(t('messages.pleaseLoginFirst'))
      router.push('/login')
      return
    }

    // 初始加载数据
    fetchIncomeRecords(1, 10)
    fetchWithdrawRecords(1, 10)
  }, [token, router])

  // 当筛选条件改变时重新获取数据
  useEffect(() => {
    if (token) {
      fetchIncomeRecords(1, incomePagination.pageSize)
    }
  }, [incomeFilters])

  return (
    <div className={styles.container}>
      {/* 页面头部 */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <DollarOutlined />
            </div>
            <div className={styles.headerText}>
              <h1 className={styles.headerTitle}>{t('title')}</h1>
              <p className={styles.headerSubtitle}>{t('subtitle')}</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.walletBlock}>
              <div className={styles.walletBlockTop}>

                <div className={styles.balanceInfo}>
                  <div className={styles.balanceAmount}>
                    USD
                    {' '}
                    {((userInfo?.income as number) / 100 || 0).toFixed(2)}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className={styles.walletButton}
                onClick={() => setWalletModalOpen(true)}
              >
                <WalletOutlined />
                &nbsp;
                {t('myWallet')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className={styles.content}>
        <Tabs defaultValue="income" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="income">
              <DollarOutlined />
              &nbsp;
              {t('incomeRecords')}
            </TabsTrigger>
            <TabsTrigger value="withdraw">
              <HistoryOutlined />
              &nbsp;
              {t('withdrawRecords')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="income" className="mt-4">
            {/* 筛选器 */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Label className="mb-2 block">{t('type')}</Label>
                  <select
                    value={incomeFilters.type || 'all'}
                    onChange={(e) => {
                      setIncomeFilters(prev => ({
                        ...prev,
                        type: e.target.value === 'all' ? undefined : e.target.value as any,
                      }))
                    }}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="all">{t('all') || 'All'}</option>
                    <option value="task">{t('incomeTypes.task')}</option>
                    <option value="task_back">{t('incomeTypes.task_back')}</option>
                    <option value="reward_back">{t('incomeTypes.reward_back')}</option>
                    <option value="task_withdraw">{t('incomeTypes.task_withdraw' as any)}</option>
                  </select>
                </div>
                <div className="flex-1">
                  <Label className="mb-2 block">{t('statusLabel')}</Label>
                  <select
                    value={incomeFilters.status || 'all'}
                    onChange={(e) => {
                      setIncomeFilters(prev => ({
                        ...prev,
                        status: e.target.value === 'all' ? undefined : e.target.value as any,
                      }))
                    }}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="all">{t('all') || 'All'}</option>
                    <option value="pending">{t('status.pending')}</option>
                    <option value="withdrawn">{t('status.withdrawn')}</option>
                  </select>
                </div>
            </div>

            <Spin spinning={incomeLoading}>
              {incomeRecords.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">{t('incomeId')}</TableHead>
                            <TableHead>{t('amount')}</TableHead>
                            <TableHead>{t('type')}</TableHead>
                            <TableHead>{t('statusLabel')}</TableHead>
                            <TableHead>{t('description')}</TableHead>
                            <TableHead>{t('createTime')}</TableHead>
                            <TableHead>{t('actions')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {incomeRecords.map((record) => (
                            <TableRow key={record._id || record.id}>
                              <TableCell className="font-mono text-xs">
                                <button
                                  type="button"
                                  onClick={() => fetchIncomeDetail(record._id || record.id)}
                                  className="text-primary hover:underline"
                                >
                                  {(record._id || record.id).slice(0, 8)}...
                                </button>
                              </TableCell>
                              <TableCell>
                                <span className="text-green-600 font-bold">
                                  {record.currency || 'CNY'}
                                  {' '}
                                  {(record.amount / 100).toFixed(2)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge className={getIncomeTypeText(record.type)}>
                                  {t(`incomeTypes.${record.type}` as any) || record.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {record.status === 'pending' || record.status === 0 || record.status === undefined
                                  ? (
                                      <Badge className={getBadgeClassName('orange')}>
                                        {t('status.pending')}
                                      </Badge>
                                    )
                                  : (
                                      <Badge className={getBadgeClassName('green')}>
                                        {t('status.withdrawn')}
                                      </Badge>
                                    )}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {record.desc || '-'}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(record.createdAt).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {canWithdraw(record) && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleWithdraw(record)}
                                  >
                                    {t('applyWithdraw')}
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="mt-4">
                      <Pagination
                        current={incomePagination.current}
                        pageSize={incomePagination.pageSize}
                        total={incomePagination.total}
                        onChange={(page, pageSize) => {
                          fetchIncomeRecords(page, pageSize || 10)
                        }}
                        onShowSizeChange={(current, size) => {
                          fetchIncomeRecords(current, size)
                        }}
                        showSizeChanger
                        showQuickJumper
                        showTotal={(total, range) => t('messages.totalRecords', { total })}
                        pageSizeOptions={['10', '20', '50']}
                      />
                  </div>
                </>
              ) : (
                <Empty description={incomeLoading ? t('messages.loading') : t('messages.noIncomeRecords')} />
              )}
            </Spin>
          </TabsContent>

          <TabsContent value="withdraw" className="mt-4">
            <Spin spinning={withdrawLoading}>
              {withdrawRecords.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">{t('withdrawId')}</TableHead>
                            <TableHead>{t('amount')}</TableHead>
                            <TableHead>{t('statusLabel')}</TableHead>
                            <TableHead>{t('description')}</TableHead>
                            <TableHead>{t('createTime')}</TableHead>
                            <TableHead>{t('updateTime')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {withdrawRecords.map((record) => {
                            const statusTag = getWithdrawStatusTag(record.status)
                            return (
                              <TableRow key={record._id || record.id}>
                                <TableCell className="font-mono text-xs">
                                  {(record._id || record.id).slice(0, 8)}...
                                </TableCell>
                                <TableCell>
                                  <span className="text-blue-600 font-bold">
                                    {(record as any).currency || 'CNY'}
                                    {' '}
                                    {(record.amount / 100).toFixed(2)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge className={statusTag.className}>
                                    {statusTag.icon}
                                    &nbsp;
                                    {statusTag.text}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate">
                                  {record.desc || '-'}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(record.createdAt).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(record.updatedAt).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="mt-4">
                      <Pagination
                        current={withdrawPagination.current}
                        pageSize={withdrawPagination.pageSize}
                        total={withdrawPagination.total}
                        onChange={(page, pageSize) => {
                          fetchWithdrawRecords(page, pageSize || 10)
                        }}
                        onShowSizeChange={(current, size) => {
                          fetchWithdrawRecords(current, size)
                        }}
                        showSizeChanger
                        showQuickJumper
                        showTotal={(total, range) => t('messages.totalRecords', { total })}
                        pageSizeOptions={['10', '20', '50']}
                      />
                  </div>
                </>
              ) : (
                <Empty description={withdrawLoading ? t('messages.loading') : t('messages.noWithdrawRecords')} />
              )}
            </Spin>
          </TabsContent>
        </Tabs>
      </div>

      {/* 提现确认弹窗 */}
      <Modal
        title={t('confirmWithdraw')}
        open={withdrawModalVisible}
        onCancel={() => {
          setWithdrawModalVisible(false)
          setSelectedIncomeRecord(null)
          setSelectedWalletAccountId('')
        }}
        onOk={handleConfirmWithdraw}
        okText={t('confirm')}
        cancelText={t('cancel')}
        confirmLoading={withdrawSubmitting}
        width={500}
      >
        {selectedIncomeRecord && (
          <div className={styles.withdrawModalContent}>
            <div className={styles.withdrawInfo}>
              <div className={styles.withdrawItem}>
                <span className={styles.withdrawLabel}>
                  {t('incomeId')}
                  :
                </span>
                <span className={styles.withdrawValue}>{selectedIncomeRecord._id || selectedIncomeRecord.id}</span>
              </div>
              <div className={styles.withdrawItem}>
                <span className={styles.withdrawLabel}>
                  {t('withdrawAmount')}
                  :
                </span>
                <span className={styles.withdrawAmount}>
                  {selectedIncomeRecord.currency || 'CNY'}
                  {' '}
                  {(selectedIncomeRecord.amount / 100).toFixed(2)}
                </span>
              </div>
              <div className={styles.withdrawItem}>
                <span className={styles.withdrawLabel}>
                  {t('incomeType')}
                  :
                </span>
                <Badge className={getIncomeTypeText(selectedIncomeRecord.type)}>
                  {t(`incomeTypes.${selectedIncomeRecord.type}` as any) || selectedIncomeRecord.type}
                </Badge>
              </div>
              {selectedIncomeRecord.desc && (
                <div className={styles.withdrawItem}>
                  <span className={styles.withdrawLabel}>
                    {t('description')}
                    :
                  </span>
                  <span className={styles.withdrawValue}>{selectedIncomeRecord.desc}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('myWallet')}</Label>
              <WalletAccountSelect
                value={selectedWalletAccountId}
                onChange={(val) => setSelectedWalletAccountId(val || '')}
              />
            </div>

            <div className={styles.withdrawWarning}>
              <p>{t('withdrawWarning')}</p>
              <p>{t('withdrawWarning2')}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* 收入详情弹窗 */}
      <Modal
        title={t('incomeDetail')}
        open={incomeDetailModalVisible}
        onCancel={() => {
          setIncomeDetailModalVisible(false)
          setIncomeDetail(null)
        }}
        footer={null}
        width={600}
      >
        <Spin spinning={incomeDetailLoading}>
          {incomeDetail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{t('incomeId')}</Label>
                  <p className="font-mono text-sm">{incomeDetail.id || incomeDetail._id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('amount')}</Label>
                  <p className="text-green-600 font-bold">
                    {incomeDetail.currency || 'CNY'}
                    {' '}
                    {(incomeDetail.amount / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('type')}</Label>
                  <Badge className={getIncomeTypeText(incomeDetail.type)}>
                    {t(`incomeTypes.${incomeDetail.type}` as any) || incomeDetail.type}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('statusLabel')}</Label>
                  {incomeDetail.status === 'pending' || incomeDetail.status === 0 || incomeDetail.status === undefined
                    ? (
                        <Badge className={getBadgeClassName('orange')}>
                          {t('status.pending')}
                        </Badge>
                      )
                    : (
                        <Badge className={getBadgeClassName('green')}>
                          {t('status.withdrawn')}
                        </Badge>
                      )}
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">{t('description')}</Label>
                  <p>{incomeDetail.desc || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('createTime')}</Label>
                  <p className="text-sm">{new Date(incomeDetail.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('updateTime')}</Label>
                  <p className="text-sm">{new Date(incomeDetail.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ) : !incomeDetailLoading && (
            <Empty description={t('messages.noIncomeDetail')} />
          )}
        </Spin>
      </Modal>

      {/* 钱包管理弹窗 */}
      <WalletModal
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />
    </div>
  )
}

