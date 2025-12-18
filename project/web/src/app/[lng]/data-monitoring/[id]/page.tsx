'use client'

import {
  ArrowLeftOutlined,
  LikeOutlined,
  StarOutlined,
  CommentOutlined,
} from '@ant-design/icons'
import { Avatar, Card, Image, Spin, Table, Tag } from 'antd'
import { toast } from '@/lib/toast'
import type { ColumnsType } from 'antd/es/table'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import {
  apiGetNoteMonitoringDetail,
  type NoteMonitoringItem,
} from '@/api/monitoring'
import styles from './detailPage.module.scss'

interface HistoryDataRecord {
  key: string
  date: string
  likeIncrement: number
  favoriteIncrement: number
  commentIncrement: number
}

export default function MonitoringDetailPage() {
  const { t } = useTransClient('dataMonitoring')
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<NoteMonitoringItem | null>(null)
  const [coverError, setCoverError] = useState(false)

  // 加载监测详情
  const loadDetail = async () => {
    setLoading(true)
    try {
      const data = await apiGetNoteMonitoringDetail(id)
      setDetail(data || null)
    }
    catch (error: any) {
      toast.error(error.message || t('error.loadFailed'))
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      loadDetail()
    }
  }, [id])

  // 获取每日增量数据
  const getDailyIncrements = () => {
    if (!detail?.insights || detail.insights.length === 0) return []

    // 按业务日期排序
    const sortedInsights = [...detail.insights].sort((a, b) => 
      new Date(a.businessDate).getTime() - new Date(b.businessDate).getTime()
    )

    // 直接使用 dailyDelta 数据
    return sortedInsights.map(item => ({
      key: item._id,
      date: item.businessDate,
      likeIncrement: item.dailyDelta.likeCountIncrease,
      favoriteIncrement: item.dailyDelta.favoriteCountIncrease,
      commentIncrement: item.dailyDelta.commentCountIncrease,
    }))
  }

  const tableColumns: ColumnsType<HistoryDataRecord> = [
    {
      title: t('detail.table.date'),
      dataIndex: 'date',
      key: 'date',
      width: 150,
      fixed: 'left',
    },
    {
      title: (
        <span>
          <LikeOutlined style={{ marginRight: 4 }} />
          {t('detail.table.likeIncrement')}
        </span>
      ),
      dataIndex: 'likeIncrement',
      key: 'likeIncrement',
      align: 'right',
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#52c41a' : '#999', fontWeight: 'bold' }}>
          {value > 0 ? `+${value}` : value}
        </span>
      ),
    },
    {
      title: (
        <span>
          <StarOutlined style={{ marginRight: 4 }} />
          {t('detail.table.favoriteIncrement')}
        </span>
      ),
      dataIndex: 'favoriteIncrement',
      key: 'favoriteIncrement',
      align: 'right',
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#52c41a' : '#999', fontWeight: 'bold' }}>
          {value > 0 ? `+${value}` : value}
        </span>
      ),
    },
    {
      title: (
        <span>
          <CommentOutlined style={{ marginRight: 4 }} />
          {t('detail.table.commentIncrement')}
        </span>
      ),
      dataIndex: 'commentIncrement',
      key: 'commentIncrement',
      align: 'right',
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#52c41a' : '#999', fontWeight: 'bold' }}>
          {value > 0 ? `+${value}` : value}
        </span>
      ),
    },
  ]

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className={styles.errorContainer}>
        <p>{t('detail.notFound')}</p>
      </div>
    )
  }

  return (
    <div className={styles.detailPage}>
      {/* 页面标题 */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <ArrowLeftOutlined 
            className={styles.backIcon} 
            onClick={() => router.back()}
          />
          {t('detail.pageTitle')}
        </h1>
      </div>

      {/* 任务信息 */}
      <Card className={styles.taskInfoCard}>
        <div className={styles.taskInfo}>
          <div className={styles.infoItem}>
            <span className={styles.label}>{t('detail.taskId')}:</span>
            <span className={styles.value}>{detail._id.substring(0, 12)}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>{t('detail.startTime')}:</span>
            <span className={styles.value}>
              {new Date(detail.createdAt).toLocaleString('zh-CN')}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>{t('detail.updateTime')}:</span>
            <span className={styles.value}>
              {new Date(detail.updatedAt).toLocaleString('zh-CN')}
            </span>
          </div>
          
        </div>
      </Card>

      {/* 笔记信息 */}
      <Card className={styles.noteCard}>
        <div className={styles.noteContent}>
          {(detail.postDetail?.cover || detail.postDetail?.url) && (
            <div className={styles.noteImage}>
              {coverError && detail.postDetail?.url ? (
                detail.postDetail.mediaType === 'video' ? (
                  <video
                    src={detail.postDetail.url}
                    controls
                    className={styles.mediaContent}
                    style={{ borderRadius: '8px' }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={detail.postDetail.url}
                    alt={detail.postDetail.title || t('detail.noteCover')}
                    className={styles.mediaContent}
                    style={{ objectFit: 'cover', borderRadius: '8px', width: '100%', height: 'auto' }}
                  />
                )
              ) : detail.postDetail?.cover ? (
                <Image
                  src={detail.postDetail.cover}
                  alt={detail.postDetail.title || t('detail.noteCover')}
                  width={500}
                  height={500}
                  style={{ objectFit: 'cover', borderRadius: '8px' }}
                  onError={() => setCoverError(true)}
                />
              ) : null}
            </div>
          )}
          <div className={styles.noteDetails}>
            {detail.postDetail?.author && (
              <div className={styles.authorInfo}>
                <Avatar
                  src={detail.postDetail.avatar}
                  size={40}
                  className={styles.authorAvatar}
                >
                  {detail.postDetail.author.charAt(0)}
                </Avatar>
                <span className={styles.authorName}>{detail.postDetail.author}</span>
              </div>
            )}
            <h2 className={styles.noteTitle}>
              {detail.postDetail?.title || detail.postDetail?.desc || t('list.untitled')}
            </h2>
            <div className={styles.noteTags}>
              {detail.link && (
                <a href={detail.link} target="_blank" rel="noopener noreferrer" className={styles.viewLink}>
                  {t('detail.viewOriginal')} →
                </a>
              )}
            </div>
            <div className={styles.noteDesc}>
              {detail.postDetail?.desc && detail.postDetail.desc.length > 500 
                ? `${detail.postDetail.desc.substring(0, 500)}...` 
                : detail.postDetail?.desc}
            </div>
            <div className={styles.noteStats}>
              <div className={styles.statItem}>
                <LikeOutlined className={styles.statIcon} />
                <span className={styles.statLabel}>{t('stats.likes')}:</span>
                <span className={styles.statValue}>{detail.postDetail?.likeCount || 0}</span>
              </div>
              <div className={styles.statItem}>
                <StarOutlined className={styles.statIcon} />
                <span className={styles.statLabel}>{t('stats.favorites')}:</span>
                <span className={styles.statValue}>{detail.postDetail?.collectCount || 0}</span>
              </div>
              <div className={styles.statItem}>
                <CommentOutlined className={styles.statIcon} />
                <span className={styles.statLabel}>{t('stats.comments')}:</span>
                <span className={styles.statValue}>{detail.postDetail?.commentCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 增量视图 */}
      <Card className={styles.incrementCard}>
        <h3 className={styles.cardTitle}>{t('detail.dailyIncrement')}</h3>
        <Table
          columns={tableColumns}
          dataSource={getDailyIncrements()}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: total => t('detail.table.totalDays', { count: total }),
          }}
          locale={{
            emptyText: t('detail.noData')
          }}
        />
      </Card>
    </div>
  )
}

