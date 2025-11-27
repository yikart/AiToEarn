'use client'

import { EyeOutlined, LinkOutlined, UserOutlined } from '@ant-design/icons'
import { Badge, Button, Card, Empty, Input, message, Modal, Pagination, Spin, Tabs, Tag } from 'antd'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import {
  apiAddNoteMonitoring,
  apiGetNoteMonitoringList,
  type NoteMonitoringListItem,
} from '@/api/monitoring'
import styles from './dataMonitoring.module.scss'

export default function DataMonitoringPage() {
  const { t } = useTransClient('dataMonitoring')
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'link' | 'account'>('link')
  const [loading, setLoading] = useState(false)
  const [monitoringList, setMonitoringList] = useState<NoteMonitoringListItem[]>([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [noteLink, setNoteLink] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  // 加载监控列表
  const loadMonitoringList = async (page: number = 1) => {
    setLoading(true)
    try {
      const data = await apiGetNoteMonitoringList({ platform: 'xhs', page, pageSize: 20 })
      setMonitoringList(data.items)
      setPagination({
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
        totalPages: data.totalPages,
      })
    }
    catch (error: any) {
      message.error(error.message || t('error.loadFailed'))
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'link') {
      loadMonitoringList(1)
    }
  }, [activeTab])

  // 分页变化
  const handlePageChange = (page: number) => {
    loadMonitoringList(page)
  }

  // 添加笔记监控
  const handleAddNote = async () => {
    if (!noteLink.trim()) {
      message.warning(t('addModal.linkRequired'))
      return
    }

    setAddLoading(true)
    try {
      await apiAddNoteMonitoring({ link: noteLink, platform: 'xhs' })
      message.success(t('addModal.addSuccess'))
      setAddModalVisible(false)
      setNoteLink('')
      loadMonitoringList(1)
    }
    catch (error: any) {
      message.error(error.message || t('error.addFailed'))
    }
    finally {
      setAddLoading(false)
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
          {/* 按笔记链接 */}
          {activeTab === 'link' && (
            <div className={styles.linkMonitoring}>
              <div className={styles.addSection}>
                <div className={styles.addCard}>
                  <LinkOutlined className={styles.addIcon} />
                  <h3 className={styles.addTitle}>{t('tabs.byLink')}</h3>
                  <Button
                    type="primary"
                    onClick={() => setAddModalVisible(true)}
                    className={styles.addButton}
                  >
                    {t('actions.add')}
                  </Button>
                </div>
              </div>

              {/* 监控列表 */}
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
                          <h4 className={styles.noteTitle}>
                            {item.link}
                          </h4>
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
                        <div className={styles.cardFooter}>
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

          {/* 按小红书账号 - 暂未开放 */}
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

      {/* 添加笔记链接弹窗 */}
      <Modal
        title={t('addModal.title')}
        open={addModalVisible}
        onOk={handleAddNote}
        onCancel={() => {
          setAddModalVisible(false)
          setNoteLink('')
        }}
        confirmLoading={addLoading}
        okText={t('addModal.confirm')}
        cancelText={t('addModal.cancel')}
      >
        <div className={styles.addModalContent}>
          <p className={styles.modalDesc}>{t('addModal.inputPlaceholder')}</p>
          <Input
            placeholder={t('addModal.linkPlaceholder')}
            value={noteLink}
            onChange={e => setNoteLink(e.target.value)}
            prefix={<LinkOutlined />}
            size="large"
          />
        </div>
      </Modal>
    </div>
  )
}

