import type { Dayjs } from 'dayjs'
import type { SocialAccount } from '@/api/types/account.type'
import type { StatisticsPeriodModel } from '@/api/types/dataStatistics'
import type { IMilestone } from '@/app/[lng]/dataStatistics/components/MilestonePoster'
import type { PlatType } from '@/app/config/platConfig'
import {
  HeartFilled,
  MessageFilled,
  VideoCameraFilled,
} from '@ant-design/icons'
import { toast } from '@/lib/toast'
import dayjs from 'dayjs'
import { create } from 'zustand/index'
import { combine } from 'zustand/middleware'
import { getStatisticsPeriodApi } from '@/api/dataStatistics'
import drawDataStatisticsEchartLine from '@/app/[lng]/dataStatistics/echart/drawDataStatisticsEchartLine'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { directTrans } from '@/app/i18n/client'
import CollectCount from './svgs/collectCount.svg'
import FansCount from './svgs/fansCount.svg'
import ForwardCount from './svgs/forwardCount.svg'

export const MILESTONE_UNREAD_STORAGE_KEY = 'dataStatisticsMilestoneUnread'
export const MILESTONE_LAST_HASH_STORAGE_KEY = 'dataStatisticsMilestoneLastHash'
export const MILESTONE_LAST_SHOW_TIME_KEY = 'dataStatisticsMilestoneLastShowTime'
export const MILESTONE_STATUS_EVENT = 'milestone-status-change'

function getMilestonesHash(milestones: IMilestone[]) {
  return JSON.stringify(
    milestones.map(
      item => `${item.type}-${item.milestone}-${item.sourceType}-${item.value}`,
    ),
  )
}

export interface IDataStatisticsStore {
  // 当前选择的账户组IDs
  choosedGroupIds: string[]
  // 过滤之后的账户
  filteredAccountList: SocialAccount[]
  // 数据明细
  dataDetails: {
    title: string
    value: string
    icon: any
    // 总数
    total: number
    // 昨日数
    yesterday: number
    // 历史最高值
    historyMax: number
  }[]
  // 当前选择的明细类型
  currentDetailType: string
  // 账号搜索value
  accountSearchValue: string
  // 日期范围
  timeRangeValue: [Dayjs, Dayjs]
  // 源数据
  originData?: StatisticsPeriodModel
  // loading
  loading: boolean
  // echart 数据，直接适配 ECharts 格式
  echartData: {
    legend: string[]
    xAxis: string[]
    series: {
      name: string
      type: string
      data: number[]
    }[]
  }
  // 里程碑数据
  milestones: IMilestone[]
  // 是否显示里程碑海报
  showMilestonePoster: boolean
  // 是否存在未读的里程碑
  hasUnreadMilestone: boolean
  // 当前里程碑hash
  milestonesHash: string
}

const state: IDataStatisticsStore = {
  accountSearchValue: '',
  choosedGroupIds: [],
  filteredAccountList: [],
  dataDetails: [],
  currentDetailType: '',
  timeRangeValue: [dayjs().subtract(7, 'day'), dayjs()],
  loading: false,
  originData: undefined,
  echartData: {
    legend: [],
    xAxis: [],
    series: [],
  },
  milestones: [],
  showMilestonePoster: false,
  hasUnreadMilestone: false,
  milestonesHash: '',
}

