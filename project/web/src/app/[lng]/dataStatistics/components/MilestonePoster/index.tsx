'use client'

import { DownloadOutlined } from '@ant-design/icons'
import { Button, Modal } from 'antd'
import { useEffect, useRef } from 'react'
import { useTransClient } from '@/app/i18n/client'
import styles from './milestonePoster.module.scss'

export interface IMilestone {
  // 指标类型：涨粉数、阅读量、点赞数等
  type: string
  // 指标标题
  title: string
  // 昨日新增值
  value: number
  // 里程碑值（50、100、500、1000、5000、10000、50000）
  milestone: number
  // 是否为新高（保留字段，暂不使用）
  isNewHigh: boolean
}

export interface IMilestonePosterProps {
  // 里程碑数据列表
  milestones: IMilestone[]
  // 是否显示
  visible: boolean
  // 关闭回调
  onClose: () => void
}

/**
 * 里程碑海报组件
 * 用于展示和保存数据统计里程碑海报
 */
export default function MilestonePoster({
  milestones,
  visible,
  onClose,
}: IMilestonePosterProps) {
  const { t } = useTransClient('dataStatistics')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  /**
   * 格式化里程碑值
   */
  const formatMilestone = (milestone: number): string => {
    if (milestone >= 10000) {
      return `${milestone / 10000}${t('tenThousand')}`
    }
    if (milestone >= 1000) {
      return `${milestone / 1000}k`
    }
    return milestone.toString()
  }

  /**
   * 获取里程碑等级颜色
   */
  const getMilestoneColor = (milestone: number): string => {
    if (milestone >= 50000)
      return '#FF6B6B'
    if (milestone >= 10000)
      return '#FF9F43'
    if (milestone >= 5000)
      return '#FFC107'
    if (milestone >= 1000)
      return '#4ECDC4'
    if (milestone >= 500)
      return '#45B7D1'
    if (milestone >= 100)
      return '#96CEB4'
    return '#A8E6CF'
  }

  /**
   * 绘制海报到Canvas
   */
  useEffect(() => {
    if (!visible || !canvasRef.current || milestones.length === 0)
      return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx)
      return

    // 设置Canvas尺寸
    const width = 750
    const height = 1334
    canvas.width = width
    canvas.height = height

    // 绘制背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#667eea')
    gradient.addColorStop(1, '#764ba2')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // 绘制顶部装饰
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.beginPath()
    ctx.arc(width / 2, -100, 300, 0, Math.PI * 2)
    ctx.fill()

    // 绘制标题
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 56px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(t('congratulations'), width / 2, 120)

    ctx.font = '36px sans-serif'
    ctx.fillText(t('achieveMilestone'), width / 2, 180)

    // 绘制里程碑卡片
    let yOffset = 260
    milestones.forEach((milestone, index) => {
      const cardHeight = 180
      const cardMargin = 20
      const cardY = yOffset + index * (cardHeight + cardMargin)

      // 绘制卡片背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
      ctx.shadowBlur = 20
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 10
      roundRect(ctx, 40, cardY, width - 80, cardHeight, 16)
      ctx.fill()
      ctx.shadowColor = 'transparent'

      // 绘制里程碑图标/徽章
      const color = getMilestoneColor(milestone.milestone)
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(120, cardY + cardHeight / 2, 50, 0, Math.PI * 2)
      ctx.fill()

      // 绘制里程碑数字
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 32px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(formatMilestone(milestone.milestone), 120, cardY + cardHeight / 2 + 12)

      // 绘制指标标题
      ctx.fillStyle = '#333333'
      ctx.font = 'bold 32px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(milestone.title, 200, cardY + 60)

      // 绘制昨日新增
      ctx.fillStyle = '#666666'
      ctx.font = '28px sans-serif'
      ctx.fillText(t('yesterdayIncrease'), 200, cardY + 105)

      // 绘制数值
      ctx.fillStyle = color
      ctx.font = 'bold 40px sans-serif'
      ctx.fillText(`+${milestone.value}`, 200, cardY + 150)
    })

    // 绘制底部品牌信息
    yOffset = height - 150
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 32px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(t('appName'), width / 2, yOffset)

    ctx.font = '24px sans-serif'
    ctx.fillText(t('keepGoing'), width / 2, yOffset + 50)

    // 绘制日期
    const today = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    ctx.font = '20px sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fillText(today, width / 2, yOffset + 90)
  }, [visible, milestones, t])

  /**
   * 绘制圆角矩形
   */
  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ) => {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  /**
   * 保存海报图片
   */
  const handleSavePoster = () => {
    if (!canvasRef.current)
      return

    canvasRef.current.toBlob((blob) => {
      if (!blob)
        return

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `milestone-${Date.now()}.png`
      link.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      className={styles.milestonePoster}
    >
      <div className={styles.milestonePoster_content}>
        <div className="milestonePoster_canvas">
          <canvas ref={canvasRef} />
        </div>
        <div className="milestonePoster_actions">
          <Button
            type="primary"
            size="large"
            icon={<DownloadOutlined />}
            onClick={handleSavePoster}
            block
          >
            {t('savePoster')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
