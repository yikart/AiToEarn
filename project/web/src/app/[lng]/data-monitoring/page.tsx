'use client'

import { EyeOutlined, LinkOutlined, UserOutlined } from '@ant-design/icons'
import { Badge, Button, Card, Empty, Image, Input, message, Modal, Spin, Tabs, Tag } from 'antd'
import { useEffect, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import {
  apiAddNoteMonitoring,
  apiGetNoteMonitoringDetail,
  apiGetNoteMonitoringList,
  type NoteMonitoringItem,
} from '@/api/monitoring'
import styles from './dataMonitoring.module.scss'

export default function DataMonitoringPage() {
  const { t } = useTransClient('dataMonitoring')
  const [activeTab, setActiveTab] = useState<'link' | 'account'>('link')
  const [loading, setLoading] = useState(false)
  const [monitoringList, setMonitoringList] = useState<NoteMonitoringItem[]>([])
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [noteLink, setNoteLink] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [currentDetail, setCurrentDetail] = useState<NoteMonitoringItem | null>(null)

  // 加载监控列表
  const loadMonitoringList = async () => {
    setLoading(true)
    try {
      const data = await apiGetNoteMonitoringList({ platform: 'xhs' })
      setMonitoringList(data)
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
      loadMonitoringList()
    }
  }, [activeTab])

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
      loadMonitoringList()
    }
    catch (error: any) {
      message.error(error.message || t('error.addFailed'))
    }
    finally {
      setAddLoading(false)
    }
  }

  // 查看监控详情
  const handleViewDetail = async (item: NoteMonitoringItem) => {
    setDetailLoading(true)
    setDetailModalVisible(true)
    try {
      const detail = await apiGetNoteMonitoringDetail(item._id)
      setCurrentDetail(detail)
    }
    catch (error: any) {
      message.error(error.message || t('error.getDetailFailed'))
      setDetailModalVisible(false)
    }
    finally {
      setDetailLoading(false)
    }
  }

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'default', text: t('status.pending') },
      processing: { color: 'processing', text: t('status.processing') },
      completed: { color: 'success', text: t('status.completed') },
      failed: { color: 'error', text: t('status.failed') },
    }
    const statusInfo = statusMap[status] || statusMap.pending
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
  }

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}万`
    }
    return num.toLocaleString()
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
                <div className={styles.monitoringList}>
                  {monitoringList.map(item => (
                    <Card
                      key={item._id}
                      className={styles.monitoringCard}
                      hoverable
                      cover={
                        item.postDetail?.cover ? (
                          <div className={styles.coverWrapper}>
                            <Image
                              alt={item.postDetail?.title || t('list.untitled')}
                              src={item.postDetail.cover}
                              preview={false}
                              className={styles.coverImage}
                            />
                          </div>
                        ) : null
                      }
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
                          {item.postDetail?.title || item.postDetail?.desc || t('list.untitled')}
                        </h4>
                        <div className={styles.headerRight}>
                          {getStatusTag(item.status)}
                          <Badge
                            status={item.enabled ? 'success' : 'default'}
                            text={item.enabled ? t('status.enabled') : t('status.disabled')}
                          />
                        </div>
                      </div>
                      <div className={styles.cardStats}>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>{t('stats.views')}</span>
                          <span className={styles.statValue}>
                            {formatNumber(item.postDetail?.readCount || 0)}
                          </span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>{t('stats.likes')}</span>
                          <span className={styles.statValue}>
                            {formatNumber(item.postDetail?.likeCount || 0)}
                          </span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>{t('stats.comments')}</span>
                          <span className={styles.statValue}>
                            {formatNumber(item.postDetail?.commentCount || 0)}
                          </span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>{t('stats.favorites')}</span>
                          <span className={styles.statValue}>
                            {formatNumber(item.postDetail?.collectCount || 0)}
                          </span>
                        </div>
                      </div>
                      <div className={styles.cardFooter}>
                        <span className={styles.createTime}>
                          {t('list.createdAt')}: {new Date(item.createdAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
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

      {/* 详情弹窗 */}
      <Modal
        title={t('detail.postInfo')}
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false)
          setCurrentDetail(null)
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            {t('addModal.cancel')}
          </Button>,
          currentDetail?.link && (
            <Button
              key="view"
              type="primary"
              onClick={() => window.open(currentDetail.link, '_blank')}
            >
              {t('detail.viewNote')}
            </Button>
          ),
        ]}
        width={800}
      >
        {detailLoading ? (
          <div className={styles.detailLoading}>
            <Spin size="large" />
          </div>
        ) : currentDetail ? (
          <div className={styles.detailContent}>
            {/* 笔记基本信息 */}
            <div className={styles.postInfo}>
              <h3>{currentDetail.postDetail?.title || currentDetail.postDetail?.desc || t('list.untitled')}</h3>
              <p className={styles.desc}>{currentDetail.postDetail?.desc}</p>
              <div className={styles.metaInfo}>
                <span>{t('detail.publishTime')}: {new Date(currentDetail.postDetail?.publishTime || 0).toLocaleString('zh-CN')}</span>
                <span>{t('list.createdAt')}: {new Date(currentDetail.createdAt).toLocaleString('zh-CN')}</span>
                {currentDetail.error && (
                  <Tag color="error">错误: {currentDetail.error}</Tag>
                )}
              </div>
            </div>

            {/* 媒体预览 */}
            {currentDetail.uploadMediaList && currentDetail.uploadMediaList.length > 0 && (
              <div className={styles.mediaSection}>
                <h4>{t('detail.mediaPreview')}</h4>
                <div className={styles.mediaList}>
                  <Image.PreviewGroup>
                    {currentDetail.uploadMediaList.map((media, index) => (
                      <Image
                        key={index}
                        src={media.url}
                        alt={`media-${index}`}
                        width={150}
                        height={150}
                        style={{ objectFit: 'cover', marginRight: 8 }}
                      />
                    ))}
                  </Image.PreviewGroup>
                </div>
              </div>
            )}

            {/* 数据统计 */}
            <div className={styles.statsSection}>
              <h4>{t('stats.views')}: {formatNumber(currentDetail.postDetail?.readCount || 0)}</h4>
              <div className={styles.statsGrid}>
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>{t('stats.likes')}</div>
                  <div className={styles.statNumber}>{formatNumber(currentDetail.postDetail?.likeCount || 0)}</div>
                </div>
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>{t('stats.comments')}</div>
                  <div className={styles.statNumber}>{formatNumber(currentDetail.postDetail?.commentCount || 0)}</div>
                </div>
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>{t('stats.favorites')}</div>
                  <div className={styles.statNumber}>{formatNumber(currentDetail.postDetail?.collectCount || 0)}</div>
                </div>
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>{t('stats.shares')}</div>
                  <div className={styles.statNumber}>{formatNumber(currentDetail.postDetail?.forwardCount || 0)}</div>
                </div>
              </div>
            </div>

            {/* 历史数据 */}
            {currentDetail.insights && currentDetail.insights.length > 0 && (
              <div className={styles.historySection}>
                <h4>{t('detail.dataHistory')}</h4>
                <div className={styles.historyList}>
                  {currentDetail.insights.map((insight, index) => (
                    <div key={insight._id} className={styles.historyItem}>
                      <div className={styles.historyTime}>
                        {new Date(insight.createdAt).toLocaleString('zh-CN')}
                      </div>
                      <div className={styles.historyStats}>
                        <span>{t('stats.views')}: {formatNumber(insight.viewCount)}</span>
                        <span>{t('stats.likes')}: {formatNumber(insight.likeCount)}</span>
                        <span>{t('stats.comments')}: {formatNumber(insight.commentCount)}</span>
                        <span>{t('stats.favorites')}: {formatNumber(insight.favoriteCount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Empty description={t('detail.notFound')} />
        )}
      </Modal>
    </div>
  )
}

