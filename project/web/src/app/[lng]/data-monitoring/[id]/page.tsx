'use client'

import {
  ArrowLeftOutlined,
  DownloadOutlined,
  LineChartOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  TableOutlined,
} from '@ant-design/icons'
import { Button, Card, message, Progress, Spin, Table, Tabs, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import {
  apiDeleteNoteMonitoring,
  apiExportNoteMonitoringData,
  apiGetNoteMonitoringDetail,
  apiToggleNoteMonitoring,
  type NoteMonitoringDetail,
} from '@/api/monitoring'
import styles from './detailPage.module.scss'

interface HistoryDataRecord {
  key: string
  time: string
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
  const [detail, setDetail] = useState<NoteMonitoringDetail | null>(null)
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart')
  const [exporting, setExporting] = useState(false)

  // 加载监测详情
  const loadDetail = async () => {
    setLoading(true)
    try {
      const data = await apiGetNoteMonitoringDetail(id)
      setDetail(data)
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

  // 暂停/恢复监测
  const handleToggleMonitoring = async () => {
    if (!detail)
      return

    const newStatus = detail.monitoringStatus === 'active' ? 'paused' : 'active'
    try {
      await apiToggleNoteMonitoring(id, newStatus)
      message.success(newStatus === 'active' ? t('detail.resumed') : t('detail.paused'))
      loadDetail()
    }
    catch (error: any) {
      message.error(error.message || t('error.toggleFailed'))
    }
  }

  // 导出数据
  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await apiExportNoteMonitoringData(id)
      const url = window.URL.createObjectURL(blob!)
      const a = document.createElement('a')
      a.href = url
      a.download = `monitoring-data-${id}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      message.success(t('detail.exportSuccess'))
    }
    catch (error: any) {
      message.error(error.message || t('error.exportFailed'))
    }
    finally {
      setExporting(false)
    }
  }

  // 准备图表数据
  const getChartOption = (): EChartsOption => {
    if (!detail)
      return {}

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
      },
      legend: {
        data: [t('stats.favorites'), t('stats.likes'), t('stats.comments')],
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '50px',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: detail.history.map(item =>
          new Date(item.time).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
        ),
        axisLabel: {
          rotate: 45,
          interval: Math.floor(detail.history.length / 10) || 0,
        },
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: t('stats.favorites'),
          type: 'line',
          smooth: true,
          data: detail.history.map(item => item.favoriteCount),
          itemStyle: {
            color: '#ff6384',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(255, 99, 132, 0.3)' },
                { offset: 1, color: 'rgba(255, 99, 132, 0.05)' },
              ],
            },
          },
        },
        {
          name: t('stats.likes'),
          type: 'line',
          smooth: true,
          data: detail.history.map(item => item.likeCount),
          itemStyle: {
            color: '#36a2eb',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(54, 162, 235, 0.3)' },
                { offset: 1, color: 'rgba(54, 162, 235, 0.05)' },
              ],
            },
          },
        },
        {
          name: t('stats.comments'),
          type: 'line',
          smooth: true,
          data: detail.history.map(item => item.commentCount),
          itemStyle: {
            color: '#ffce56',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(255, 206, 86, 0.3)' },
                { offset: 1, color: 'rgba(255, 206, 86, 0.05)' },
              ],
            },
          },
        },
      ],
    }
  }

  // 准备表格数据
  const tableData: HistoryDataRecord[] = detail
    ? detail.history.map((item, index) => {
      const prevItem = index > 0 ? detail.history[index - 1] : null
      return {
        key: item.time,
        time: new Date(item.time).toLocaleString(),
        likeCount: item.likeCount,
        newLikeCount: prevItem ? item.likeCount - prevItem.likeCount : 0,
        commentCount: item.commentCount,
        newCommentCount: prevItem ? item.commentCount - prevItem.commentCount : 0,
        favoriteCount: item.favoriteCount,
        newFavoriteCount: prevItem ? item.favoriteCount - prevItem.favoriteCount : 0,
      }
    })
    : []

  const tableColumns: ColumnsType<HistoryDataRecord> = [
    {
      title: t('detail.table.time'),
      dataIndex: 'time',
      key: 'time',
      width: 180,
      fixed: 'left',
    },
    {
      title: t('detail.table.totalLikes'),
      dataIndex: 'likeCount',
      key: 'likeCount',
      align: 'right',
    },
    {
      title: t('detail.table.newLikes'),
      dataIndex: 'newLikeCount',
      key: 'newLikeCount',
      align: 'right',
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#52c41a' : '#999' }}>
          {value > 0 ? `+${value}` : value}
        </span>
      ),
    },
    {
      title: t('detail.table.totalComments'),
      dataIndex: 'commentCount',
      key: 'commentCount',
      align: 'right',
    },
    {
      title: t('detail.table.newComments'),
      dataIndex: 'newCommentCount',
      key: 'newCommentCount',
      align: 'right',
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#52c41a' : '#999' }}>
          {value > 0 ? `+${value}` : value}
        </span>
      ),
    },
    {
      title: t('detail.table.totalFavorites'),
      dataIndex: 'favoriteCount',
      key: 'favoriteCount',
      align: 'right',
    },
    {
      title: t('detail.table.newFavorites'),
      dataIndex: 'newFavoriteCount',
      key: 'newFavoriteCount',
      align: 'right',
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#52c41a' : '#999' }}>
          {value > 0 ? `+${value}` : value}
        </span>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'chart',
      label: (
        <span>
          <LineChartOutlined />
          {t('detail.tabs.chart')}
        </span>
      ),
    },
    {
      key: 'table',
      label: (
        <span>
          <TableOutlined />
          {t('detail.tabs.table')}
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
        <Button type="primary" onClick={() => router.back()}>
          {t('detail.backToList')}
        </Button>
      </div>
    )
  }

  return (
    <div className={styles.detailPage}>
      {/* 顶部操作栏 */}
      <div className={styles.topBar}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          className={styles.backButton}
        >
          {t('detail.back')}
        </Button>
        <div className={styles.actions}>
          <Button
            icon={detail.monitoringStatus === 'active' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={handleToggleMonitoring}
          >
            {detail.monitoringStatus === 'active' ? t('detail.pause') : t('detail.resume')}
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exporting}
          >
            {t('detail.export')}
          </Button>
        </div>
      </div>

      {/* 笔记信息卡片 */}
      <Card className={styles.infoCard}>
        <div className={styles.noteInfo}>
          <div className={styles.noteHeader}>
            <div className={styles.noteMeta}>
              <h2 className={styles.noteTitle}>{detail.title || t('list.untitled')}</h2>
              <Tag color="blue">{detail.platform}</Tag>
              <Tag color={detail.monitoringStatus === 'active' ? 'green' : 'orange'}>
                {detail.monitoringStatus === 'active' ? t('detail.status.active') : t('detail.status.paused')}
              </Tag>
            </div>
            <div className={styles.noteLink}>
              {detail.url && (
                <a href={detail.url} target="_blank" rel="noopener noreferrer">
                  {t('detail.viewNote')}
                </a>
              )}
            </div>
          </div>
          
          <div className={styles.monitoringInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('detail.taskId')}:</span>
              <span className={styles.infoValue}>{detail.id.substring(0, 8)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('detail.createdTime')}:</span>
              <span className={styles.infoValue}>{new Date(detail.createdAt).toLocaleString()}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('detail.publishTime')}:</span>
              <span className={styles.infoValue}>{new Date(detail.updatedAt).toLocaleString()}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('detail.firstMonitoring')}:</span>
              <span className={styles.infoValue}>
                {detail.history.length > 0 ? new Date(detail.history[0].time).toLocaleString() : '-'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('detail.monitoringDuration')}:</span>
              <span className={styles.infoValue}>{t('detail.duration', { count: 1 })}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('detail.monitoringFrequency')}:</span>
              <span className={styles.infoValue}>{detail.monitoringFrequency}{t('detail.minutesPerTime')}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('detail.lastMonitoring')}:</span>
              <span className={styles.infoValue}>
                {detail.history.length > 0
                  ? new Date(detail.history[detail.history.length - 1].time).toLocaleString()
                  : '-'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 监测完成度 */}
      <Card className={styles.progressCard}>
        <div className={styles.progressHeader}>
          <h3>{t('detail.completionRate')}</h3>
          <span className={styles.progressText}>100%{t('detail.monitoringComplete')}</span>
        </div>
        <Progress
          percent={100}
          strokeColor={{
            '0%': '#667eea',
            '100%': '#764ba2',
          }}
          showInfo={false}
        />
      </Card>

      {/* 当前数据统计 */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            ⭐
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{detail.stats.favoriteCount}</div>
            <div className={styles.statLabel}>{t('stats.favorites')}</div>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            👍
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{detail.stats.likeCount}</div>
            <div className={styles.statLabel}>{t('stats.likes')}</div>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            💬
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{detail.stats.commentCount}</div>
            <div className={styles.statLabel}>{t('stats.comments')}</div>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            📊
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{detail.stats.viewCount}</div>
            <div className={styles.statLabel}>{t('stats.views')}</div>
          </div>
        </Card>
      </div>

      {/* 数据详情 */}
      <Card className={styles.dataCard}>
        <h3 className={styles.dataTitle}>📊 {t('detail.dataDetail')}</h3>

        <div className={styles.actionBar}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exporting}
            className={styles.exportButton}
          >
            {t('detail.downloadRecord')}
          </Button>
          <Button
            type="primary"
            onClick={handleExport}
            loading={exporting}
            className={styles.exportResultButton}
          >
            {t('detail.exportResult')}
          </Button>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={key => setActiveTab(key as 'chart' | 'table')}
          items={tabItems}
          className={styles.dataTabs}
        />

        <div className={styles.dataContent}>
          {activeTab === 'chart' && detail && (
            <div className={styles.chartContainer}>
              <ReactECharts option={getChartOption()} style={{ height: '400px' }} />
            </div>
          )}

          {activeTab === 'table' && (
            <div className={styles.tableContainer}>
              <Table
                columns={tableColumns}
                dataSource={tableData}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: total => t('detail.table.total', { count: total }),
                }}
                scroll={{ x: 'max-content' }}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

