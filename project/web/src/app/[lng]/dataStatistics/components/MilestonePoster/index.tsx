'use client'

import { DownloadOutlined } from '@ant-design/icons'
import { Button, Modal } from 'antd'
import { useEffect, useRef } from 'react'
import { useTransClient } from '@/app/i18n/client'
import logo from '@/assets/images/logo.png'
import { useUserStore } from '@/store/user'
import styles from './milestonePoster.module.scss'

export interface IMilestone {
  // 指标类型：涨粉数、阅读量、点赞数等
  type: string
  // 指标标题
  title: string
  // 达成的数值
  value: number
  // 里程碑值（50、100、500、1000、5000、10000、50000）
  milestone: number
  // 是否为新高（保留字段，暂不使用）
  isNewHigh: boolean
  // 数据来源类型：'yesterday' 昨日新增 | 'week' 最近一周
  sourceType: 'yesterday' | 'week'
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
  const userInfo = useUserStore(state => state.userInfo)

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

    // 设置Canvas尺寸 - 根据里程碑数量动态调整高度
    const width = 800
    const baseHeight = 500 // 基础高度（头部+底部）
    const cardHeight = 160 // 单个卡片高度
    const cardMargin = 16 // 卡片间距
    const dynamicHeight = milestones.length * (cardHeight + cardMargin)
    const height = Math.max(1000, baseHeight + dynamicHeight)
    canvas.width = width
    canvas.height = height

