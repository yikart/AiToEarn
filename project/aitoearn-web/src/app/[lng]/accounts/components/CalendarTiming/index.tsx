/**
 * CalendarTiming 组件
 *
 * 功能描述: 日历定时发布组件 - 显示日历视图，管理发布任务
 * - PC端：支持周视图/月视图切换，使用 FullCalendar（月视图）或自定义组件（周视图）
 * - 移动端：使用自定义周视图/月视图 + 任务列表
 */

import type { DatesSetArg } from '@fullcalendar/core'
import type { ForwardedRef } from 'react'
import type { IPublishDialogRef } from '@/components/PublishDialog'
import type { CalendarViewType } from '@/store/system'
import dayGridPlugin from '@fullcalendar/daygrid'
import FullCalendar from '@fullcalendar/react'
import dayjs from 'dayjs'
import { useSearchParams } from 'next/navigation'
import { forwardRef, memo, useCallback, useEffect, useRef, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { CSSTransition } from 'react-transition-group'
import { useShallow } from 'zustand/react/shallow'
import {
  getDays,
  getFullCalendarLang,
  getMonthDateRange,
  getTransitionClassNames,
  getWeekDateRange,
} from '@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils'
import CalendarToolbar from '@/app/[lng]/accounts/components/CalendarTiming/CalendarToolbar'
import { useCalendarTiming } from '@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming'
import { useNewWork } from '@/app/[lng]/accounts/hooks/useNewWork'
import PublishDialog from '@/components/PublishDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useGetClientLng } from '@/hooks/useSystem'
import { useAccountStore } from '@/store/account'
import { useSystemStore } from '@/store/system'
import CalendarTimingItem from '../CalendarTimingItem'
import MobileCalendar from './MobileCalendar'
import PCWeekView from './PCWeekView'
import './calendarTiming.scss'

export interface ICalendarTimingRef {}
export interface ICalendarTimingProps {}

const CalendarTiming = memo(
  forwardRef(({}: ICalendarTimingProps, ref: ForwardedRef<ICalendarTimingRef>) => {
    const lng = useGetClientLng()
    const isMobile = useIsMobile()
    const searchParams = useSearchParams()
    const calendarRef = useRef<FullCalendar | null>(null)
    const [animating, setAnimating] = useState(false)
    // 方向：'left'（下月/下周）、'right'（上月/上周）、'fade' （今天）
    const [direction, setDirection] = useState<'left' | 'right' | 'fade'>('left')
    const [currentDate, setCurrentDate] = useState<Date>(new Date())

    // 从持久化 store 获取视图类型
    const { calendarViewType, setCalendarViewType, _hasHydrated } = useSystemStore(
      useShallow(state => ({
        calendarViewType: state.calendarViewType,
        setCalendarViewType: state.setCalendarViewType,
        _hasHydrated: state._hasHydrated,
      })),
    )

    const handleDatesSet = (arg: DatesSetArg) => {
      const date = calendarRef.current?.getApi().getDate()
      if (date) {
        setCurrentDate(date)
      }
    }
    const calendarTimingCalendarRef = useRef<HTMLDivElement>(null)
    const [publishDialogOpen, setPublishDialogOpen] = useState(false)
    const [defaultAccountIds, setDefaultAccountIds] = useState<string[]>()
    const { accountList, accountActive } = useAccountStore(
      useShallow(state => ({
        accountList: state.accountList,
        accountActive: state.accountActive,
      })),
    )

    // 使用新建作品 hook
    const publishDialogRef = useRef<IPublishDialogRef>(null)
    const { openNewWork } = useNewWork({
      publishDialogRef,
      setPublishDialogOpen,
      setDefaultAccountIds,
    })

    const { setCalendarCallWidth, listLoading, recordMap, setCalendarRef, getPubRecord }
      = useCalendarTiming(
        useShallow(state => ({
          setCalendarCallWidth: state.setCalendarCallWidth,
          listLoading: state.listLoading,
          recordMap: state.recordMap,
          getPubRecord: state.getPubRecord,
          setCalendarRef: state.setCalendarRef,
        })),
      )

    useEffect(() => {
      setCalendarRef(calendarRef.current!)
      window.addEventListener('resize', handleResize)

      // 根据视图类型决定是否传入日期范围
      if (calendarViewType === 'week') {
        getPubRecord({ dateRange: getWeekDateRange(currentDate) })
      }
      else {
        getPubRecord({ dateRange: getMonthDateRange(currentDate) })
      }

      setTimeout(() => {
        handleResize()
      }, 1)

      // 清理事件监听
      return () => window.removeEventListener('resize', handleResize)
    }, [])

    // 监听 URL 参数，自动打开发布弹窗
    useEffect(() => {
      const openPublish = searchParams.get('openPublish')
      const fromSignIn = searchParams.get('fromSignIn')

      if (openPublish === 'true' && fromSignIn === 'true') {
        setPublishDialogOpen(true)
        // 清除 URL 参数，避免刷新页面时重复打开
        const url = new URL(window.location.href)
        url.searchParams.delete('openPublish')
        url.searchParams.delete('fromSignIn')
        window.history.replaceState({}, '', url.toString())
      }
    }, [searchParams])

    // 监听自定义事件，打开发布弹窗
    useEffect(() => {
      const handleOpenPublishDialog = (event: CustomEvent) => {
        if (event.detail?.fromSignIn) {
          setPublishDialogOpen(true)
        }
      }

      window.addEventListener('openPublishDialog', handleOpenPublishDialog as EventListener)

      return () => {
        window.removeEventListener('openPublishDialog', handleOpenPublishDialog as EventListener)
      }
    }, [])

    useEffect(() => {
      // 账号切换或视图类型切换时重新获取数据
      // 注意：不依赖 currentDate，因为日期变化在导航函数中已处理
      if (calendarViewType === 'week') {
        getPubRecord({ dateRange: getWeekDateRange(currentDate) })
      }
      else {
        getPubRecord({ dateRange: getMonthDateRange(currentDate) })
      }
    }, [accountActive, calendarViewType])

    // 处理窗口大小变化
    const handleResize = () => {
      setTimeout(() => {
        const el = document.querySelector('.calendarTimingItem--js')
        if (!el)
          return

        const style = window.getComputedStyle(el)
        const paddingLeft = Number.parseFloat(style.paddingLeft)
        const paddingRight = Number.parseFloat(style.paddingRight)

        setCalendarCallWidth(el.clientWidth - (paddingLeft + paddingRight))
      }, 100)
    }

    // 动画触发函数
    const triggerAnimation = (dir: 'left' | 'right' | 'fade') => {
      if (calendarTimingCalendarRef.current) {
        calendarTimingCalendarRef.current.scrollTop = 0
      }
      setDirection(dir)
      setAnimating(true)
    }

    // 点击上/下月（或上/下周）按钮时
    const handlePrev = () => {
      triggerAnimation('right')
      setTimeout(() => {
        if (calendarViewType === 'month') {
          calendarRef.current?.getApi().prev()
          const newDate = dayjs(currentDate).subtract(1, 'month').toDate()
          setCurrentDate(newDate)
          getPubRecord({ dateRange: getMonthDateRange(newDate) })
        }
        else {
          // 周视图：前一周
          const newDate = dayjs(currentDate).subtract(1, 'week').toDate()
          setCurrentDate(newDate)
          getPubRecord({ dateRange: getWeekDateRange(newDate) })
        }
        setAnimating(false)
      }, 300)
    }

    const handleNext = () => {
      triggerAnimation('left')
      setTimeout(() => {
        if (calendarViewType === 'month') {
          calendarRef.current?.getApi().next()
          const newDate = dayjs(currentDate).add(1, 'month').toDate()
          setCurrentDate(newDate)
          getPubRecord({ dateRange: getMonthDateRange(newDate) })
        }
        else {
          // 周视图：后一周
          const newDate = dayjs(currentDate).add(1, 'week').toDate()
          setCurrentDate(newDate)
          getPubRecord({ dateRange: getWeekDateRange(newDate) })
        }
        setAnimating(false)
      }, 300)
    }

    // 点击Today按钮时
    const handleToday = () => {
      triggerAnimation('fade')
      setTimeout(() => {
        const today = new Date()
        if (calendarViewType === 'month') {
          calendarRef.current?.getApi().today()
          setCurrentDate(today)
          getPubRecord({ dateRange: getMonthDateRange(today) })
        }
        else {
          // 周视图：回到今天所在的周
          setCurrentDate(today)
          getPubRecord({ dateRange: getWeekDateRange(today) })
        }
        setAnimating(false)
      }, 300)
    }

    // 视图类型切换
    const handleViewTypeChange = useCallback(
      (type: CalendarViewType) => {
        setCalendarViewType(type)
        // 切换视图时重新获取数据
        setTimeout(() => {
          if (type === 'week') {
            getPubRecord({ dateRange: getWeekDateRange(currentDate) })
          }
          else {
            getPubRecord({ dateRange: getMonthDateRange(currentDate) })
            // 切换到月视图时，需要重新计算日历单元格宽度
            // 延迟执行，等待 DOM 渲染完成
            setTimeout(() => {
              handleResize()
            }, 50)
          }
        }, 100)
      },
      [setCalendarViewType, getPubRecord, currentDate, handleResize],
    )

    // FullCalendar 内容（移动端不包裹 DndProvider）
    const calendarContent = (
      <FullCalendar
        ref={calendarRef}
        locale={getFullCalendarLang(lng)}
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        initialDate={currentDate}
        headerToolbar={false}
        stickyFooterScrollbar={true}
        dayCellContent={(arg) => {
          const dateStr = getDays(arg.date).format('YYYY-MM-DD')
          return (
            <CalendarTimingItem
              key={dateStr}
              records={recordMap.get(dateStr)}
              loading={listLoading}
              arg={arg}
              onClickPub={date => openNewWork({ date })}
            />
          )
        }}
        datesSet={handleDatesSet}
      />
    )

    return (
      <div data-testid="calendar-container" className="flex flex-col flex-1 overflow-hidden">
        <PublishDialog
          defaultAccountIds={defaultAccountIds}
          ref={publishDialogRef}
          open={publishDialogOpen}
          onClose={() => {
            setPublishDialogOpen(false)
            setDefaultAccountIds(undefined)
          }}
          onPubSuccess={() => {
            getPubRecord({
              dateRange: calendarViewType === 'week'
                ? getWeekDateRange(currentDate)
                : getMonthDateRange(currentDate),
            })
          }}
          accounts={accountList}
        />

        {/* 移动端：使用自定义日历组件 */}
        {isMobile ? (
          <MobileCalendar onClickPub={date => openNewWork({ date })} />
        ) : (
          <>
            {/* PC端：等待持久化数据加载完成 */}
            {!_hasHydrated ? (
              <div className="flex flex-col flex-1 p-4 space-y-4">
                <Skeleton className="h-14 w-full" />
                <div className="flex-1 grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-full min-h-[400px]" />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* PC端：日历工具栏 */}
                <CalendarToolbar
                  currentDate={currentDate}
                  viewType={calendarViewType}
                  onPrev={handlePrev}
                  onNext={handleNext}
                  onToday={handleToday}
                  onViewTypeChange={handleViewTypeChange}
                />

                {/* PC端：主内容区域 - 日历视图 */}
                <div className="flex-1 overflow-hidden relative">
                  <CSSTransition
                    in={!animating}
                    timeout={300}
                    classNames={getTransitionClassNames(direction)}
                    unmountOnExit
                  >
                    {calendarViewType === 'month' ? (
                      <div
                        data-testid="calendar-month-view"
                        className="calendarTiming-calendar overflow-hidden"
                        id="calendarTiming-calendar"
                        ref={calendarTimingCalendarRef}
                      >
                        <DndProvider backend={HTML5Backend}>{calendarContent}</DndProvider>
                      </div>
                    ) : (
                      <PCWeekView
                        currentDate={currentDate}
                        recordMap={recordMap}
                        loading={listLoading}
                        onClickPub={date => openNewWork({ date })}
                      />
                    )}
                  </CSSTransition>
                </div>
              </>
            )}
          </>
        )}
      </div>
    )
  }),
)

export default CalendarTiming
