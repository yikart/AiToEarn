import type { DayCellContentArg } from '@fullcalendar/core'
import type { ForwardedRef } from 'react'
import type { PublishRecordItem } from '@/api/plat/types/publish.types'
import { DownOutlined, PlusOutlined, UpOutlined } from '@ant-design/icons'
import { Button, Skeleton } from 'antd'
import dayjs from 'dayjs'
import { forwardRef, memo, useEffect, useMemo, useRef, useState } from 'react'
import { useDrop } from 'react-dnd'
import { useShallow } from 'zustand/react/shallow'
import { useCalendarTiming } from '@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming'
import { useTransClient } from '@/app/i18n/client'
import styles from './components/calendarTimingItem.module.scss'
import CalendarRecord from './components/CalendarRecord'
import { CustomDragLayer } from './components/CustomDragLayer'

export interface ICalendarTimingItemRef {}

export interface ICalendarTimingItemProps {
  arg: DayCellContentArg
  onClickPub: (date: string) => void
  loading: boolean
  // 发布记录数据
  records?: PublishRecordItem[]
}

const CalendarTimingItem = memo(
  forwardRef(
    (
      { arg, onClickPub, loading, records }: ICalendarTimingItemProps,
      ref: ForwardedRef<ICalendarTimingItemRef>,
    ) => {
      const { t } = useTransClient('account')
      // arg.date 是当前格子的日期，Date 类型
      const today = new Date()

      // 🔧 测试模式：模拟今天是1号（取消注释下面一行来测试）
      // today.setDate(30);

      // 去掉时分秒，只比较年月日
      const argDate = new Date(
        arg.date.getFullYear(),
        arg.date.getMonth(),
        arg.date.getDate(),
      )
      const nowDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      )
      // [[小时，分钟]] [[4, 12]]
      const [reservationsTimes, setReservationsTimes] = useState([])
      const [{ canDrop, isOver }, drop] = useDrop(
        () => ({
          accept: 'box',
          drop: () => ({
            time: arg,
          }),
          collect: monitor => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
          }),
        }),
        [],
      )
      const [isMore, setIsMore] = useState(false)
      const cellRef = useRef<HTMLDivElement | null>(null)
      const { recordMap } = useCalendarTiming(
        useShallow(state => ({
          recordMap: state.recordMap,
        })),
      )

      const reservationsTimesLast = useMemo(() => {
        return argDate >= nowDate ? reservationsTimes : []
      }, [reservationsTimes])

      const recordsLast = useMemo(() => {
        if (!records)
          return []
        if (isMore) {
          return records
        }
        else {
          return records?.slice(0, 3 - reservationsTimesLast.length)
        }
      }, [isMore, records, reservationsTimesLast, recordMap])

      // 进入视图时将“今天”尽量居中显示
      useEffect(() => {
        if (argDate.getTime() === nowDate.getTime()) {
          // 推迟到布局完成后再滚动
          setTimeout(() => {
            cellRef.current?.scrollIntoView({ block: 'center', inline: 'nearest' })
          }, 0)
        }
      }, [])

      return (
        <div
          ref={(node) => {
            if (argDate >= nowDate) {
              drop(node)
            }
            cellRef.current = node
          }}
          className={[
            'calendarTimingItem--js',
            styles.calendarTimingItem,
            argDate < nowDate ? styles.calendarTimingItemPast : '',
            isOver ? styles.calendarTimingItem_over : '',
          ].join(' ')}
        >
          <div className="calendarTimingItem-top">
            <div className="calendarTimingItem-top-day">
              {arg.date.getDate()}
            </div>

            {argDate >= nowDate && (
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => {
                  const days = dayjs(arg.date)
                  const today = dayjs()

                  if (today.date() === days.date()) {
                    onClickPub(today.add(10, 'minute').format())
                  }
                  else {
                    onClickPub(days.format())
                  }
                }}
              />
            )}
          </div>
          {loading
            ? (
                <>
                  <Skeleton.Button active={true} block={true} size="small" />
                </>
              )
            : (
                <div className="calendarTimingItem-con">
                  {argDate >= nowDate
                    && reservationsTimesLast.map((v, i) => {
                      return (
                        <Button
                          key={i}
                          size="small"
                          type="dashed"
                          onClick={() => {
                            const days = dayjs(arg.date)
                              .set('hour', v[0])
                              .set('minute', v[1])
                            onClickPub(days.format())
                          }}
                        >
                          <div className="calendarTimingItem-con-btn1">
                            {v[0]}
                            :
                            {v[1]}
                            {' '}
                            PM
                          </div>
                          <div className="calendarTimingItem-con-btn2">
                            {t('addPost')}
                          </div>
                        </Button>
                      )
                    })}
                  {records
                    && recordsLast.map((v) => {
                      return (
                        <div key={v.id + v.title + v.uid + v.updatedAt}>
                          <CustomDragLayer publishRecord={v} snapToGrid={false} />
                          <CalendarRecord publishRecord={v} />
                        </div>
                      )
                    })}

                  {records && records.length > 3 - reservationsTimesLast.length && (
                    <Button
                      type="text"
                      style={{
                        height: 'auto',
                        width: 'auto',
                        padding: '3px 10px',
                        fontSize: 'var(--fs-sm)',
                        marginBottom: '0',
                      }}
                      onClick={() => {
                        setIsMore(!isMore)
                      }}
                    >
                      {isMore
                        ? (
                            <>
                              <UpOutlined style={{ marginRight: '8px' }} />
                              {t('calendar.hideMore')}
                            </>
                          )
                        : (
                            <>
                              <DownOutlined style={{ marginRight: '8px' }} />
                              {records.length - recordsLast?.length}
                              {' '}
                              {t('calendar.showMore')}
                            </>
                          )}
                    </Button>
                  )}
                </div>
              )}
        </div>
      )
    },
  ),
)

export default CalendarTimingItem
