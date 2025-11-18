import type { Dayjs } from 'dayjs'
import type { ForwardedRef } from 'react'
import { TrophyOutlined } from '@ant-design/icons'
import Icon from '@ant-design/icons'
import { Badge, Button, DatePicker } from 'antd'
import { forwardRef, memo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import MilestonePoster from '@/app/[lng]/dataStatistics/components/MilestonePoster'
import MilestoneProgress from '@/app/[lng]/dataStatistics/components/MilestoneProgress'
import { useDataStatisticsStore } from '@/app/[lng]/dataStatistics/useDataStatistics'
import { useTransClient } from '@/app/i18n/client'
import styles from './dataStatisticsDetails.module.scss'

export interface IDataStatisticsDetailsRef {}

export interface IDataStatisticsDetailsProps {}

const DataStatisticsDetails = memo(
  forwardRef(
    (
      {}: IDataStatisticsDetailsProps,
      ref: ForwardedRef<IDataStatisticsDetailsRef>,
    ) => {
      const {
        currentDetailType,
        dataDetails,
        setTimeRangeValue,
        setCurrentDetailType,
        timeRangeValue,
        milestones,
        showMilestonePoster,
        setShowMilestonePoster,
      } = useDataStatisticsStore(
        useShallow(state => ({
          dataDetails: state.dataDetails,
          currentDetailType: state.currentDetailType,
          setCurrentDetailType: state.setCurrentDetailType,
          setTimeRangeValue: state.setTimeRangeValue,
          timeRangeValue: state.timeRangeValue,
          milestones: state.milestones,
          showMilestonePoster: state.showMilestonePoster,
          setShowMilestonePoster: state.setShowMilestonePoster,
        })),
      )
      const { t } = useTransClient('dataStatistics')

      // 里程碑进度弹窗状态
      const [showMilestoneProgress, setShowMilestoneProgress] = useState(false)

      return (
        <>
          <div className={styles.dataStatisticsDetails}>
            <div className="dataStatisticsDetails-head">
              <h3>{t('dataDetails')}</h3>
              <div className="dataStatisticsDetails-head-rangePicker">
                <label>{t('timeRange')}</label>
                <DatePicker.RangePicker
                  value={timeRangeValue}
                  allowClear={false}
                  onChange={(e) => {
                    const dates = e as [Dayjs, Dayjs]
                    setTimeRangeValue(dates)
                  }}
                />
                <Button
                  type="default"
                  icon={<TrophyOutlined />}
                  onClick={() => setShowMilestoneProgress(true)}
                >
                  {t('milestone')}
                </Button>
                {milestones.length > 0 && (
                  <Badge count={milestones.length}>
                    <Button
                      type="primary"
                      icon={<TrophyOutlined />}
                      onClick={() => setShowMilestonePoster(true)}
                    >
                      {t('viewMilestone')}
                    </Button>
                  </Badge>
                )}
              </div>
            </div>

            <div className="dataStatisticsDetails-content">
              {dataDetails.map(detail => (
                <div
                  key={detail.value}
                  className={`dataStatisticsDetails-content-item ${
                    currentDetailType === detail.value
                      ? 'dataStatisticsDetails-content-item--active'
                      : ''
                  }`}
                  onClick={() => {
                    setCurrentDetailType(detail.value)
                  }}
                >
                  <p className="dataStatisticsDetails-content-item-title">
                    <span className="dataStatisticsDetails-content-item-icon">
                      <Icon component={detail.icon} />
                    </span>
                    {detail.title}
                  </p>
                  <p className="dataStatisticsDetails-content-item-count">
                    {detail.total}
                  </p>
                  <p className="dataStatisticsDetails-content-item-yesterday">
                    {t('yesterdayIncrease')}
                    <b>{detail.yesterday}</b>
                  </p>
                </div>
              ))}
            </div>

            <div id="dataStatisticsEchartLine" />
          </div>

          {/* 里程碑进度弹窗 */}
          <MilestoneProgress
            visible={showMilestoneProgress}
            onClose={() => setShowMilestoneProgress(false)}
          />

          {/* 里程碑海报弹窗（自动弹出） */}
          <MilestonePoster
            milestones={milestones}
            visible={showMilestonePoster}
            onClose={() => setShowMilestonePoster(false)}
          />
        </>
      )
    },
  ),
)

export default DataStatisticsDetails
