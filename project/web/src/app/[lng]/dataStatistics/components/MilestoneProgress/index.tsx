'use client'

import type { IMilestone } from '@/app/[lng]/dataStatistics/components/MilestonePoster'
import { CheckOutlined } from '@ant-design/icons'
import { Modal } from 'antd'
import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import MilestonePoster from '@/app/[lng]/dataStatistics/components/MilestonePoster'
import { useDataStatisticsStore } from '@/app/[lng]/dataStatistics/useDataStatistics'
import { useTransClient } from '@/app/i18n/client'
import styles from './milestoneProgress.module.scss'

export interface IMilestoneProgressProps {
  // 是否显示
  visible: boolean
  // 关闭回调
  onClose: () => void
}

/**
 * 里程碑进度组件
 * 展示涨粉数、阅读量、点赞数的里程碑进度
 */
export default function MilestoneProgress({
  visible,
  onClose,
}: IMilestoneProgressProps) {
  const { t } = useTransClient('dataStatistics')
  const { dataDetails } = useDataStatisticsStore(
    useShallow(state => ({
      dataDetails: state.dataDetails,
    })),
  )

  // 里程碑阈值
  const thresholds = [50, 100, 500, 1000, 5000, 10000, 50000]

  // 需要展示的指标
  const targetMetrics = [
    { value: 'fansCount', title: t('growthFansCount') },
    { value: 'readCount', title: t('readCount') },
    { value: 'likeCount', title: t('likeCount') },
  ]

  // 当前选中要查看海报的里程碑
  const [selectedMilestone, setSelectedMilestone] = useState<IMilestone | null>(null)
  const [showPoster, setShowPoster] = useState(false)

  /**
   * 格式化里程碑值显示
   */
  const formatThreshold = (threshold: number): string => {
    if (threshold >= 10000) {
      return `${threshold / 10000}${t('tenThousand')}`
    }
    if (threshold >= 1000) {
      return `${threshold / 1000}k`
    }
    return threshold.toString()
  }

  /**
   * 检查某个指标是否达到某个阈值
   * 检查最近一周总和或昨日新增
   */
  const hasReachedThreshold = (metricValue: string, threshold: number): boolean => {
    const detail = dataDetails.find(d => d.value === metricValue)
    if (!detail)
      return false

    // 昨日新增达到阈值
    if (detail.yesterday >= threshold) {
      return true
    }

    // 最近一周总和达到阈值（total就是选定时间范围内的总和）
    if (detail.total >= threshold) {
      return true
    }

    return false
  }

  /**
   * 获取某个指标达到该阈值时的实际数值
   */
  const getAchievedValue = (metricValue: string, threshold: number): number => {
    const detail = dataDetails.find(d => d.value === metricValue)
    if (!detail)
      return 0

    // 优先返回昨日新增，其次返回总和
    if (detail.yesterday >= threshold) {
      return detail.yesterday
    }
    if (detail.total >= threshold) {
      return detail.total
    }
    return 0
  }

  /**
   * 计算某个指标的进度百分比
   */
  const getProgress = (metricValue: string): number => {
    const detail = dataDetails.find(d => d.value === metricValue)
    if (!detail)
      return 0

    // 使用昨日新增和最近一周总和中的较大值
    const maxValue = Math.max(detail.yesterday, detail.total)
    const maxThreshold = thresholds[thresholds.length - 1]

    // 如果超过最大阈值，进度为100%
    if (maxValue >= maxThreshold) {
      return 100
    }

    // 找到当前在哪两个阈值之间
    let prevThreshold = 0
    let nextThreshold = thresholds[0]

    for (let i = 0; i < thresholds.length; i++) {
      if (maxValue >= thresholds[i]) {
        prevThreshold = thresholds[i]
        nextThreshold = thresholds[i + 1] || maxThreshold
      }
      else {
        break
      }
    }

    // 计算在当前区间的进度
    const segmentProgress = (maxValue - prevThreshold) / (nextThreshold - prevThreshold)
    const segmentIndex = thresholds.findIndex(t => t === nextThreshold)
    const baseProgress = (segmentIndex / thresholds.length) * 100

    return baseProgress + (segmentProgress * (100 / thresholds.length))
  }

  /**
   * 点击节点处理
   */
  const handleNodeClick = (metricValue: string, metricTitle: string, threshold: number) => {
    // 检查是否达到该阈值
    if (!hasReachedThreshold(metricValue, threshold)) {
      return
    }

    // 构造里程碑数据
    const milestone: IMilestone = {
      type: metricValue,
      title: metricTitle,
      value: getAchievedValue(metricValue, threshold),
      milestone: threshold,
      isNewHigh: false,
    }

    setSelectedMilestone(milestone)
    setShowPoster(true)
  }

  return (
    <>
      <Modal
        title={t('milestoneProgress')}
        open={visible}
        onCancel={onClose}
        footer={null}
        width={900}
        centered
        className={styles.milestoneProgress}
      >
        <div className="milestoneProgress_content">
          {targetMetrics.map(metric => (
            <div key={metric.value} className="milestoneProgress_metric">
              <h4 className="milestoneProgress_metric-title">{metric.title}</h4>

              <div className="milestoneProgress_metric-track">
                {/* 进度条背景 */}
                <div className="milestoneProgress_metric-track-bg">
                  {/* 进度条填充 */}
                  <div
                    className="milestoneProgress_metric-track-fill"
                    style={{ width: `${getProgress(metric.value)}%` }}
                  />
                </div>

                {/* 里程碑节点 */}
                <div className="milestoneProgress_metric-nodes">
                  {thresholds.map((threshold, index) => {
                    const isReached = hasReachedThreshold(metric.value, threshold)
                    const position = (index / (thresholds.length - 1)) * 100

                    return (
                      <div
                        key={threshold}
                        className={`milestoneProgress_metric-node ${
                          isReached ? 'milestoneProgress_metric-node--reached' : ''
                        }`}
                        style={{ left: `${position}%` }}
                        onClick={() => handleNodeClick(metric.value, metric.title, threshold)}
                      >
                        <div className="milestoneProgress_metric-node-circle">
                          {isReached && <CheckOutlined />}
                        </div>
                        <div className="milestoneProgress_metric-node-label">
                          {formatThreshold(threshold)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* 海报弹窗 */}
      {selectedMilestone && (
        <MilestonePoster
          milestones={[selectedMilestone]}
          visible={showPoster}
          onClose={() => {
            setShowPoster(false)
            setSelectedMilestone(null)
          }}
        />
      )}
    </>
  )
}
