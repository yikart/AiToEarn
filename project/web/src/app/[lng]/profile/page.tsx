'use client'

import type { Order } from '@/api/types/payment'
import { CopyOutlined, CrownOutlined, DollarOutlined, EditOutlined, GiftFilled, GiftOutlined, HistoryOutlined, RocketOutlined, StarOutlined, ThunderboltOutlined, TrophyOutlined, UserOutlined, WalletOutlined } from '@ant-design/icons'

import { Button, Card, Descriptions, Form, Input, message, Modal, Select } from 'antd'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { getChatModels, putUserAiConfigItem } from '@/api/ai'
import { getPointsRecordsApi, getUserInfoApi, updateUserInfoApi } from '@/api/apiReq'
import { getOrderDetailApi } from '@/api/payment'
import { cancelAccountApi } from '@/api/signIn'
import { OrderStatus } from '@/api/types/payment'
import { createPaymentOrderApi, PaymentType as VipPaymentType } from '@/api/vip'
import { useTransClient } from '@/app/i18n/client'
import logoHesd from '@/assets/images/logo.png'
import plusvip from '@/assets/images/plusvip.png'
import PointsDetailModal from '@/components/modals/PointsDetailModal'
import PointsRechargeModal from '@/components/modals/PointsRechargeModal'
import VipContentModal from '@/components/modals/VipContentModal'

import { useUserStore } from '@/store/user'
import styles from './profile.module.css'

