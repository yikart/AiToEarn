import type { DatesSetArg } from '@fullcalendar/core'
import type {
  ForwardedRef,
} from 'react'
import type { IPublishDialogRef } from '@/components/PublishDialog'
import {
  CalendarOutlined,
  DownOutlined,
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
  SearchOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import dayGridPlugin from '@fullcalendar/daygrid'
import FullCalendar from '@fullcalendar/react'
import { Avatar, Button, Dropdown, Input, Tabs } from 'antd'
import { confirm } from '@/lib/confirm'
import dayjs from 'dayjs'
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
import AllPlatIcon from '@/app/[lng]/accounts/components/CalendarTiming/AllPlatIcon'
import {
  getDays,
  getFullCalendarLang,
  getTransitionClassNames,
} from '@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils'
import CalendarTimingItem from '@/app/[lng]/accounts/components/CalendarTiming/CalendarTimingItem'
import ListMode from '@/app/[lng]/accounts/components/CalendarTiming/ListMode'
import { useCalendarTiming } from '@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming'
import { AccountStatus } from '@/app/config/accountConfig'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import AvatarPlat from '@/components/AvatarPlat'
import PublishDialog from '@/components/PublishDialog'
import { PublishDatePickerType } from '@/components/PublishDialog/compoents/PublishDatePicker/publishDatePicker.enums'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { useGetClientLng } from '@/hooks/useSystem'
import { useAccountStore } from '@/store/account'
import { useUserStore } from '@/store/user'
import { getOssUrl } from '@/utils/oss'
import styles from './calendarTiming.module.scss'

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
      const { t } = useTransClient('account')
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
      const { accountList, accountActive, setAccountActive } = useAccountStore(
        useShallow(state => ({
          accountList: state.accountList,
          accountActive: state.accountActive,
          setAccountActive: state.setAccountActive,
        })),
      )

      // 频道筛选相关状态
      const [channelSearchText, setChannelSearchText] = useState('')

      // 筛选后的账户列表 - 只显示在线账户
      const filteredAccounts = accountList.filter(
        account =>
          account.status === AccountStatus.USABLE
          && (account.nickname
            .toLowerCase()
            .includes(channelSearchText.toLowerCase())
            || account.account
              .toLowerCase()
              .includes(channelSearchText.toLowerCase())),
      )

      // 处理账户选择 - 与 AccountSidebar 同步
      const handleChannelSelect = (account: any) => {
        setAccountActive(account)
      }

      // Channel 筛选器下拉菜单内容
      const channelDropdownContent = (
        <div
          style={{
            width: '280px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 16px 0 16px' }}>
            <Input
              placeholder={t('listMode.searchChannels' as any)}
              prefix={<SearchOutlined />}
              value={channelSearchText}
              onChange={e => setChannelSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div
            style={{ maxHeight: '300px', overflowY: 'auto', padding: '8px 0' }}
          >
            {filteredAccounts.length > 0
              ? (
                  filteredAccounts.map((account) => {
                    const platInfo = AccountPlatInfoMap.get(account.type)
                    return (
                      <div
                        key={account.id}
                        style={{
                          padding: '8px 16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          borderBottom: '1px solid #f5f5f5',
                          backgroundColor:
                        accountActive?.id === account.id
                          ? '#e6f7ff'
                          : 'transparent',
                        }}
                        onClick={() => handleChannelSelect(account)}
                        onMouseEnter={(e) => {
                          if (accountActive?.id !== account.id) {
                            e.currentTarget.style.backgroundColor = '#f5f5f5'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (accountActive?.id !== account.id) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                          }}
                        >
                          <Avatar
                            src={getOssUrl(account.avatar)}
                            size={32}
                            style={{ flexShrink: 0, border: '1px solid #f0f0f0' }}
                          >
                            {account.nickname?.[0] || account.account?.[0]}
                          </Avatar>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '14px',
                                color: '#333',
                                fontWeight: 500,
                                marginBottom: '4px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {account.nickname || account.account}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '12px',
                                color: '#666',
                              }}
                            >
                              <img
                                src={platInfo?.icon}
                                alt={platInfo?.name}
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '2px',
                                }}
                              />
                              <span>{platInfo?.name}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )
              : (
                  <div
                    style={{
                      textAlign: 'center',
                      color: '#999',
                      fontSize: '14px',
                      padding: '40px 16px',
                    }}
                  >
                    {accountList.length === 0
                      ? t('sidebar.noAccounts')
                      : accountList.filter(
                        account => account.status === AccountStatus.USABLE,
                      ).length === 0
                        ? t('sidebar.noOnlineAccounts')
                        : t('listMode.noChannelsFound' as any)}
                  </div>
                )}
          </div>
        </div>
      )

      // Channel 筛选器按钮
      const channelFilter = (
        <div
          style={{ display: 'flex', alignItems: 'center', marginTop: '-15px' }}
        >
          <Dropdown
            menu={{
              items: [{ key: 'channelFilter', label: channelDropdownContent }],
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              style={{
                height: '32px',
                padding: '0 12px',
                borderRadius: '6px',
                border: 'none',
                background: 'white',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  paddingBottom: '2px',
                }}
              >
                {accountActive
                  ? (
                      <>
                        <Avatar
                          src={getOssUrl(accountActive.avatar)}
                          size={20}
                          style={{ flexShrink: 0 }}
                        >
                          {accountActive.nickname?.[0]
                            || accountActive.account?.[0]}
                        </Avatar>
                        <span
                          style={{
                            fontSize: '14px',
                            color: '#333',
                            width: '52px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {accountActive.nickname || accountActive.account}
                        </span>
                      </>
                    )
                  : (
                      <span
                        style={{
                          fontSize: '14px',
                          color: '#333',
                          width: '80px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t('listMode.selectChannel' as any)}
                      </span>
                    )}
                <DownOutlined
                  style={{ fontSize: '12px', color: '#666', flexShrink: 0 }}
                />
              </div>
            </Button>
          </Dropdown>
        </div>
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
        <div className={styles.calendarTiming}>
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

          <div className="calendarTiming-header">
            <div className="calendarTiming-header-user">
              {!accountActive
                ? (
                    <>
                      <AllPlatIcon />
                      <div className="calendarTiming-header-user-details">
                        <div className="calendarTiming-header-user-details-name">
                          {t('allPlatforms')}
                        </div>
                      </div>
                    </>
                  )
                : (
                    <>
                      <AvatarPlat
                        account={accountActive!}
                        avatarWidth={50}
                        width={18}
                      />
                      <div className="calendarTiming-header-user-details">
                        <div className="calendarTiming-header-user-details-name">
                          {accountActive.nickname}
                        </div>
                      </div>
                    </>
                  )}
            </div>
            <div className="calendarTiming-header-options">
              <Button
                size="large"
                icon={<PlusOutlined />}
                onClick={() => {
                  // 检查是否有可用账户
                  const hasAccounts = accountList.some(
                    account => account.status === AccountStatus.USABLE
                  )
                  
                  if (!hasAccounts) {
                    // 显示提示对话框
                    confirm({
                      title: t('noAccountWarning.title' as any),
                      content: t('noAccountWarning.content' as any),
                      okText: t('noAccountWarning.addAccount' as any),
                      cancelText: t('noAccountWarning.continuePublish' as any),
                      onOk: () => {
                        // 触发自定义事件，调用 AccountSidebar 的添加账户流程
                        window.dispatchEvent(new CustomEvent('openAddAccountFlow'))
                      },
                      onCancel: () => {
                        // 继续发布
                        setPublishDialogOpen(true)
                        usePublishDialog
                          .getState()
                          .setPubTime(
                            dayjs(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
                          )
                        useUserStore.getState().setCurrentDatePickerType()
                      },
                    })
                  } else {
                    // 有账户，直接打开发布对话框
                    setPublishDialogOpen(true)
                    usePublishDialog
                      .getState()
                      .setPubTime(
                        dayjs(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
                      )
                    useUserStore.getState().setCurrentDatePickerType()
                  }
                }}
              >
                {t('newWork')}
              </Button>
            </div>
          </div>
          <div className="calendarTiming-toolbar">
            <div className="calendarTiming-toolbar-left">
              {activeMode === 'calendar' && (
                <>
                  <Button
                    type="text"
                    icon={<LeftOutlined />}
                    onClick={handlePrev}
                  />
                  <Button
                    type="text"
                    icon={<RightOutlined />}
                    onClick={handleNext}
                  />
                  <h1>
                    {currentDate.getFullYear()}
                    -
                    {currentDate.getMonth() + 1}
                  </h1>
                  <Button onClick={handleToday}>{t('today')}</Button>
                </>
              )}
            </div>
            <div className="calendarTiming-toolbar-right">
              <Tabs
                activeKey={activeMode}
                onChange={(key) => {
                  const mode = key as 'calendar' | 'list'
                  if (mode !== activeMode) {
                    setActiveMode(mode)
                  }
                }}
                items={[
                  {
                    key: 'calendar',
                    label: (
                      <span>
                        <CalendarOutlined />
                        {t('calendarMode')}
                      </span>
                    ),
                  },
                  {
                    key: 'list',
                    label: (
                      <span>
                        <UnorderedListOutlined />
                        {t('listModeTab')}
                      </span>
                    ),
                  },
                ]}
                size="small"
                className={styles.modeTabs}
              />
              {channelFilter}
            </div>
          </div>
          {activeMode === 'calendar'
            ? (
                <CSSTransition
                  in={!animating}
                  timeout={300}
                  classNames={getTransitionClassNames(direction)}
                  unmountOnExit
                >
                  <div
                    className="calendarTiming-calendar"
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
      )
    },
  ),
)

export default CalendarTiming
