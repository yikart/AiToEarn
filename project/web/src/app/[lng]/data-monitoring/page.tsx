'use client'

import { EyeOutlined, LinkOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Badge, Button, Card, Empty, Input, Pagination, Select, Spin, Tabs, Tag } from 'antd'
import { toast } from '@/lib/toast'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import {
  apiAddNoteMonitoring,
  apiGetNoteMonitoringList,
  type NoteMonitoringListItem,
} from '@/api/monitoring'
import { AccountPlatInfoMap, PlatType } from '@/app/config/platConfig'
import LoginModal from '@/components/LoginModal'
import http from '@/utils/request'
import { urlReg } from '@/utils/regulars'
import styles from './dataMonitoring.module.scss'

// Supported platforms for monitoring
const SUPPORTED_PLATFORMS = [
  PlatType.Tiktok,
  PlatType.BILIBILI,
  PlatType.Douyin,
  PlatType.Facebook,
  PlatType.Instagram,
  PlatType.Xhs,
  PlatType.KWAI,
  PlatType.YouTube,
  PlatType.Twitter,
]

export default function DataMonitoringPage() {
  const { t } = useTransClient('dataMonitoring')
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'link' | 'account'>('link')
  const [loading, setLoading] = useState(false)
  const [monitoringList, setMonitoringList] = useState<NoteMonitoringListItem[]>([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [selectedPlatform, setSelectedPlatform] = useState<PlatType>(PlatType.Xhs)
  const [filterPlatform, setFilterPlatform] = useState<PlatType | 'all'>('all')
  const [noteLink, setNoteLink] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  // Load monitoring list
  const loadMonitoringList = async (page: number = 1, platform?: string) => {
    setLoading(true)
    try {
      const params: any = { page, pageSize: 20 }
      if (platform && platform !== 'all') {
        params.platform = platform
      }
      const data = await apiGetNoteMonitoringList(params)
      setMonitoringList(data.items)
      setPagination({
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
        totalPages: data.totalPages,
      })
    }
    catch (error: any) {
      toast.error(error.message || t('error.loadFailed'))
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'link') {
      loadMonitoringList(1, filterPlatform === 'all' ? undefined : filterPlatform)
    }
  }, [activeTab, filterPlatform])

  // Handle pagination change
  const handlePageChange = (page: number) => {
    loadMonitoringList(page, filterPlatform === 'all' ? undefined : filterPlatform)
  }

  // Add note monitoring
  const handleAddNote = async () => {
    if (!noteLink.trim()) {
      toast.warning(t('addModal.linkRequired'))
      return
    }

    // 验证链接格式
    const trimmedLink = noteLink.trim()
    // 检查是否是有效的 URL
    // 1. 以 http:// 或 https:// 开头
    // 2. 或者是有效的域名格式（包含点号，如 example.com）
    const hasProtocol = /^https?:\/\//i.test(trimmedLink)
    const hasDomain = /^([\da-z\.-]+)\.([a-z\.]{2,6})/i.test(trimmedLink)
    const isValidUrl = urlReg.test(trimmedLink) || (hasProtocol && hasDomain)
    
    if (!isValidUrl) {
      toast.warning('请输入有效的链接地址（例如：https://example.com 或 example.com）')
      return
    }

    setAddLoading(true)
    try {
      // 使用 silent 参数避免自动显示错误提示，手动处理 401
      const response = await http.post('statistics/posts/monitor/create', {
        link: noteLink,
        platform: selectedPlatform,
      }, true) // silent = true
      
      // 检查响应 code
      if (response && response.code === 0) {
        toast.success(t('addModal.addSuccess'))
        setNoteLink('')
        loadMonitoringList(1, filterPlatform === 'all' ? undefined : filterPlatform)
      } else if (response && response.code === 401) {
        router.push('/auth/login')
      } else if (response) {
        // 其他错误
        toast.error(response.message || t('error.addFailed'))
      } else {
        toast.error(t('error.addFailed'))
      }
    }
    catch (error: any) {
      toast.error(error?.message || t('error.addFailed'))
    }
    finally {
      setAddLoading(false)
    }
  }

  // Handle login success - reload the list
  const handleLoginSuccess = () => {
    // 登录成功后，重新尝试添加监控
    if (noteLink.trim()) {
      handleAddNote()
    } else {
      // 如果没有待添加的链接，重新加载列表
      loadMonitoringList(1, filterPlatform === 'all' ? undefined : filterPlatform)
    }
  }

  // 查看监控详情
  const handleViewDetail = (item: NoteMonitoringListItem) => {
    router.push(`/data-monitoring/${item._id}`)
  }

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string }> = {
      pending: { color: 'default' },
      processing: { color: 'processing' },
      completed: { color: 'success' },
      success: { color: 'success' },
      failed: { color: 'error' },
    }
    const statusInfo = statusMap[status] || statusMap.pending
    return <Tag color={statusInfo.color}>{t(`status.${status}` as any)}</Tag>
  }

  const tabItems = [
    {
      key: 'link',
      label: (
        <span>
          <LinkOutlined />
          {t('tabs.byLink')}
        </span>
      ),
    },
  ]

  return (
    <div className={styles.dataMonitoringPage}>
      {/* 页面标题 */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>{t('title')}</h1>
          <p className={styles.pageDesc}>{t('description')}</p>
        </div>
      </div>

      {/* 选项卡 */}
      <Card className={styles.tabsCard}>
        <Tabs
          activeKey={activeTab}
          onChange={key => setActiveTab(key as 'link' | 'account')}
          items={tabItems}
          className={styles.monitoringTabs}
        />

        <div className={styles.tabContent}>
          {/* By note link */}
          {activeTab === 'link' && (
            <div className={styles.linkMonitoring}>
              {/* Add note form */}
              <div className={styles.addFormSection}>
                <Card className={styles.addFormCard}>
                  <div className={styles.addForm}>
                    <div className={styles.platformSelect}>
                      <Select
                        value={selectedPlatform}
                        onChange={setSelectedPlatform}
                        style={{ width: 180 }}
                        size="large"
                        className={styles.platformSelectInput}
                      >
                        {SUPPORTED_PLATFORMS.map(platform => {
                          const platInfo = AccountPlatInfoMap.get(platform)
                          if (!platInfo) return null
                          const iconSrc = typeof platInfo.icon === 'string' 
                            ? platInfo.icon 
                            : (platInfo.icon as any)?.src || String(platInfo.icon)
                          return (
                            <Select.Option key={platform} value={platform}>
                              <div className={styles.platformOption}>
                                <img
                                  src={iconSrc}
                                  alt={platInfo.name}
                                  width={20}
                                  height={20}
                                  style={{ marginRight: 8, objectFit: 'contain' }}
                                />
                                <span>{platInfo.name}</span>
                              </div>
                            </Select.Option>
                          )
                        })}
                      </Select>
                    </div>
                    <Input
                      placeholder={t('addModal.linkPlaceholder')}
                      value={noteLink}
                      onChange={e => setNoteLink(e.target.value)}
                      onPressEnter={handleAddNote}
                      prefix={<LinkOutlined />}
                      size="large"
                      className={styles.linkInput}
                    />
                    <Button
                      type="primary"
                      onClick={handleAddNote}
                      loading={addLoading}
                      size="large"
                      className={styles.addButton}
                    >
                      {t('actions.add')}
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Filter section */}
              <div className={styles.filterSection}>
                <Card className={styles.filterCard}>
                  <div className={styles.filterContent}>
                    <span className={styles.filterLabel}>{t('list.filterByPlatform' as any)}:</span>
                    <Select
                      value={filterPlatform}
                      onChange={(value) => setFilterPlatform(value)}
                      style={{ width: 200 }}
                      size="large"
                      className={styles.filterSelect}
                    >
                      <Select.Option value="all">{t('list.allPlatforms' as any)}</Select.Option>
                      {SUPPORTED_PLATFORMS.map(platform => {
                        const platInfo = AccountPlatInfoMap.get(platform)
                        if (!platInfo) return null
                        const iconSrc = typeof platInfo.icon === 'string' 
                          ? platInfo.icon 
                          : (platInfo.icon as any)?.src || String(platInfo.icon)
                        return (
                          <Select.Option key={platform} value={platform}>
                            <div className={styles.platformOption}>
                              <img
                                src={iconSrc}
                                alt={platInfo.name}
                                width={20}
                                height={20}
                                style={{ marginRight: 8, objectFit: 'contain' }}
                              />
                              <span>{platInfo.name}</span>
                            </div>
                          </Select.Option>
                        )
                      })}
                    </Select>
                  </div>
                </Card>
              </div>

              {/* Monitoring list */}
              {loading ? (
                <div className={styles.loading}>
                  <Spin size="large" />
                </div>
              ) : monitoringList.length > 0 ? (
                <>
                  <div className={styles.monitoringList}>
                    {monitoringList.map(item => (
                      <Card
                        key={item._id}
                        className={styles.monitoringCard}
                        hoverable
                        actions={[
                          <Button
                            key="view"
                            type="link"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetail(item)}
                          >
                            {t('actions.viewDetail')}
                          </Button>,
                        ]}
                      >
                        <div className={styles.cardHeader}>
                          <div className={styles.cardHeaderLeft}>
                            {item.postDetail?.author && (
                              <div className={styles.authorInfo}>
                                <Avatar
                                  src={item.postDetail.avatar}
                                  size={32}
                                  className={styles.authorAvatar}
                                >
                                  {item.postDetail.author.charAt(0)}
                                </Avatar>
                                <span className={styles.authorName}>{item.postDetail.author}</span>
                              </div>
                            )}
                            <h4 className={styles.noteTitle}>
                              {item.postDetail?.title || item.link}
                            </h4>
                          </div>
                          <div className={styles.headerRight} style={{ marginRight: '0' }}>
                            {getStatusTag(item.status)}
                            <Badge
                              status={item.enabled ? 'success' : 'default'}
                              text={item.enabled ? t('status.enabled') : t('status.disabled')}
                            />
                          </div>
                        </div>
                        {item.error && (
                          <div className={styles.errorMessage}>
                            <Tag color="error">{t('list.error')}: {item.error}</Tag>
                          </div>
                        )}
                        <div className={`${styles.cardFooter} ${!item.error ? styles.cardFooterNoError : ''}`}>
                          <span className={styles.createTime}>
                            {t('list.createdAt')}: {new Date(item.createdAt).toLocaleString('zh-CN')}
                          </span>
                          <span className={styles.updateTime}>
                            {t('list.updatedAt')}: {new Date(item.updatedAt).toLocaleString('zh-CN')}
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                  {/* 分页 */}
                  <div className={styles.paginationWrapper}>
                    <Pagination
                      current={pagination.page}
                      pageSize={pagination.pageSize}
                      total={pagination.total}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                      showTotal={total => t('list.totalRecords', { count: total })}
                    />
                  </div>
                </>
              ) : (
                <Empty
                  description={t('list.empty')}
                  className={styles.empty}
                />
              )}
            </div>
          )}

          {/* By account - not yet available */}
          {activeTab === 'account' && (
            <div className={styles.accountMonitoring}>
              <div className={styles.addSection}>
                <div className={styles.addCard}>
                  <UserOutlined className={styles.addIcon} />
                  <h3 className={styles.addTitle}>{t('tabs.byAccount')}</h3>
                  <Button
                    type="primary"
                    disabled
                    className={styles.addButton}
                  >
                    {t('actions.comingSoon')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