    // 绘制背景渐变 - 更丰富的多色渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#4158D0')
    gradient.addColorStop(0.5, '#C850C0')
    gradient.addColorStop(1, '#FFCC70')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // 绘制装饰性圆形背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.beginPath()
    ctx.arc(width / 2, -50, 250, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.arc(width + 100, height / 2, 200, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.arc(-50, height - 100, 180, 0, Math.PI * 2)
    ctx.fill()

    // 绘制星星装饰
    const drawStar = (x: number, y: number, size: number, opacity: number) => {
      ctx.save()
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2
        const x1 = x + Math.cos(angle) * size
        const y1 = y + Math.sin(angle) * size
        if (i === 0) {
          ctx.moveTo(x1, y1)
        }
        else {
          ctx.lineTo(x1, y1)
        }
        const angle2 = angle + Math.PI / 5
        const x2 = x + Math.cos(angle2) * (size / 2)
        const y2 = y + Math.sin(angle2) * (size / 2)
        ctx.lineTo(x2, y2)
      }
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    // 绘制多个星星装饰
    drawStar(100, 120, 8, 0.6)
    drawStar(width - 120, 100, 10, 0.5)
    drawStar(150, height - 150, 6, 0.4)
    drawStar(width - 100, height - 200, 9, 0.5)
    drawStar(width / 2 + 150, 180, 7, 0.3)

    // 绘制用户头像和昵称 - 放大并添加装饰
    const avatarSize = 70
    const avatarX = 40
    const avatarY = 40
    const nicknameX = avatarX + avatarSize + 20

    // 绘制头像外圈装饰
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2 + 5,
      0,
      Math.PI * 2,
    )
    ctx.stroke()

    // 加载并绘制头像
    const avatarSrc = userInfo?.avatar || logo.src
    const avatarImg = new Image()
    avatarImg.crossOrigin = 'anonymous'
    avatarImg.src = avatarSrc
    avatarImg.onload = () => {
      ctx.save()
      ctx.beginPath()
      ctx.arc(
        avatarX + avatarSize / 2,
        avatarY + avatarSize / 2,
        avatarSize / 2,
        0,
        Math.PI * 2,
      )
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(
        avatarImg,
        avatarX,
        avatarY,
        avatarSize,
        avatarSize,
      )
      ctx.restore()
    }

    // 绘制昵称 - 放大字体并添加阴影
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 2
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 32px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(
      userInfo?.name || 'User',
      nicknameX,
      avatarY + avatarSize / 2 + 12,
    )
    ctx.restore()

    // 绘制标题 - 添加发光效果
    ctx.save()
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'
    ctx.shadowBlur = 20
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 56px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(t('congratulations'), width / 2, 190)
    ctx.restore()

    // 绘制副标题
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.font = '36px sans-serif'
    ctx.fillText(t('achieveMilestone'), width / 2, 240)

    // 绘制装饰线条
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(width / 2 - 100, 260)
    ctx.lineTo(width / 2 + 100, 260)
    ctx.stroke()

    // 计算卡片区域垂直居中位置
    const topContentEnd = 280 // 标题区域结束位置（留20px间距）
    const bottomContentStart = height - 140 // 底部区域开始位置（留20px间距）
    const availableHeight = bottomContentStart - topContentEnd
    const cardsAreaHeight = milestones.length * cardHeight + (milestones.length - 1) * cardMargin
    const yOffset = topContentEnd + (availableHeight - cardsAreaHeight) / 2

    // 绘制里程碑卡片
    milestones.forEach((milestone, index) => {
      const cardY = yOffset + index * (cardHeight + cardMargin)

      // 绘制卡片阴影层
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'
      ctx.shadowBlur = 25
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 12

      // 绘制卡片背景 - 添加渐变
      const cardGradient = ctx.createLinearGradient(40, cardY, 40, cardY + cardHeight)
      cardGradient.addColorStop(0, 'rgba(255, 255, 255, 0.98)')
      cardGradient.addColorStop(1, 'rgba(255, 255, 255, 0.95)')
      ctx.fillStyle = cardGradient
      roundRect(ctx, 40, cardY, width - 80, cardHeight, 16)
      ctx.fill()
      ctx.shadowColor = 'transparent'

      // 绘制卡片左侧装饰条
      const color = getMilestoneColor(milestone.milestone)
      const leftBarGradient = ctx.createLinearGradient(40, cardY, 45, cardY)
      leftBarGradient.addColorStop(0, color)
      leftBarGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.fillStyle = leftBarGradient
      roundRect(ctx, 40, cardY, 8, cardHeight, 16)
      ctx.fill()

      // 绘制里程碑徽章外圈光晕
      const glowGradient = ctx.createRadialGradient(
        110,
        cardY + cardHeight / 2,
        0,
        110,
        cardY + cardHeight / 2,
        55,
      )
      glowGradient.addColorStop(0, `${color}40`)
      glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(110, cardY + cardHeight / 2, 55, 0, Math.PI * 2)
      ctx.fill()

      // 绘制里程碑图标/徽章 - 渐变效果
      const badgeGradient = ctx.createRadialGradient(
        110,
        cardY + cardHeight / 2 - 10,
        10,
        110,
        cardY + cardHeight / 2,
        48,
      )
      const hexToRgb = (hex: string) => {
        const r = Number.parseInt(hex.slice(1, 3), 16)
        const g = Number.parseInt(hex.slice(3, 5), 16)
        const b = Number.parseInt(hex.slice(5, 7), 16)
        return { r, g, b }
      }
      const rgb = hexToRgb(color)
      badgeGradient.addColorStop(0, `rgba(${rgb.r + 30}, ${rgb.g + 30}, ${rgb.b + 30}, 1)`)
      badgeGradient.addColorStop(1, color)
      ctx.fillStyle = badgeGradient
      ctx.beginPath()
      ctx.arc(110, cardY + cardHeight / 2, 48, 0, Math.PI * 2)
      ctx.fill()

      // 绘制徽章内圈高光
      const highlightGradient = ctx.createRadialGradient(
        105,
        cardY + cardHeight / 2 - 15,
        0,
        105,
        cardY + cardHeight / 2 - 15,
        25,
      )
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)')
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.fillStyle = highlightGradient
      ctx.beginPath()
      ctx.arc(105, cardY + cardHeight / 2 - 15, 25, 0, Math.PI * 2)
      ctx.fill()

      // 绘制里程碑数字
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 2
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 30px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(formatMilestone(milestone.milestone), 110, cardY + cardHeight / 2 + 11)
      ctx.shadowColor = 'transparent'

      // 绘制指标标题
      ctx.fillStyle = '#333333'
      ctx.font = 'bold 28px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(milestone.title, 180, cardY + 50)

      // 绘制数据来源标签（昨日新增 或 最近一周）
      ctx.fillStyle = '#666666'
      ctx.font = '24px sans-serif'
      const sourceLabel = milestone.sourceType === 'yesterday' ? t('yesterdayIncrease') : t('recentWeek')
      ctx.fillText(sourceLabel, 180, cardY + 85)

      // 绘制数值
      ctx.fillStyle = color
      ctx.font = 'bold 36px sans-serif'
      ctx.fillText(`+${milestone.value}`, 180, cardY + 125)
    })

    // 绘制底部品牌信息
    const bottomOffset = height - 120
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(t('appName'), width / 2, bottomOffset)

    ctx.font = '22px sans-serif'
    ctx.fillText(t('keepGoing'), width / 2, bottomOffset + 40)

    // 绘制日期
    const today = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    ctx.font = '18px sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fillText(today, width / 2, bottomOffset + 75)
  }, [visible, milestones, t, userInfo])

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
        <div className="milestonePoster_canvas">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </Modal>
  )
}
