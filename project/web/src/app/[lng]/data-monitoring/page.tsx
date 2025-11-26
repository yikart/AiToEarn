'use client'

import { LinkOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Card, Empty, Input, message, Modal, Spin, Tabs } from 'antd'
import { useEffect, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import {
  apiAddNoteMonitoring,
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
  const [noteLink, setNoteLink] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  // 加载监控列表
  const loadMonitoringList = async () => {
    setLoading(true)
    try {
      const data = await apiGetNoteMonitoringList({ type: activeTab })
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
      await apiAddNoteMonitoring({ url: noteLink, type: 'link' })
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
  const handleViewDetail = (item: NoteMonitoringItem) => {
    // 跳转到详情页面
    window.location.href = `/data-monitoring/${item.id}`
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
    {
      key: 'account',
      label: (
        <span>
          <UserOutlined />
          {t('tabs.byAccount')}
        </span>
      ),
    },
  ]

  return (
    <div className={styles.dataMonitoringPage}>
      {/* 页面标题 */}
      <div className={styles.pageHeader}>
        <div className={styles.headerIcon}>📒</div>
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
                      key={item.id}
                      className={styles.monitoringCard}
                      hoverable
                      onClick={() => handleViewDetail(item)}
                    >
                      <div className={styles.cardHeader}>
                        <h4 className={styles.noteTitle}>{item.title || t('list.untitled')}</h4>
                        <span className={styles.platform}>{item.platform}</span>
                      </div>
                      <div className={styles.cardStats}>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>{t('stats.views')}</span>
                          <span className={styles.statValue}>{item.stats.viewCount}</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>{t('stats.likes')}</span>
                          <span className={styles.statValue}>{item.stats.likeCount}</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>{t('stats.comments')}</span>
                          <span className={styles.statValue}>{item.stats.commentCount}</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>{t('stats.favorites')}</span>
                          <span className={styles.statValue}>{item.stats.favoriteCount}</span>
                        </div>
                      </div>
                      <div className={styles.cardFooter}>
                        <span className={styles.createTime}>
                          {t('list.createdAt')}: {new Date(item.createdAt).toLocaleString()}
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
    </div>
  )
}