export const useDataStatisticsStore = create(
  combine(
    {
      ...state,
    },
    (set, get) => {
      const methods = {
        async init() {
          const dataDetails = [
            {
              title: directTrans('dataStatistics', 'readCount'),
              value: 'readCount',
              icon: VideoCameraFilled,
              total: 0,
              yesterday: 0,
              historyMax: 0,
            },
            {
              title: directTrans('dataStatistics', 'growthFansCount'),
              value: 'fansCount',
              icon: FansCount,
              total: 0,
              yesterday: 0,
              historyMax: 0,
            },
            {
              title: directTrans('dataStatistics', 'commentCount'),
              value: 'commentCount',
              icon: MessageFilled,
              total: 0,
              yesterday: 0,
              historyMax: 0,
            },
            {
              title: directTrans('dataStatistics', 'likeCount'),
              value: 'likeCount',
              icon: HeartFilled,
              total: 0,
              yesterday: 0,
              historyMax: 0,
            },
            {
              title: directTrans('dataStatistics', 'collectCount'),
              value: 'collectCount',
              icon: CollectCount,
              total: 0,
              yesterday: 0,
              historyMax: 0,
            },
            {
              title: directTrans('dataStatistics', 'forwardCount'),
              value: 'forwardCount',
              icon: ForwardCount,
              total: 0,
              yesterday: 0,
              historyMax: 0,
            },
          ]

          set({
            dataDetails,
            currentDetailType: dataDetails[0].value,
          })
        },

        // 获取数据统计
        async fetchStatistics({
          accounts,
          startDate,
          endDate,
          detectMilestones = false,
          withLoading = true,
        }: {
          accounts: SocialAccount[]
          startDate: Dayjs
          endDate: Dayjs
          detectMilestones?: boolean
          withLoading?: boolean
        }) {
          if (!accounts || accounts.length === 0)
            return

          if (withLoading) {
            set({
              loading: true,
            })
          }

          const validAccounts = accounts.filter(
            account => account && account.type && account.uid,
          )

          const runDetection = () => {
            methods.sortingData()
            if (detectMilestones)
              methods.detectMilestones()
          }

          try {
            if (validAccounts.length === 0) {
              toast.error('没有有效的账号数据')
              return
            }

            const res = await getStatisticsPeriodApi({
              startDate: startDate.format('YYYY-MM-DD'),
              endDate: endDate.format('YYYY-MM-DD'),
              queries: validAccounts.map(account => ({
                platform: account.type,
                uid: account.uid,
              })),
            })

            const result = res?.data

            if (!result) {
              toast.error('获取数据统计失败，请稍后重试')
              return
            }

            set({
              originData: result,
            })
            runDetection()
          }
          catch (error) {
            console.error('获取数据统计失败', error)
            toast.error('获取数据统计失败，请稍后重试')
          }
          finally {
            if (withLoading) {
              set({
                loading: false,
              })
            }
          }
        },

        // 获取数据统计（仅用于页面查询，不触发里程碑检测）
        async getStatistics() {
          const filteredAccounts = get().filteredAccountList
          if (filteredAccounts.length === 0)
            return

          await methods.fetchStatistics({
            accounts: filteredAccounts,
            startDate: get().timeRangeValue[0],
            endDate: get().timeRangeValue[1],
            detectMilestones: false,
            withLoading: true,
          })
        },

        // 初始化全量账户的最近一周统计，并触发里程碑检测
        async initStatisticsForAllAccounts(accounts: SocialAccount[]) {
          if (!accounts || accounts.length === 0)
            return

          if (get().dataDetails.length === 0)
            await methods.init()

          const endDate = dayjs()
          const startDate = endDate.subtract(6, 'day')

          await methods.fetchStatistics({
            accounts,
            startDate,
            endDate,
            detectMilestones: true,
            withLoading: false,
          })
        },

        // 分拣数据
        sortingData() {
          const data = get().originData

          if (!data)
            return

          // 1. 汇总各指标总数
          const metrics = get().dataDetails.map(e => e.value)
          const totals: Record<string, number> = {}
          metrics.forEach(m => (totals[m] = 0))

          data.groupedByDate.forEach((day) => {
            day.records.forEach((rec) => {
              metrics.forEach((m) => {
                // @ts-ignore
                totals[m] += rec[m] ?? 0
              })
            })
          })

          set({
            dataDetails: get().dataDetails.map(item => ({
              ...item,
              total: totals[item.value] ?? 0,
            })),
          })

          // 2. 统计前一天数据
          const endDate = get().timeRangeValue[1].format('YYYY-MM-DD')
          const prevDay = dayjs(endDate)
            .subtract(1, 'day')
            .format('YYYY-MM-DD')
          const prevDayData = data.groupedByDate.find(
            d => d.date === prevDay,
          )
          const yesterdayTotals: Record<string, number> = {}
          if (prevDayData) {
            const metrics = get().dataDetails.map(e => e.value)
            metrics.forEach(m => (yesterdayTotals[m] = 0))
            prevDayData.records.forEach((rec) => {
              metrics.forEach((m) => {
                // @ts-ignore
                yesterdayTotals[m] += rec[m] ?? 0
              })
            })
          }

          // 3. 计算历史最高值（昨天之前的最高值）
          const historyMaxTotals: Record<string, number> = {}
          metrics.forEach(m => (historyMaxTotals[m] = 0))

          data.groupedByDate.forEach((day) => {
            // 只计算昨天之前的数据作为历史最高值
            if (day.date < prevDay) {
              const dayTotals: Record<string, number> = {}
              metrics.forEach(m => (dayTotals[m] = 0))
              day.records.forEach((rec) => {
                metrics.forEach((m) => {
                  // @ts-ignore
                  dayTotals[m] += rec[m] ?? 0
                })
              })
              // 更新历史最高值
              metrics.forEach((m) => {
                historyMaxTotals[m] = Math.max(historyMaxTotals[m], dayTotals[m])
              })
            }
          })

          // 4. 更新 dataDetails
          set({
            dataDetails: get().dataDetails.map(item => ({
              ...item,
              yesterday:
                prevDayData && typeof yesterdayTotals[item.value] === 'number'
                  ? yesterdayTotals[item.value]
                  : item.yesterday,
              historyMax: historyMaxTotals[item.value] ?? 0,
            })),
          })

          // 4. 生成 ECharts 适配数据
          const currentField = get().currentDetailType

          // 日期
          const dates = Array.from(
            new Set(data.groupedByDate.map(e => e.date)),
          ).sort()
          const dateIndex: Record<string, number> = {}
          dates.forEach((d, i) => (dateIndex[d] = i))

          // 平台
          const platformSet = new Set<string>()
          data.groupedByDate.forEach(g =>
            g.records.forEach(r => platformSet.add(r.platform)),
          )
          const platforms = Array.from(platformSet).sort() as PlatType[]

          // 初始化矩阵
          const chartData: Record<string, number[]> = {}
          platforms.forEach(
            // @ts-ignore
            p => (chartData[p] = Array.from({ length: dates.length }).fill(0)),
          )

          // 填充数据
          data.groupedByDate.forEach((g) => {
            const dIdx = dateIndex[g.date]
            g.records.forEach((r) => {
              const p = r.platform
              if (chartData[p]) {
                // @ts-ignore
                chartData[p][dIdx] = r[currentField] ?? 0
              }
            })
          })

          // 组装 ECharts 格式
          const legend = platforms.map(
            v => AccountPlatInfoMap.get(v)?.name || v,
          )
          const xAxis = dates
          const series = platforms.map(p => ({
            name: AccountPlatInfoMap.get(p)?.name || p,
            type: 'line',
            data: chartData[p],
          }))

          set({
            echartData: {
              legend,
              xAxis,
              series,
            },
          })

          drawDataStatisticsEchartLine('dataStatisticsEchartLine')
        },

        // 设置 timeRangeValue
        setTimeRangeValue(timeRangeValue: [Dayjs, Dayjs]) {
          set({
            timeRangeValue,
          })
        },
        // 设置 currentDetailType
        setCurrentDetailType(currentDetailType: string) {
          set({
            currentDetailType,
          })
        },
        // 设置选择账户组IDs
        setChoosedGroupIds(choosedGroupIds: string[]) {
          set({
            choosedGroupIds,
          })
        },
        // 设置过滤之后的账户
        setFilteredAccountList(filteredAccountList: SocialAccount[]) {
          set({
            filteredAccountList,
          })
        },
        // 设置 accountSearchValue
        setAccountSearchValue(accountSearchValue: string) {
          set({
            accountSearchValue,
          })
        },

        // 检测里程碑
        detectMilestones() {
          const dataDetails = get().dataDetails

          // 里程碑阈值（从小到大排序）
          const thresholds = [50, 100, 500, 1000, 5000, 10000, 50000]

          // 需要统计的指标类型（涨粉数、阅读量、点赞数）
          const targetMetrics = ['fansCount', 'readCount', 'likeCount']

          // 每个指标只保留最高的里程碑
          const highestMilestones: Map<string, IMilestone> = new Map()

          // 检测各个指标是否突破阈值
          targetMetrics.forEach((metric) => {
            const detail = dataDetails.find(d => d.value === metric)
            if (!detail)
              return

            const yesterday = detail.yesterday
            const weekTotal = detail.total // 最近一周总和
            const historyMax = detail.historyMax

            let highestThreshold = 0
            let sourceType: 'yesterday' | 'week' = 'yesterday'
            let achievedValue = 0

            // 找出该指标达到的最高阈值
            thresholds.forEach((threshold) => {
              // 优先检查昨日新增
              if (yesterday >= threshold && historyMax < threshold && threshold > highestThreshold) {
                highestThreshold = threshold
                sourceType = 'yesterday'
                achievedValue = yesterday
              }
              // 其次检查最近一周总和
              else if (weekTotal >= threshold && historyMax < threshold && threshold > highestThreshold) {
                highestThreshold = threshold
                sourceType = 'week'
                achievedValue = weekTotal
              }
            })

            // 如果该指标达到了至少一个阈值，记录最高的那个
            if (highestThreshold > 0) {
              highestMilestones.set(metric, {
                type: metric,
                title: detail.title,
                value: achievedValue,
                milestone: highestThreshold,
                isNewHigh: false,
                sourceType,
              })
            }
          })

          // 转换为数组
          const milestones = Array.from(highestMilestones.values())

          const milestoneHash = getMilestonesHash(milestones)
          let hasUnreadMilestone = false

          if (typeof window !== 'undefined') {
            const lastReadHash = window.localStorage.getItem(
              MILESTONE_LAST_HASH_STORAGE_KEY,
            ) || ''
            hasUnreadMilestone
              = milestones.length > 0 && milestoneHash !== lastReadHash

            window.localStorage.setItem(
              MILESTONE_UNREAD_STORAGE_KEY,
              hasUnreadMilestone ? 'true' : 'false',
            )
            window.dispatchEvent(new Event(MILESTONE_STATUS_EVENT))
          }

          set({
            milestones,
            showMilestonePoster: false,
            hasUnreadMilestone,
            milestonesHash: milestoneHash,
          })
        },

        // 设置是否显示里程碑海报
        setShowMilestonePoster(showMilestonePoster: boolean) {
          set({
            showMilestonePoster,
          })

          if (showMilestonePoster) {
            methods.markMilestonesAsRead()
          }
        },

        // 标记里程碑已读
        markMilestonesAsRead() {
          set({
            hasUnreadMilestone: false,
          })

          if (typeof window !== 'undefined') {
            const hash = get().milestonesHash
            const now = Date.now()
            window.localStorage.setItem(
              MILESTONE_LAST_HASH_STORAGE_KEY,
              hash,
            )
            window.localStorage.setItem(MILESTONE_UNREAD_STORAGE_KEY, 'false')
            window.localStorage.setItem(
              MILESTONE_LAST_SHOW_TIME_KEY,
              now.toString(),
            )
            window.dispatchEvent(new Event(MILESTONE_STATUS_EVENT))
          }
        },

        // 检查是否应该自动弹出海报（24小时冷却）
        shouldAutoShowPoster(): boolean {
          if (typeof window === 'undefined')
            return false

          const milestones = get().milestones
          if (milestones.length === 0)
            return false

          const lastShowTime = window.localStorage.getItem(
            MILESTONE_LAST_SHOW_TIME_KEY,
          )
          if (!lastShowTime)
            return true

          const now = Date.now()
          const lastTime = Number.parseInt(lastShowTime, 10)
          const cooldownMs = 24 * 60 * 60 * 1000 // 24小时

          return now - lastTime >= cooldownMs
        },

        // 自动显示海报（如果满足条件）
        autoShowPosterIfNeeded() {
          if (methods.shouldAutoShowPoster()) {
            set({ showMilestonePoster: true })
            methods.markMilestonesAsRead()
          }
        },
      }

      return methods
    },
  ),
)
