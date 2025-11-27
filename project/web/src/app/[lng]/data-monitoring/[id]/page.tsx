'use client'

import {
  ArrowLeftOutlined,
  LikeOutlined,
  StarOutlined,
  CommentOutlined,
} from '@ant-design/icons'
import { Card, Image, message, Spin, Table, Tag } from 'antd'
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
  likeCount: number
  newLikeCount: number
  commentCount: number
  newCommentCount: number
  favoriteCount: number
  newFavoriteCount: number
}

export default function MonitoringDetailPage() {
  const { t } = useTransClient('dataMonitoring')
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<NoteMonitoringItem | null>(null)

  // 加载监测详情
  const loadDetail = async () => {
    setLoading(true)
    try {
      const data = await apiGetNoteMonitoringDetail(id)
      setDetail(data || null)
    }
    catch (error: any) {
      message.error(error.message || t('error.loadFailed'))
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

  // 按日期分组计算每日增量
  const getDailyIncrements = () => {
    if (!detail?.insights || detail.insights.length === 0) return []

    const sortedInsights = [...detail.insights].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    // 按日期分组，每天取最后一条数据
    const dailyDataMap = new Map<string, typeof sortedInsights[0]>()
    sortedInsights.forEach(item => {
      const date = new Date(item.createdAt).toLocaleDateString('zh-CN')
      dailyDataMap.set(date, item)
    })

    const dailyData = Array.from(dailyDataMap.entries()).map(([date, data]) => ({ date, data }))

    // 计算每日增量
    return dailyData.map((item, index) => {
      const prevItem = index > 0 ? dailyData[index - 1].data : null
      return {
        key: item.data._id,
        date: item.date,
        likeCount: item.data.likeCount,
        newLikeCount: prevItem ? item.data.likeCount - prevItem.likeCount : item.data.likeCount,
        commentCount: item.data.commentCount,
        newCommentCount: prevItem ? item.data.commentCount - prevItem.commentCount : item.data.commentCount,
        favoriteCount: item.data.favoriteCount,
        newFavoriteCount: prevItem ? item.data.favoriteCount - prevItem.favoriteCount : item.data.favoriteCount,
      }
    })
  }

  const tableColumns: ColumnsType<HistoryDataRecord> = [
    {
      title: t('detail.table.date'),
      dataIndex: 'date',
      key: 'date',
      width: 120,
      fixed: 'left',
    },
    {
      title: t('detail.table.likeIncrement'),
      dataIndex: 'newLikeCount',
      key: 'newLikeCount',
      align: 'right',
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#52c41a' : '#999', fontWeight: 'bold' }}>
          {value > 0 ? `+${value}` : value}
        </span>
      ),
    },
    {
      title: t('detail.table.favoriteIncrement'),
      dataIndex: 'newFavoriteCount',
      key: 'newFavoriteCount',
      align: 'right',
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#52c41a' : '#999', fontWeight: 'bold' }}>
          {value > 0 ? `+${value}` : value}
        </span>
      ),
    },
    {
      title: t('detail.table.commentIncrement'),
      dataIndex: 'newCommentCount',
      key: 'newCommentCount',
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
          {detail.postDetail?.cover && (
            <div className={styles.noteImage}>
              <Image
                src={detail.postDetail.cover}
                alt={detail.postDetail.title || t('detail.noteCover')}
                width={500}
                height={500}
                style={{ objectFit: 'cover', borderRadius: '8px' }}
              />
            </div>
          )}
          <div className={styles.noteDetails}>
            <h2 className={styles.noteTitle}>
              {detail.postDetail?.title || t('list.untitled')}
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

