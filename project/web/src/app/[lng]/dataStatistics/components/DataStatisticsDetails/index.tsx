import type { Dayjs } from 'dayjs'
import type { ForwardedRef } from 'react'
import Icon from '@ant-design/icons'
import { DatePicker } from 'antd'
import { forwardRef, memo } from 'react'
import { useShallow } from 'zustand/react/shallow'
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
      } = useDataStatisticsStore(
        useShallow(state => ({
          dataDetails: state.dataDetails,
          currentDetailType: state.currentDetailType,
          setCurrentDetailType: state.setCurrentDetailType,
          setTimeRangeValue: state.setTimeRangeValue,
          timeRangeValue: state.timeRangeValue,
        })),
      )
      const { t } = useTransClient('dataStatistics')

      return (
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
      )
    },
  ),
)

export default DataStatisticsDetails
