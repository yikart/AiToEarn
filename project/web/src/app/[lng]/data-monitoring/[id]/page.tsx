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
  apiExportNoteMonitoringData,
  apiGetNoteMonitoringDetail,
  apiToggleNoteMonitoring,
  type NoteMonitoringItem,
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
  viewCount: number
  newViewCount: number
}

export default function MonitoringDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<NoteMonitoringItem | null>(null)
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart')
  const [exporting, setExporting] = useState(false)

  // 加载监测详情
  const loadDetail = async () => {
    setLoading(true)
    try {
      const data = await apiGetNoteMonitoringDetail(id)
      setDetail(data || null)
    }
    catch (error: any) {
      message.error(error.message || '加载失败')
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

    const newEnabled = !detail.enabled
    try {
      await apiToggleNoteMonitoring(id, newEnabled)
      message.success(newEnabled ? '已恢复监测' : '已暂停监测')
      loadDetail()
    }
    catch (error: any) {
      message.error(error.message || '操作失败')
    }
  }

  // 导出数据
  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await apiExportNoteMonitoringData(id)
      if (blob) {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `monitoring-data-${id}.xlsx`
        a.click()
        window.URL.revokeObjectURL(url)
        message.success('导出成功')
      }
    }
    catch (error: any) {
      message.error(error.message || '导出失败')
    }
    finally {
      setExporting(false)
    }
  }

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}万`
    }
    return num.toLocaleString()
  }

  // 准备图表数据
  const getChartOption = (): EChartsOption => {
    if (!detail || !detail.insights || detail.insights.length === 0)
      return {}

    const sortedInsights = [...detail.insights].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
      },
      legend: {
        data: ['收藏数', '点赞数', '评论数'],
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
        data: sortedInsights.map(item =>
          new Date(item.createdAt).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
        ),
        axisLabel: {
          rotate: 45,
          interval: Math.floor(sortedInsights.length / 10) || 0,
        },
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: '收藏数',
          type: 'line',
          smooth: true,
          data: sortedInsights.map(item => item.favoriteCount),
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
          name: '点赞数',
          type: 'line',
          smooth: true,
          data: sortedInsights.map(item => item.likeCount),
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
          name: '评论数',
          type: 'line',
          smooth: true,
          data: sortedInsights.map(item => item.commentCount),
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
  const tableData: HistoryDataRecord[] = detail && detail.insights
    ? [...detail.insights]
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((item, index, array) => {
          const prevItem = index > 0 ? array[index - 1] : null
          return {
            key: item._id,
            time: new Date(item.createdAt).toLocaleString('zh-CN'),
            likeCount: item.likeCount,
            newLikeCount: prevItem ? item.likeCount - prevItem.likeCount : 0,
            commentCount: item.commentCount,
            newCommentCount: prevItem ? item.commentCount - prevItem.commentCount : 0,
            favoriteCount: item.favoriteCount,
            newFavoriteCount: prevItem ? item.favoriteCount - prevItem.favoriteCount : 0,
            viewCount: item.viewCount,
            newViewCount: prevItem ? item.viewCount - prevItem.viewCount : 0,
          }
        })
    : []

  const tableColumns: ColumnsType<HistoryDataRecord> = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 180,
      fixed: 'left',
    },
    {
      title: '即时收藏',
      dataIndex: 'favoriteCount',
      key: 'favoriteCount',
      align: 'right',
    },
    {
      title: '新增收藏',
      dataIndex: 'newFavoriteCount',
      key: 'newFavoriteCount',
      align: 'right',
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#52c41a' : '#999' }}>
          {value > 0 ? `+${value}` : value}
        </span>
      ),
    },
    {
      title: '即时评论',
      dataIndex: 'commentCount',
      key: 'commentCount',
      align: 'right',
    },
    {
      title: '新增评论',
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
      title: '即时点赞',
      dataIndex: 'likeCount',
      key: 'likeCount',
      align: 'right',
    },
    {
      title: '新增点赞',
      dataIndex: 'newLikeCount',
      key: 'newLikeCount',
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
          累计视图
        </span>
      ),
    },
    {
      key: 'table',
      label: (
        <span>
          <TableOutlined />
          增量视图
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
        <p>未找到监测数据</p>
        <Button type="primary" onClick={() => router.back()}>
          返回列表
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
          返回
        </Button>
        <div className={styles.actions}>
          <Button
            icon={detail.enabled ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={handleToggleMonitoring}
          >
            {detail.enabled ? '暂停监测' : '恢复监测'}
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exporting}
          >
            导出数据
          </Button>
        </div>
      </div>

      {/* 笔记信息卡片 */}
      <Card className={styles.infoCard}>
        <div className={styles.noteInfo}>
          <div className={styles.noteHeader}>
            <div className={styles.noteMeta}>
              <h2 className={styles.noteTitle}>
                {detail.postDetail?.title || detail.postDetail?.desc || '未命名笔记'}
              </h2>
              <Tag color="blue">{detail.platform.toUpperCase()}</Tag>
              <Tag color={detail.enabled ? 'green' : 'orange'}>
                {detail.enabled ? '监测中' : '已暂停'}
              </Tag>
              {detail.status && (
                <Tag color={
                  detail.status === 'completed' ? 'success' :
                  detail.status === 'failed' ? 'error' :
                  detail.status === 'processing' ? 'processing' : 'default'
                }>
                  {detail.status === 'completed' ? '已完成' :
                   detail.status === 'failed' ? '失败' :
                   detail.status === 'processing' ? '处理中' : '等待中'}
                </Tag>
              )}
            </div>
            <div className={styles.noteLink}>
              {detail.link && (
                <a href={detail.link} target="_blank" rel="noopener noreferrer">
                  查看笔记
                </a>
              )}
            </div>
          </div>
          
          <div className={styles.monitoringInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>任务编号:</span>
              <span className={styles.infoValue}>{detail._id.substring(0, 8)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>任务提交时间:</span>
              <span className={styles.infoValue}>{new Date(detail.createdAt).toLocaleString('zh-CN')}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>发布时间:</span>
              <span className={styles.infoValue}>
                {detail.postDetail?.publishTime 
                  ? new Date(detail.postDetail.publishTime).toLocaleString('zh-CN')
                  : '-'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>首次监测时间:</span>
              <span className={styles.infoValue}>
                {detail.insights && detail.insights.length > 0 
                  ? new Date(detail.insights[0].createdAt).toLocaleString('zh-CN') 
                  : '-'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>监测时长:</span>
              <span className={styles.infoValue}>
                {detail.insights && detail.insights.length > 0
                  ? `${Math.ceil((new Date().getTime() - new Date(detail.createdAt).getTime()) / (1000 * 60 * 60 * 24))}天`
                  : '-'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>监测频率:</span>
              <span className={styles.infoValue}>5分钟/次</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>最近一次监测:</span>
              <span className={styles.infoValue}>
                {detail.insights && detail.insights.length > 0
                  ? new Date(detail.insights[detail.insights.length - 1].createdAt).toLocaleString('zh-CN')
                  : '-'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 监测完成度 */}
      <Card className={styles.progressCard}>
        <div className={styles.progressHeader}>
          <h3>监测完成度</h3>
          <span className={styles.progressText}>
            {detail.status === 'completed' ? '100% 监测已完成' : '监测中'}
          </span>
        </div>
        <Progress
          percent={detail.status === 'completed' ? 100 : 80}
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
            <div className={styles.statValue}>
              {formatNumber(detail.postDetail?.collectCount || 0)}
            </div>
            <div className={styles.statLabel}>收藏数</div>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            👍
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {formatNumber(detail.postDetail?.likeCount || 0)}
            </div>
            <div className={styles.statLabel}>点赞数</div>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            💬
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {formatNumber(detail.postDetail?.commentCount || 0)}
            </div>
            <div className={styles.statLabel}>评论数</div>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            📊
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {formatNumber(detail.postDetail?.readCount || 0)}
            </div>
            <div className={styles.statLabel}>阅读数</div>
          </div>
        </Card>
      </div>

      {/* 数据详情 */}
      <Card className={styles.dataCard}>
        <h3 className={styles.dataTitle}>📊 数据详情</h3>

        <div className={styles.actionBar}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exporting}
            className={styles.exportButton}
          >
            下载记录
          </Button>
          <Button
            type="primary"
            onClick={handleExport}
            loading={exporting}
            className={styles.exportResultButton}
          >
            导出结果
          </Button>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={key => setActiveTab(key as 'chart' | 'table')}
          items={tabItems}
          className={styles.dataTabs}
        />

        <div className={styles.dataContent}>
          {activeTab === 'chart' && detail && detail.insights && detail.insights.length > 0 && (
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
                  showTotal: total => `共 ${total} 条`,
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

