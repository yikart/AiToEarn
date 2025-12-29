/**
 * CalendarTiming 组件
 *
 * 功能描述: 日历定时发布组件 - 显示日历视图或列表视图,管理发布任务
 * 重构说明: 已移除顶部header和toolbar,使用新的CalendarToolbar组件
 */

import type { DatesSetArg } from '@fullcalendar/core'
import type {
  ForwardedRef,
} from 'react'
import type { IPublishDialogRef } from '@/components/PublishDialog'
import dayGridPlugin from '@fullcalendar/daygrid'
import FullCalendar from '@fullcalendar/react'
import { useSearchParams } from 'next/navigation'
import {
  forwardRef,
  memo,
  useEffect,
  useRef,
  useState,
} from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { CSSTransition } from 'react-transition-group'
import { useShallow } from 'zustand/react/shallow'
import {
  getDays,
  getFullCalendarLang,
  getTransitionClassNames,
} from '@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils'
import CalendarToolbar from '@/app/[lng]/accounts/components/CalendarTiming/CalendarToolbar'
import ListMode from '@/app/[lng]/accounts/components/CalendarTiming/ListMode'
import { useCalendarTiming } from '@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming'
import PublishDialog from '@/components/PublishDialog'
import { PublishDatePickerType } from '@/components/PublishDialog/compoents/PublishDatePicker/publishDatePicker.enums'
import { useGetClientLng } from '@/hooks/useSystem'
import { useAccountStore } from '@/store/account'
import { useUserStore } from '@/store/user'
import CalendarTimingItem from '../CalendarTimingItem'
import './calendarTiming.scss'

export interface ICalendarTimingRef {}
export interface ICalendarTimingProps {}

const CalendarTiming = memo(
  forwardRef(
    ({}: ICalendarTimingProps, ref: ForwardedRef<ICalendarTimingRef>) => {
      const lng = useGetClientLng()
      const searchParams = useSearchParams()
      const calendarRef = useRef<FullCalendar | null>(null)
      const [animating, setAnimating] = useState(false)
      // 方向：'left'（下月）、'right'（上月）、'fade' （今天）
      const [direction, setDirection] = useState<'left' | 'right' | 'fade'>(
        'left',
      )
      const [currentDate, setCurrentDate] = useState<Date>(new Date())
      const [activeMode, setActiveMode] = useState<'calendar' | 'list'>(
        'calendar',
      )
      const handleDatesSet = (arg: DatesSetArg) => {
        const date = calendarRef.current?.getApi().getDate()
        if (date) {
          setCurrentDate(date)
        }
      }
      const calendarTimingCalendarRef = useRef<HTMLDivElement>(null)
      const [publishDialogOpen, setPublishDialogOpen] = useState(false)
      const { accountList, accountActive } = useAccountStore(
        useShallow(state => ({
          accountList: state.accountList,
          accountActive: state.accountActive,
        })),
      )

      const {
        setCalendarCallWidth,
        listLoading,
        recordMap,
        setCalendarRef,
        getPubRecord,
        getQueueRecord,
      } = useCalendarTiming(
        useShallow(state => ({
          setCalendarCallWidth: state.setCalendarCallWidth,
          listLoading: state.listLoading,
          recordMap: state.recordMap,
          getPubRecord: state.getPubRecord,
          getQueueRecord: state.getQueueRecord,
          setCalendarRef: state.setCalendarRef,
        })),
      )
      const publishDialogRef = useRef<IPublishDialogRef>(null)

      useEffect(() => {
        setCalendarRef(calendarRef.current!)
        window.addEventListener('resize', handleResize)
        if (activeMode === 'list') {
          getQueueRecord(0)
        }
        else {
          getPubRecord()
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

        window.addEventListener(
          'openPublishDialog',
          handleOpenPublishDialog as EventListener,
        )

        return () => {
          window.removeEventListener(
            'openPublishDialog',
            handleOpenPublishDialog as EventListener,
          )
        }
      }, [])

      useEffect(() => {
        if (activeMode === 'list') {
          getQueueRecord(0)
        }
        else {
          getPubRecord()
        }
      }, [accountActive, activeMode, getPubRecord, getQueueRecord])

      // 处理窗口大小变化
      const handleResize = () => {
        setTimeout(() => {
          const el = document.querySelector('.calendarTimingItem--js')!
          const style = window.getComputedStyle(el)
          const paddingLeft = Number.parseFloat(style.paddingLeft)
          const paddingRight = Number.parseFloat(style.paddingRight)

          setCalendarCallWidth(el.clientWidth - (paddingLeft + paddingRight))
        }, 100)
      }

      // 动画触发函数
      const triggerAnimation = (dir: 'left' | 'right' | 'fade') => {
        calendarTimingCalendarRef.current!.scrollTop = 0
        setDirection(dir)
        setAnimating(true)
      }

      // 点击上/下月按钮时
      const handlePrev = () => {
        triggerAnimation('right')
        setTimeout(() => {
          calendarRef.current?.getApi().prev()
          setAnimating(false)
          getPubRecord()
        }, 300)
      }
      const handleNext = () => {
        triggerAnimation('left')
        setTimeout(() => {
          calendarRef.current?.getApi().next()
          setAnimating(false)
          getPubRecord()
        }, 300)
      }
      // 点击Today按钮时
      const handleToday = () => {
        triggerAnimation('fade')
        setTimeout(() => {
          calendarRef.current?.getApi().today()
          setAnimating(false)
          getPubRecord()
        }, 300)
      }

      return (
        <div className="flex flex-col flex-1 overflow-hidden">
          <PublishDialog
            defaultAccountId={accountActive?.id}
            ref={publishDialogRef}
            open={publishDialogOpen}
            onClose={() => setPublishDialogOpen(false)}
            onPubSuccess={() => {
              getPubRecord()
            }}
            accounts={accountList}
          />

          {/* 日历工具栏 (Row 2) */}
          <CalendarToolbar
            activeMode={activeMode}
            onModeChange={setActiveMode}
            currentDate={currentDate}
            onPrev={handlePrev}
            onNext={handleNext}
            onToday={handleToday}
          />

          {/* 主内容区域 - 日历或列表视图 */}
          <div className="flex-1 overflow-hidden relative">
            {activeMode === 'calendar'
              ? (
                  <CSSTransition
                    in={!animating}
                    timeout={300}
                    classNames={getTransitionClassNames(direction)}
                    unmountOnExit
                  >
                    <div
                      className="calendarTiming-calendar overflow-hidden"
                      id="calendarTiming-calendar"
                      ref={calendarTimingCalendarRef}
                    >
                      <DndProvider backend={HTML5Backend}>
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
                                onClickPub={(date) => {
                                  useUserStore.getState().setCurrentDatePickerType(PublishDatePickerType.DATE)
                                  publishDialogRef.current!.setPubTime(date)
                                  setPublishDialogOpen(true)
                                }}
                              />
                            )
                          }}
                          datesSet={handleDatesSet}
                        />
                      </DndProvider>
                    </div>
                  </CSSTransition>
                )
              : (
                  <ListMode
                    onClickPub={(date) => {
                      publishDialogRef.current!.setPubTime(date)
                      setPublishDialogOpen(true)
                    }}
                  />
                )}
          </div>
        </div>
      )
    },
  ),
)

export default CalendarTiming