export default function ProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userInfo, setUserInfo, clearLoginStatus, token, lang } = useUserStore()
  const { t } = useTransClient('profile')
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()

  // Free trial modal state
  const [freeTrialModalVisible, setFreeTrialModalVisible] = useState(false)
  const [hasShownFreeTrial, setHasShownFreeTrial] = useState(false)

  // Account cancellation related state
  const [cancelModalVisible, setCancelModalVisible] = useState(false)
  const [cancelForm] = Form.useForm()
  const [cancelCode, setCancelCode] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)
  const [codeCountdown, setCodeCountdown] = useState(0)

  // Check if free trial prompt has been shown
  useEffect(() => {
    const hasShown = localStorage.getItem('freeTrialShown')
    if (hasShown) {
      setHasShownFreeTrial(true)
    }
  }, [])

  // removed URL-driven auto-open; now fully controlled by state

  // Order detail modal state
  const [orderDetailVisible, setOrderDetailVisible] = useState(false)
  const [orderDetailLoading, setOrderDetailLoading] = useState(false)
  const [currentOrderDetail, setCurrentOrderDetail] = useState<Order | null>(null)

  // Points records related state
  const [pointsRecords, setPointsRecords] = useState<any[]>([])
  const [pointsLoading, setPointsLoading] = useState(false)
  const [pointsPagination, setPointsPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  // Points recharge related state
  const [pointsRechargeVisible, setPointsRechargeVisible] = useState(false)
  const [rechargeAmount, setRechargeAmount] = useState(8)
  const [rechargeForm] = Form.useForm()
  const [isDragging, setIsDragging] = useState(false)
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null)
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
  const [pointsDetailVisible, setPointsDetailVisible] = useState(false)
  const [vipModalVisible, setVipModalVisible] = useState(false)

  // Default model selection related state
  const [chatModels, setChatModels] = useState<any[]>([])
  const [chatModelsLoading, setChatModelsLoading] = useState(false)
  const [defaultModel, setDefaultModel] = useState<string | undefined>('gpt-5')
  const [showModelDropdown, setShowModelDropdown] = useState(false)

  // Points record type definition
  interface PointsRecord {
    id: string
    userId: string
    amount: number
    balance: number
    type: string
    description: string
    metadata?: any
    createdAt?: string
  }

  // Helper function to determine VIP status
  const getVipStatusInfo = (status: string) => {
    switch (status) {
      case 'none':
        return { isVip: false, isMonthly: false, isYearly: false, isAutoRenew: false, isOnce: false }
      case 'trialing':
        return { isVip: true, isMonthly: false, isYearly: false, isAutoRenew: false, isOnce: false }
      case 'monthly_once':
        return { isVip: true, isMonthly: true, isYearly: false, isAutoRenew: false, isOnce: true }
      case 'yearly_once':
        return { isVip: true, isMonthly: false, isYearly: true, isAutoRenew: false, isOnce: true }
      case 'active_monthly':
        return { isVip: true, isMonthly: true, isYearly: false, isAutoRenew: true, isOnce: false }
      case 'active_yearly':
        return { isVip: true, isMonthly: false, isYearly: true, isAutoRenew: true, isOnce: false }
      case 'active_nonrenewing':
        return { isVip: true, isMonthly: false, isYearly: false, isAutoRenew: false, isOnce: false }
      case 'expired':
        return { isVip: false, isMonthly: false, isYearly: false, isAutoRenew: false, isOnce: false }
      default:
        return { isVip: false, isMonthly: false, isYearly: false, isAutoRenew: false, isOnce: false }
    }
  }

  // Get VIP status and expiration time
  const isVip = useMemo(() => {
    const vipInfo = userInfo?.vipInfo
    if (!vipInfo)
      return false

    const statusInfo = getVipStatusInfo(vipInfo.status)
    return statusInfo.isVip && vipInfo.expireTime && new Date(vipInfo.expireTime) > new Date()
  }, [userInfo])

  const vipExpireTime = userInfo?.vipInfo?.expireTime ? new Date(userInfo.vipInfo.expireTime).toLocaleDateString() : ''

  // Check if user has never been a VIP member
  const hasNeverBeenVip = !userInfo?.vipInfo || userInfo.vipInfo.status === 'none' || userInfo.vipInfo.status === 'expired'

  // Get VIP status display text
  const getVipStatusText = (status: string) => {
    const statusInfo = getVipStatusInfo(status)
    if (statusInfo.isYearly && statusInfo.isAutoRenew) {
      return t('yearlyMember')
    }
    else if (statusInfo.isYearly && !statusInfo.isAutoRenew) {
      return `${t('yearlyMember')} (${t('memberTypes.oneTime' as any)})`
    }
    else if (statusInfo.isMonthly && statusInfo.isAutoRenew) {
      return t('monthlyMember')
    }
    else if (statusInfo.isMonthly && !statusInfo.isAutoRenew) {
      return `${t('monthlyMember')} (${t('memberTypes.oneTime' as any)})`
    }
    else if (statusInfo.isOnce) {
      return statusInfo.isYearly ? `${t('yearlyMember')} (${t('memberTypes.oneTime' as any)})` : `${t('monthlyMember')} (${t('memberTypes.oneTime' as any)})`
    }
    else if (status === 'trialing') {
      return `${t('monthlyMember')} (${t('memberTypes.trial' as any)})`
    }
    else {
      return t('nonMember')
    }
  }

  const vipStatusText = getVipStatusText(userInfo?.vipInfo?.status || 'none')

  // VIP benefits data
  const vipBenefits = [
    { icon: <CrownOutlined />, name: t('vipBenefits.exclusiveBadge') },
    { icon: <TrophyOutlined />, name: t('vipBenefits.advancedFeatures') },
    { icon: <GiftOutlined />, name: t('vipBenefits.memberGift') },
    { icon: <StarOutlined />, name: t('vipBenefits.prioritySupport') },
    { icon: <DollarOutlined />, name: t('vipBenefits.discount') },
    { icon: <HistoryOutlined />, name: t('vipBenefits.unlimitedTime') },
    { icon: <ThunderboltOutlined />, name: t('vipBenefits.fastExperience') },
    { icon: <RocketOutlined />, name: t('vipBenefits.morePrivileges') },
  ]

  // Fetch user information
  const fetchUserInfo = async () => {
    try {
      const response: any = await getUserInfoApi()
      if (!response) {
        message.error(t('getUserInfoFailed'))
        return
      }

      if (response.code === 0 && response.data) {
        setUserInfo(response.data)
        // Echo default model (read from aiInfo.agent.defaultModel)
        try {
          const dm = (response.data as any)?.aiInfo?.agent?.defaultModel
          if (typeof dm === 'string' && dm) {
            setDefaultModel(dm)
          }
        }
        catch {}

        // Check if free trial prompt needs to be shown
        const hasVipInfo = response.data.vipInfo
        const isNeverVip = !hasVipInfo || hasVipInfo.status === 'none' || hasVipInfo.status === 'expired'
        if (isNeverVip && !hasShownFreeTrial) {
          // Delay showing modal to ensure page is loaded
          setTimeout(() => {
            setFreeTrialModalVisible(true)
            setHasShownFreeTrial(true)
          }, 2000) // Increase delay to let user see page content first
        }
      }
      else {
        message.error(response.message || t('getUserInfoFailed'))
      }
    }
    catch (error) {
      message.error(t('getUserInfoFailed'))
    }
    finally {
      setLoading(false)
    }
  }

  // Sync default model when user info updates (only when not currently selected)
  useEffect(() => {
    if (!defaultModel) {
      const dm = (userInfo as any)?.aiInfo?.agent?.defaultModel
      if (typeof dm === 'string' && dm) {
        setDefaultModel(dm)
      }
    }
  }, [userInfo])

  // Load chat models
  const fetchChatModels = async () => {
    setChatModelsLoading(true)
    try {
      const res = await getChatModels()
      if (res?.data && Array.isArray(res.data)) {
        setChatModels(res.data)
      }
    }
    catch (e) {
      // Ignore specific errors, only show prompt
      message.error(t('getUserInfoFailed'))
    }
    finally {
      setChatModelsLoading(false)
    }
  }

  // Fetch points records
  const fetchPointsRecords = async (params: { page: number, pageSize: number }) => {
    setPointsLoading(true)
    try {
      const response = await getPointsRecordsApi(params)
      if (response?.code === 0 && response.data) {
        const paginatedData = response.data
        setPointsRecords(paginatedData.list || [])
        setPointsPagination({
          current: params.page,
          pageSize: params.pageSize,
          total: paginatedData.total || 0,
        })
      }
      else {
        message.error(response?.message || t('messages.getPointsRecordsFailed' as any))
      }
    }
    catch (error) {
      message.error(t('messages.getPointsRecordsFailed' as any))
    }
    finally {
      setPointsLoading(false)
    }
  }

  // Fetch order details
  const fetchOrderDetail = async (orderId: string) => {
    setOrderDetailLoading(true)
    try {
      const response: any = await getOrderDetailApi(orderId)
      if (response?.code === 0 && response.data) {
        setCurrentOrderDetail(response.data[0])
        setOrderDetailVisible(true)
      }
      else {
        message.error(response?.message || t('getOrderDetailFailed'))
      }
    }
    catch (error) {
      message.error(t('getOrderDetailFailed'))
    }
    finally {
      setOrderDetailLoading(false)
    }
  }

  /**
   * Get account cancellation verification code
   */
  const handleGetCancelCode = async () => {
    try {
      const response = await cancelAccountApi.getCancelCode()
      console.log('Verification code response:', response)

      if (response && response.code === 0) {
        setCancelCode(response.data?.code || '')
        message.success(t('messages.verificationCodeSent' as any))
        // Start countdown
        setCodeCountdown(60)
      }
      else {
        message.error(response?.message || t('messages.getVerificationCodeFailed' as any))
      }
    }
    catch (error) {
      console.error('Get verification code error:', error)
      message.error(t('messages.getVerificationCodeFailed' as any))
    }
  }

  /**
   * Handle account cancellation
   */
  const handleCancelAccount = async () => {
    try {
      const values = await cancelForm.validateFields()
      setCancelLoading(true)

      console.log('Send cancellation request, verification code:', values.code)

      const response: any = await cancelAccountApi.cancelAccount({
        code: values.code,
      })

      if (response && response.code === 0) {
        message.success(t('messages.accountCancelledSuccess' as any))
        setCancelModalVisible(false)
        // Clear login status and redirect to login page
        clearLoginStatus()
        router.push('/login')
      }
    }
    catch (error) {

    }
    finally {
      setCancelLoading(false)
    }
  }

  /**
   * Open account cancellation confirmation modal
   */
  const handleOpenCancelModal = () => {
    setCancelModalVisible(true)
    cancelForm.resetFields()
    setCancelCode('')
    setCodeCountdown(0)
  }

  // Countdown effect
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (codeCountdown > 0) {
      timer = setTimeout(() => {
        setCodeCountdown(codeCountdown - 1)
      }, 1000)
    }
    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [codeCountdown])

  useEffect(() => {
    if (!token) {
      message.error(t('pleaseLoginFirst'))
      router.push('/login')
      return
    }
    fetchUserInfo()
    fetchChatModels()
  }, [token, router])

  // Clean up slider event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleSliderMouseMove)
      document.removeEventListener('mouseup', handleSliderMouseUp)
    }
  }, [])

  const handleLogout = () => {
    clearLoginStatus()
    message.success(t('logoutSuccess'))
    router.push('/login')
  }

  const handleUpdateName = async (values: { name: string }) => {
    try {
      const response: any = await updateUserInfoApi(values)
      if (!response) {
        message.error(t('updateFailed'))
        return
      }

      if (response.code === 0 && response.data) {
        fetchUserInfo()
        message.success(t('updateSuccess'))
        setIsModalOpen(false)
      }
      else {
        message.error(response.message || t('updateFailed'))
      }
    }
    catch (error) {
      message.error(t('updateFailed'))
    }
  }

  const handleGoToVipPage = () => {
    router.push('/vip')
  }

  // 处理免费会员弹框
  const handleFreeTrialModalOk = () => {
    setFreeTrialModalVisible(false)
    localStorage.setItem('freeTrialShown', 'true')
    setVipModalVisible(true)
  }

  const handleFreeTrialModalCancel = () => {
    setFreeTrialModalVisible(false)
    localStorage.setItem('freeTrialShown', 'true')
  }

  // Points related handler functions
  const handleGoToPublish = () => {
    router.push('/accounts')
    // Can add logic to trigger publish window here
  }

  const handleGoToVip = () => {
    router.push('/vip')
  }

  const handleRechargePoints = () => {
    setPointsRechargeVisible(true)
  }

  const handleRechargeSubmit = async (values: any) => {
    try {
      const response = await createPaymentOrderApi({
        returnTo: lang === 'zh-CN' ? 'https://aitoearn.ai/zh-CN/profile' : 'https://aitoearn.ai/en/profile',
        mode: 'payment',
        payment: VipPaymentType.POINTS,
        quantity: rechargeAmount, // Purchase quantity of 1000 points packages
        metadata: {
          userId: userInfo?.id || '',
        },
      })

      if (response?.code === 0 && response.data && typeof response.data === 'object' && 'url' in response.data) {
        // Save order ID
        if ('id' in response.data) {
          setPaymentOrderId((response.data as any).id)
          setShowPaymentSuccess(true)
        }
        // Redirect to payment page
        window.open((response.data as any).url, '_blank')
        // setPointsRechargeVisible(false);
        message.success(t('pointsPurchase.redirectingToPayment' as any))
      }
      else {
        message.error(response?.message || t('pointsPurchase.createOrderFailed' as any))
      }
    }
    catch (error) {
      message.error(t('pointsPurchase.createOrderFailed' as any))
    }
  }

  const handleRechargeCancel = () => {
    setPointsRechargeVisible(false)
    setPaymentOrderId(null)
    setShowPaymentSuccess(false)
  }

  // Handle "I have paid" button click
  const handlePaymentSuccess = async () => {
    if (!paymentOrderId)
      return

    try {
      const response = await getOrderDetailApi(paymentOrderId)
      if (response?.code === 0 && response.data) {
        const order = Array.isArray(response.data) ? response.data[0] : response.data
        // Check order status: 1=payment success, 2=waiting for payment, 3=refunded, 4=cancelled
        if (order.status === 1) {
          message.success(t('pointsPurchase.purchaseSuccess' as any))
          setShowPaymentSuccess(false)
          setPaymentOrderId(null)
          setPointsRechargeVisible(false)
          // Refresh user information
          fetchUserInfo()
        }
        else if (order.status === 2) {
          message.warning(t('pointsPurchase.paymentPending' as any))
        }
        else if (order.status === 3) {
          message.warning(t('pointsPurchase.orderRefunded' as any))
          setShowPaymentSuccess(false)
          setPaymentOrderId(null)
        }
        else if (order.status === 4) {
          message.warning(t('pointsPurchase.orderCancelled' as any))
          setShowPaymentSuccess(false)
          setPaymentOrderId(null)
        }
        else {
          message.warning(t('pointsPurchase.orderUnknown' as any))
        }
      }
      else {
        message.error(t('pointsPurchase.queryFailed' as any))
      }
    }
    catch (error) {
      message.error(t('pointsPurchase.queryFailed' as any))
    }
  }

  // Slider drag handling
  const handleSliderMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    document.addEventListener('mousemove', handleSliderMouseMove)
    document.addEventListener('mouseup', handleSliderMouseUp)
  }

  const handleSliderMouseMove = (e: MouseEvent) => {
    if (!isDragging)
      return

    const sliderTrack = document.querySelector(`.${styles.sliderTrack}`) as HTMLElement
    if (!sliderTrack)
      return

    const rect = sliderTrack.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const newAmount = Math.round(percentage * 49) + 1 // 1-50, only multiples of 1000
    setRechargeAmount(newAmount)
  }

  const handleSliderMouseUp = () => {
    setIsDragging(false)
    document.removeEventListener('mousemove', handleSliderMouseMove)
    document.removeEventListener('mouseup', handleSliderMouseUp)
  }

  const handleSliderClick = (e: React.MouseEvent) => {
    const sliderTrack = e.currentTarget as HTMLElement
    const rect = sliderTrack.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const newAmount = Math.round(percentage * 49) + 1 // 1-50
    setRechargeAmount(newAmount)
  }

  // Profile content rendering
  const renderProfileContent = () => (
    <div style={{}}>
      {/* Top header card */}

      {/* VIP badge (shown when user is VIP) */}
      {isVip && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 8,
          color: '#a66ae4',
          fontWeight: 700,
        }}
        >
          <Image src={plusvip} alt="VIP" className={styles.vipBadgeTop} />
          <span style={{ fontSize: 16 }}>{t('vipHonorText' as any)}</span>
        </div>
      )}

      <div className={styles.headerCard}>

        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div className={styles.avatar}>
            <Image src={logoHesd} alt="Logo" className={styles.logoHesd} />
          </div>
          <div className={styles.nameBlock}>
            <div className={styles.nameRow}>
              <span>{userInfo?.name || '-'}</span>
              <EditOutlined style={{ cursor: 'pointer', color: '#a66ae4' }} onClick={() => setIsModalOpen(true)} />
            </div>
            <div className={styles.subRow}>
              <span>{userInfo?.mail || '-'}</span>
            </div>

          </div>
        </div>

        <div className={styles.scoreRow}>

        </div>
      </div>

      {/* Dark stats card */}
      <div className={styles.statsCard}>
        <div className={styles.statsHeader}>
          <Image src={plusvip} alt="VIP" className={styles.vipBadge} />
          <span className={styles.statsTitle}>{t('stats.totalEarned' as any)}</span>
          <span className={styles.statsAmount}>{((userInfo as any)?.totalIncome as number / 100 || 0).toFixed(2)}</span>
          <span className={styles.statsCurrency}>{t('stats.currencyYuan' as any)}</span>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statsItem} onClick={() => router.push('/income')}>

            <div className={styles.statsLabel}>
              {t('stats.balance' as any)}
              {' '}
              <span className={styles.statsValue}>
                {' '}
                {(userInfo?.income as number / 100 || 0).toFixed(2)}
                {' '}
              </span>
              {' '}
              CNY
            </div>
          </div>
          <div className={styles.statsItem} style={{ cursor: 'pointer' }} onClick={() => setPointsDetailVisible(true)}>

            <div className={styles.statsLabel}>
              {t('stats.points' as any)}
              {' '}
              <span className={styles.statsValue}>
                {(Math.floor((userInfo?.score as number) || 0)).toFixed(1)}
                {' '}
              </span>
              {' '}
              {t('stats.points' as any)}
            </div>
          </div>

        </div>
      </div>

      <div className={styles.editCard}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span className={styles.scoreLabel}>{t('username')}</span>
          <div className={styles.fieldContainer}>
            <span className={styles.fieldInput}>{userInfo?.name || '-'}</span>
            <button className={styles.fieldButton} onClick={() => setIsModalOpen(true)}>{t('edit' as any)}</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span className={styles.scoreLabel}>{t('inviteCode' as any)}</span>
          <div className={styles.fieldContainer}>
            <span className={styles.fieldInput}>{userInfo?.popularizeCode || '-'}</span>
            <button
              className={styles.fieldButton}
              onClick={() => {
                const code = userInfo?.popularizeCode || ''
                if (!code)
                  return
                navigator.clipboard?.writeText(code).then(() => {
                  message.success(t('copySuccess' as any))
                }).catch(() => {
                  message.success(t('copySuccess' as any))
                })
              }}
            >
              {t('copy' as any)}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span className={styles.scoreLabel}>{t('defaultModel' as any)}</span>
          <div className={styles.fieldContainer}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ position: 'relative' }}>
                <button
                  disabled={chatModelsLoading}
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #E5E7EB',
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', flex: 1 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: 14 }}>AI</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {(() => {
                          const m: any = (chatModels || []).find((x: any) => x.name === defaultModel)
                          return m?.name || t('pleaseSelect' as any)
                        })()}
                      </div>
                      <div style={{ color: '#6B7280', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left', marginTop: 2 }}>
                        {(() => {
                          const m: any = (chatModels || []).find((x: any) => x.name === defaultModel)
                          return m?.description || ''
                        })()}
                      </div>
                    </div>
                  </div>
                  <span style={{ color: '#6B7280' }}>▾</span>
                </button>

                {showModelDropdown && (
                  <div style={{ position: 'absolute', zIndex: 20, top: '110%', left: 0, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                    <div style={{ maxHeight: 250, overflowY: 'auto', padding: 6 }}>
                      {(chatModels || []).map((m: any) => {
                        const isActive = defaultModel === m.name
                        return (
                          <div
                            key={m.name}
                            onClick={() => { setDefaultModel(m.name); setShowModelDropdown(false) }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '10px 10px',
                              borderRadius: 8,
                              cursor: 'pointer',
                              background: isActive ? '#F3E8FF' : 'transparent',
                            }}
                          >
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: 14 }}>AI</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{m.name || ''}</span>
                                {m?.mainTag ? <span style={{ fontSize: 10, background: '#EDE9FE', color: '#7C3AED', padding: '2px 6px', borderRadius: 10 }}>New</span> : null}
                              </div>
                              <div style={{ color: '#6B7280', fontSize: 12 }}>{m.description || ''}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                {(m?.tags || []).map((tag: string) => (
                                  <span key={tag} style={{ fontSize: 10, background: '#F3F4F6', color: '#6B7280', padding: '2px 6px', borderRadius: 10 }}>{tag}</span>
                                ))}
                              </div>
                              {m?.pricing
                                ? (
                                    <div style={{ color: '#374151', fontSize: 12, marginTop: 0 }}>
                                      <span>
                                        prompt
                                        {m.pricing.prompt}
                                      </span>
                                      {m.pricing.completion ? <span>{` · completion ${m.pricing.completion}`}</span> : null}
                                    </div>
                                  )
                                : null}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button
              className={styles.fieldButton}
              onClick={async () => {
                if (!defaultModel) {
                  message.warning(t('pleaseSelect' as any))
                  return
                }
                try {
                  const res = await putUserAiConfigItem({
                    type: 'agent',
                    value: {
                      defaultModel,
                      option: {},
                    },
                  })
                  if (res && res.code === 0) {
                    message.success(t('updateSuccess'))
                    fetchUserInfo()
                  }
                  else {
                    message.error(res?.message || t('updateFailed'))
                  }
                }
                catch (e) {
                  message.error(t('updateFailed'))
                }
              }}
            >
              {t('save' as any)}
            </button>
          </div>
        </div>
      </div>

      {/* Account status (shown only when abnormal) */}
      {userInfo?.status !== 1 && (
        <div style={{
          marginTop: 18,
          marginBottom: 18,
          color: '#ef4444',
          fontSize: 14,
        }}
        >
          {t('accountStatus')}
          :
          {t('disabled')}
        </div>
      )}

      {/* Bottom account cancellation button */}
      {/* <div style={{ textAlign: 'center', paddingTop: 24, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:"flex-start"  }}>
        <div style={{ display:'flex', flexDirection:'column', justifyContent:'space-between', alignItems:"flex-start", marginBottom: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#54687B' }}>{t('deleteAccount.title' as any)}</div>
          <div>{t('deleteAccount.desc' as any)}</div>
        </div>
        <Button danger onClick={handleOpenCancelModal}>{t('deleteAccount.apply' as any)}</Button>
      </div> */}
    </div>
  )

  if (loading) {
    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.profileContent}>
        {renderProfileContent()}
      </div>

      <Modal
        title={t('modifyUsername')}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleUpdateName}
          initialValues={{ name: userInfo?.name }}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label={t('username')}
            rules={[
              { required: true, message: t('pleaseEnterUsername') },
              { min: 2, message: t('usernameLengthMin') },
              { max: 20, message: t('usernameLengthMax') },
            ]}
          >
            <Input placeholder={t('pleaseEnterUsername')} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {t('confirmModify')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 订单详情弹窗 */}
      <Modal
        title={t('orderDetails')}
        open={orderDetailVisible}
        onCancel={() => setOrderDetailVisible(false)}
        className={styles.orderDetailModal}
        footer={[
          <Button key="close" onClick={() => setOrderDetailVisible(false)}>
            {t('close')}
          </Button>,
          currentOrderDetail?.url && currentOrderDetail?.status === OrderStatus.OPEN && (
            <Button
              key="pay"
              type="primary"
              onClick={() => {
                if (currentOrderDetail?.url) {
                  window.open(currentOrderDetail.url, '_blank')
                }
              }}
            >
              {t('goToPayment')}
            </Button>
          ),
        ]}
        width={600}
        loading={orderDetailLoading}
      >
        {currentOrderDetail && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label={t('orderId')}>{currentOrderDetail.id}</Descriptions.Item>
            <Descriptions.Item label={t('internalId')}>{currentOrderDetail._id}</Descriptions.Item>
            <Descriptions.Item label={t('packageType')}>
              {currentOrderDetail.metadata?.payment || t('unknown')}
            </Descriptions.Item>
            <Descriptions.Item label={t('subscriptionMode')}>{currentOrderDetail.mode}</Descriptions.Item>
            <Descriptions.Item label={t('amount')}>
              {(() => {
                const displayAmount = (currentOrderDetail.amount / 100).toFixed(2)
                const symbol = currentOrderDetail.currency === 'usd'
                  ? '$'
                  : currentOrderDetail.currency === 'cny'
                    ? '¥'
                    : currentOrderDetail.currency?.toUpperCase()
                return `${symbol}${displayAmount}`
              })()}
            </Descriptions.Item>
            <Descriptions.Item label={t('refundedAmount')}>
              {(() => {
                const displayAmount = (currentOrderDetail.amount_refunded / 100).toFixed(2)
                const symbol = currentOrderDetail.currency === 'usd'
                  ? '$'
                  : currentOrderDetail.currency === 'cny'
                    ? '¥'
                    : currentOrderDetail.currency?.toUpperCase()
                return `${symbol}${displayAmount}`
              })()}
            </Descriptions.Item>
            <Descriptions.Item label={t('status')}>
              {(() => {
                const statusMap = {
                  [OrderStatus.COMPLETE]: { color: 'green', text: t('paymentSuccess') },
                  [OrderStatus.OPEN]: { color: 'orange', text: t('waitingForPayment') },
                  [OrderStatus.EXPIRED]: { color: 'red', text: t('orderExpired' as any) },
                }
                const config = statusMap[currentOrderDetail.status] || { color: 'default', text: `状态${currentOrderDetail.status}` }
                return <span style={{ color: config.color, fontWeight: 'bold' }}>{config.text}</span>
              })()}
            </Descriptions.Item>
            <Descriptions.Item label={t('createTime')}>
              {new Date(currentOrderDetail.created * 1000).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label={t('expireTime')}>
              {new Date(currentOrderDetail.expires_at * 1000).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label={t('userId')}>{currentOrderDetail.userId}</Descriptions.Item>
            <Descriptions.Item label={t('messages.priceId' as any)}>{currentOrderDetail.price}</Descriptions.Item>
            {currentOrderDetail.payment_intent && (
              <Descriptions.Item label={t('paymentIntent')}>{currentOrderDetail.payment_intent}</Descriptions.Item>
            )}
            {currentOrderDetail.subscription && (
              <Descriptions.Item label={t('subscriptionId')}>{currentOrderDetail.subscription}</Descriptions.Item>
            )}
            {/* <Descriptions.Item label="成功页面">{currentOrderDetail.success_url}</Descriptions.Item> */}
            {currentOrderDetail.url && (
              <Descriptions.Item label={t('paymentLink')}>
                <Button
                  type="link"
                  size="small"
                  onClick={() => window.open(currentOrderDetail.url, '_blank')}
                >
                  {t('openPaymentPage')}
                </Button>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* 免费会员提示弹框 */}
      <Modal
        title={(
          <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', color: '#C026D2' }}>
            {t('freeTrial.title')}
          </div>
        )}
        open={freeTrialModalVisible}
        onOk={handleFreeTrialModalOk}
        onCancel={handleFreeTrialModalCancel}
        okText={t('freeTrial.claimNow')}
        cancelText={t('freeTrial.later')}
        okButtonProps={{
          style: {
            backgroundColor: '#C026D2',
            borderColor: '#C026D2',
            borderRadius: '8px',
            fontWeight: '600',
          },
        }}
        cancelButtonProps={{
          style: {
            borderRadius: '8px',
            fontWeight: '600',
          },
        }}
        width={500}
        centered
        maskClosable={false}
        closable={false}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👑</div>
          <h3 style={{ color: '#1f2937', marginBottom: '12px', fontSize: '16px' }}>
            {t('freeTrial.congratulations')}
          </h3>
          <p style={{ color: '#6b7280', lineHeight: '1.6', marginBottom: '20px' }}>
            {t('freeTrial.description')}
          </p>
          <div style={{
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            border: '1px solid #e2e8f0',
          }}
          >
            <div style={{ display: 'flex', flex: 1, justifyContent: 'flex-start', marginBottom: '8px' }}>
              <span style={{ color: '#374151', fontSize: '14px', paddingRight: 9 }}>{t('freeTrial.unlimitedAI')}</span>
              <span style={{ color: '#374151', fontSize: '14px', paddingLeft: 9 }}>{t('freeTrial.priorityProcessing')}</span>
            </div>
            <div style={{ display: 'flex', flex: 1, justifyContent: 'flex-start', marginBottom: '8px' }}>
              <span style={{ color: '#374151', fontSize: '14px', paddingRight: 9 }}>{t('freeTrial.advancedModels')}</span>
              <span style={{ color: '#374151', fontSize: '14px', paddingLeft: 9 }}>{t('freeTrial.dedicatedSupport')}</span>
            </div>

          </div>
          <p style={{ color: '#C026D2', fontSize: '14px', fontWeight: '600' }}>
            {t('freeTrial.completelyFree')}
          </p>
        </div>
      </Modal>

      {/* 积分充值弹窗（复用组件） */}
      <PointsRechargeModal open={pointsRechargeVisible} onClose={handleRechargeCancel} />
      <PointsDetailModal open={pointsDetailVisible} onClose={() => setPointsDetailVisible(false)} />
      <VipContentModal open={vipModalVisible} onClose={() => setVipModalVisible(false)} />

      {/* 注销账户确认弹窗 */}
      <Modal
        title={t('cancelAccount' as any)}
        open={cancelModalVisible}
        onCancel={() => setCancelModalVisible(false)}
        footer={null}
        width={500}
        centered
      >
        <div style={{ paddingTop: '20px' }}>
          <div style={{ marginBottom: '20px', color: '#666', lineHeight: '1.6' }}>
            <p>{t('cancelAccountWarning' as any)}</p>
            <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
              {(t('cancelAccountDataList' as any) as string).split(',').map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{t('cancelAccountCaution' as any)}</p>
            <p style={{ color: '#1890ff', fontSize: '14px' }}>{t('cancelAccountSecurity' as any)}</p>
          </div>

          <Form
            form={cancelForm}
            layout="vertical"
            onFinish={handleCancelAccount}
          >
            <Form.Item
              label={t('verificationCode' as any)}
              name="code"
              rules={[{ required: true, message: t('pleaseEnterVerificationCode' as any) }]}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <Input placeholder={t('pleaseEnterVerificationCode' as any)} />
                <Button
                  onClick={handleGetCancelCode}
                  disabled={codeCountdown > 0}
                  loading={codeCountdown > 0}
                >
                  {codeCountdown > 0 ? `${codeCountdown}${t('resendAfter' as any)}` : t('getVerificationCode' as any)}
                </Button>
              </div>
            </Form.Item>

            <Form.Item>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button onClick={() => setCancelModalVisible(false)}>
                  {t('cancel')}
                </Button>
                <Button
                  type="primary"
                  danger
                  htmlType="submit"
                  loading={cancelLoading}
                >
                  {t('confirmCancel' as any)}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  )
}
