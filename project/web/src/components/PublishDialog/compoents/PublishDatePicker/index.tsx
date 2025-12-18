import type { Dayjs } from 'dayjs'
import type {
  ForwardedRef,
} from 'react'
import {
  ArrowLeftOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  DownOutlined,
  PushpinOutlined,
  SendOutlined,
  StarFilled,
  StarOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { Button, DatePicker, Popover, Space } from 'antd'
import { toast } from '@/lib/toast'
import dayjs from 'dayjs'
import {
  forwardRef,
  memo,
  useMemo,
  useState,
} from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import { PublishDatePickerType } from '@/components/PublishDialog/compoents/PublishDatePicker/publishDatePicker.enums'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { useUserStore } from '@/store/user'
import styles from './publishDatePicker.module.scss'

export interface IPublishDatePickerRef {
}

export interface IPublishDatePickerProps {
  loading: boolean
  onClick: () => void
}

const PublishDatePicker = memo(
  forwardRef(
    (
      { loading, onClick }: IPublishDatePickerProps,
      ref: ForwardedRef<IPublishDatePickerRef>,
    ) => {
      const { t } = useTransClient('publish')
      const [menuOpen, setMenuOpen] = useState(false)
      const [tempDate, setTempDate] = useState<Dayjs | null>(null)
      const [showMenu, setShowMenu] = useState(true)
      const { pubTime, setPubTime } = usePublishDialog(
        useShallow(state => ({
          pubTime: state.pubTime,
          setPubTime: state.setPubTime,
        })),
      )
      const { currentDatePickerType, defaultCurrentDatePickerType, setDefaultCurrentDatePickerType, setCurrentDatePickerType } = useUserStore(
        useShallow(state => ({
          currentDatePickerType: state.currentDatePickerType,
          defaultCurrentDatePickerType: state.defaultCurrentDatePickerType,
          setCurrentDatePickerType: state.setCurrentDatePickerType,
          setDefaultCurrentDatePickerType: state.setDefaultCurrentDatePickerType,
        })),
      )

      const handleCalendarChange = (date: Dayjs | Dayjs[]) => {
        setTempDate(date as Dayjs)
      }

      const handleConfirm = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (currentDatePickerType === PublishDatePickerType.DATE) {
          setPubTime(tempDate ? tempDate.format() : undefined)
        }
        else {
          setPubTime(undefined)
        }
        setMenuOpen(false)
        setShowMenu(true)
      }

      const handleSelectPublishType = (type: PublishDatePickerType) => {
        setCurrentDatePickerType(type)
        if (type === PublishDatePickerType.Now) {
          setPubTime(undefined)
          setMenuOpen(false)
          setShowMenu(true)
        }
        else {
          setShowMenu(false)
        }
      }

      const handleBackToMenu = (e: React.MouseEvent) => {
        e.stopPropagation()
        setShowMenu(true)
      }

      const handleToggleFavorite = (type: PublishDatePickerType) => {
        if (defaultCurrentDatePickerType === type) {
          setDefaultCurrentDatePickerType(PublishDatePickerType.DATE)
        }
        else {
          setDefaultCurrentDatePickerType(type)
        }
      }

      // 禁用今天之前的日期
      const disabledDate = (current: dayjs.Dayjs) => {
        return current && current < dayjs().startOf('day')
      }

      // 禁用当前时间之前和当前时间20分钟内的时间（只精确到分钟，不考虑秒）
      const disabledDateTime = (current: dayjs.Dayjs | null) => {
        if (!current)
          return {}

        const now = dayjs()
        const minTime = now.add(20, 'minute')

        // 只对今天限制
        if (current.isSame(now, 'day')) {
          const minHour = minTime.hour()
          const minMinute = minTime.minute()

          // 禁用小时
          const disabledHours = () => {
            const hours: number[] = []
            for (let i = 0; i < 24; i++) {
              if (i < minHour)
                hours.push(i)
            }
            return hours
          }

          // 禁用分钟
          const disabledMinutes = (selectedHour: number) => {
            const minutes: number[] = []
            if (selectedHour === minHour) {
              for (let i = 0; i < minMinute; i++) {
                minutes.push(i)
              }
            }
            else if (selectedHour < minHour) {
              // 小时都禁用了，分钟全部禁用
              for (let i = 0; i < 60; i++) {
                minutes.push(i)
              }
            }
            return minutes
          }

          return {
            disabledHours,
            disabledMinutes,
          }
        }
        // 非今天不限制
        return {}
      }

      const pubTimeValue = useMemo(() => {
        if (pubTime) {
          return dayjs(pubTime)
        }
        return null
      }, [pubTime])

      // 当打开弹窗时，初始化临时日期
      const handleOpenChange = (open: boolean) => {
        if (open) {
          setTempDate(pubTimeValue)
          // 如果当前是定时发布，直接显示日期选择器；否则显示菜单
          setShowMenu(currentDatePickerType === PublishDatePickerType.Now)
        }
        setMenuOpen(open)
      }

      // 菜单选项内容
      const menuContent = (
        <div className={styles.menuContent}>
          <div
            className={`${styles.menuItem} ${currentDatePickerType === PublishDatePickerType.Now ? styles.menuItemActive : ''}`}
            onClick={() => handleSelectPublishType(PublishDatePickerType.Now)}
          >
            <div className={styles.menuItemLeft}>
              <SendOutlined className={styles.menuIcon} />
              <div className={styles.menuItemText}>
                <div className={styles.menuItemTitle}>{t('buttons.publishNow')}</div>
                <div className={styles.menuItemDesc}>{t('buttons.publishNowDesc')}</div>
              </div>
            </div>
            <div className={styles.menuItemRight}>
              <Button
                type="text"
                size="small"
                title={t('buttons.defaultPublishAction')}
                icon={defaultCurrentDatePickerType === PublishDatePickerType.Now ? <StarFilled /> : <StarOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleFavorite(PublishDatePickerType.Now)
                }}
              />
            </div>
          </div>
          <div
            className={`${styles.menuItem} ${currentDatePickerType === PublishDatePickerType.DATE ? styles.menuItemActive : ''}`}
            onClick={() => handleSelectPublishType(PublishDatePickerType.DATE)}
          >
            <div className={styles.menuItemLeft}>
              <ClockCircleOutlined className={styles.menuIcon} />
              <div className={styles.menuItemText}>
                <div className={styles.menuItemTitle}>{t('buttons.setDateTime')}</div>
                <div className={styles.menuItemDesc}>{t('buttons.schedulePublishDesc')}</div>
              </div>
            </div>
            <div className={styles.menuItemRight}>
              <Button
                type="text"
                size="small"
                title={t('buttons.defaultPublishAction')}
                icon={defaultCurrentDatePickerType === PublishDatePickerType.DATE ? <StarFilled /> : <StarOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleFavorite(PublishDatePickerType.DATE)
                }}
              />
            </div>
          </div>
        </div>
      )

      // 日期选择器内容
      const datePickerContent = (
        <div className={styles.datePickerContent}>
          <DatePicker
            showTime={{ format: 'HH:mm' }}
            format="YYYY-MM-DD HH:mm"
            value={tempDate}
            onCalendarChange={handleCalendarChange}
            disabledDate={disabledDate}
            disabledTime={disabledDateTime}
            showNow={false}
            renderExtraFooter={() => (
              <div className={styles.datePickerFooter}>
                <Button
                  type="text"
                  size="small"
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToMenu}
                >
                  {t('buttons.morePostingActions')}
                </Button>

                <Button
                  type="text"
                  size="small"
                  onClick={handleConfirm}
                  icon={<CheckOutlined />}
                >
                  {t('buttons.confirm')}
                </Button>
              </div>
            )}
            open
            getPopupContainer={trigger => trigger.parentElement || document.body}
          />
        </div>
      )

      return (
        <Space.Compact size="large">
          <Popover
            rootClassName={styles.publishDatePicker}
            open={menuOpen}
            content={showMenu ? menuContent : datePickerContent}
            trigger="click"
            onOpenChange={handleOpenChange}
            arrow={false}
            styles={{ body: { padding: 0 } }}
          >
            <Button
              style={{ margin: '0', display: 'flex', alignItems: 'center', gap: '10px' }}
              onClick={() => {
                setMenuOpen(true)
              }}
            >
              {
                currentDatePickerType === PublishDatePickerType.Now
                  ? <SendOutlined style={{ fontSize: '16px' }} />
                  : <ClockCircleOutlined style={{ fontSize: '16px' }} />
              }
              <span style={{ flex: 1, textAlign: 'left' }}>
                {currentDatePickerType === PublishDatePickerType.Now
                  ? t('buttons.publishNow')
                  : pubTimeValue
                    ? pubTimeValue.format('YYYY-MM-DD HH:mm')
                    : t('buttons.schedulePublish')}
              </span>
              <DownOutlined style={{ fontSize: '16px' }} />
            </Button>
          </Popover>
          <Button
            size="large"
            type="primary"
            loading={loading}
            onClick={() => {
              onClick()
            }}
          >
            {t('buttons.schedulePublish')}
          </Button>
        </Space.Compact>
      )
    },
  ),
)

export default PublishDatePicker
