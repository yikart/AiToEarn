import type { ForwardedRef } from 'react'
import { Button, Select } from 'antd'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { forwardRef, memo, useEffect, useState } from 'react'
import styles from './cycleSelects.module.scss'

dayjs.extend(isoWeek)

export enum CycleTypeEnum {
  Week = 'week',
  Month = 'month',
}

interface CycleItemType {
  value: string
  label: string
}

export interface ICycleselectsRef {}

export interface ICycleselectsProps {
  onChange: (params: { type: CycleTypeEnum, value: string }) => void
  defaultType: CycleTypeEnum
  disable?: boolean
}

function CycleseCore({
  title,
  options,
  onChange,
  onActiveClick,
  isActive,
  value,
}: {
  onChange: (value: string) => void
  title: string
  options: CycleItemType[]
  onActiveClick: () => void
  isActive: boolean
  value: string
}) {
  return (
    <div className="cycleSelects-item">
      {isActive}
      {isActive
        ? (
            <>
              <div className="cycleSelects-item-label">{title}</div>
              <Select options={options} value={value} onChange={onChange}></Select>
            </>
          )
        : (
            <Button onClick={onActiveClick}>{title}</Button>
          )}
    </div>
  )
}

/**
 * 获取指定数量的月份
 * @param {number} skipMonths 跳过的月份数（当前月不算）
 * @param {number} numberOfMonths 获取的月份数
 */
function getMonths(skipMonths: number, numberOfMonths: number) {
  const currentMonth = dayjs().startOf('month') // 当前月的开始时间
  const months: CycleItemType[] = []

  for (let i = 0; i < numberOfMonths; i++) {
    const month = currentMonth.subtract(skipMonths + i + 1, 'month')
    months.push({
      label: month.format('YYYY年MM月'),
      value: month.format('YYYY-MM-DD'),
    })
  }

  return months
}

/**
 * 获取指定周范围的周
 * @param {number} skipWeeks 跳过的周数（当前周不算）
 * @param {number} numberOfWeeks 获取的周数
 */
function getWeekRanges(skipWeeks: number, numberOfWeeks: number) {
  const currentWeekStart = dayjs().startOf('isoWeek') // 当前周的开始时间（周一）
  const ranges: CycleItemType[] = []

  for (let i = 0; i < numberOfWeeks; i++) {
    const startOfWeek = currentWeekStart
      .subtract(skipWeeks + i + 1, 'week')
      .startOf('isoWeek')
    const endOfWeek = startOfWeek.endOf('isoWeek')
    ranges.push({
      label: `${startOfWeek.format('MM月DD日')} - ${endOfWeek.format('MM月DD日')}`,
      value: startOfWeek.format('YYYY-MM-DD'),
    })
  }

  return ranges
}

/**
 * 获取指定数量的日期
 * @param {number} skipDays 跳过的天数（当前日不算）
 * @param {number} numberOfDays 获取的天数
 */
function getDays(skipDays: number, numberOfDays: number) {
  const currentDay = dayjs().startOf('day') // 当前天的起始时间
  const days: CycleItemType[] = []

  for (let i = 0; i < numberOfDays; i++) {
    const day = currentDay.subtract(skipDays + i + 1, 'day')
    days.push({
      value: day.format('YYYY年MM月DD日'),
      label: day.format('YYYY-MM-DD'),
    })
  }

  return days
}

const Cycleselects = memo(
  forwardRef(
    (
      { onChange, defaultType, disable }: ICycleselectsProps,
      ref: ForwardedRef<ICycleselectsRef>,
    ) => {
      // 1周榜 2=月榜
      const [active, setActive] = useState<CycleTypeEnum>(defaultType)
      const [value, setValue] = useState('')
      const [weekOptions, setWeekOptions] = useState<CycleItemType[]>([])
      const [monthsOptions, setMonthsOptions] = useState<CycleItemType[]>([])

      useEffect(() => {
        const weekOptions = getWeekRanges(1, 3)
        setWeekOptions(weekOptions)

        const monthsOptions = getMonths(0, 3)
        setMonthsOptions(monthsOptions)

        if (defaultType === CycleTypeEnum.Week) {
          setValue(weekOptions[0].value)
        }
      }, [])

      useEffect(() => {
        if (!value)
          return
        onChange({
          type: active,
          value,
        })
      }, [value])

      useEffect(() => {
        if (active === CycleTypeEnum.Week) {
          if (weekOptions[0]?.value)
            setValue(weekOptions[0]?.value)
          return
        }
        if (active === CycleTypeEnum.Month) {
          if (monthsOptions[0]?.value)
            setValue(monthsOptions[0]?.value)
        }
      }, [active])

      return (
        <div className={styles.cycleSelects}>
          <CycleseCore
            value={value}
            isActive={active === CycleTypeEnum.Week}
            onActiveClick={() => {
              if (disable)
                return
              setActive(CycleTypeEnum.Week)
            }}
            onChange={setValue}
            title="周榜"
            options={weekOptions}
          />

          <CycleseCore
            value={value}
            isActive={active === CycleTypeEnum.Month}
            onActiveClick={() => {
              if (disable)
                return
              setActive(CycleTypeEnum.Month)
            }}
            onChange={setValue}
            title="月榜"
            options={monthsOptions}
          />
        </div>
      )
    },
  ),
)
Cycleselects.displayName = 'Cycleselects'

export default Cycleselects
