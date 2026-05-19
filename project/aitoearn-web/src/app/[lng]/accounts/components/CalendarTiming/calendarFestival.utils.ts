import chineseDaysData from 'chinese-days/dist/chinese-days.json'
import dayjs from 'dayjs'
import { isChina } from '@/constant'
import { isChineseLanguage } from '@/lib/i18n/languageConfig'
import bmcxCalendarEvents2026Data from './data/china-calendar-events-2026.json'
import lunarSolarEventsData from './data/china-lunar-solar-events.json'

export type CalendarFestivalType = 'holiday' | 'workday' | 'traditional' | 'solarTerm' | 'solarFestival'

export interface CalendarFestivalInfo {
  id?: string
  type: CalendarFestivalType
  nameKey?: string
  shortNameKey?: string
  name?: string
  shortName?: string
  statusKey: string
  statusTitleKey: string
  date?: string
  lunarDateText?: string
  weekday?: string
  description?: string
  imageUrl?: string
  important?: boolean
  display?: boolean
  isHoliday: boolean
  isWorkday: boolean
  isInLieu: boolean
}

export interface CalendarLunarInfo {
  month: number
  day: number
  isLeap: boolean
  monthKey: string
  dayKey: string
  leapPrefixKey: string
  titleKey: string
}

type CalendarFestivalKey
  = | 'newYear'
    | 'springFestival'
    | 'qingming'
    | 'labourDay'
    | 'dragonBoat'
    | 'midAutumn'
    | 'nationalDay'

interface ChinaHolidayData {
  holidays: Record<string, string>
  workdays: Record<string, string>
  inLieuDays: Record<string, string>
}

interface ChinaLunarDateItem {
  month: number
  day: number
  isLeap: boolean
}

interface ChinaLunarSolarDateItem {
  lunar: ChinaLunarDateItem
  traditional: string[]
  solarTerms: string[]
}

interface ChinaLunarSolarEventsData {
  startYear: number
  endYear: number
  dates: Record<string, ChinaLunarSolarDateItem>
}

interface BmcxCalendarEventItem {
  id: string
  name: string
  shortName: string
  type: 'solarFestival' | 'traditional' | 'solarTerm'
  lunarMonth?: number
  lunarDay?: number
  important: boolean
  display: boolean
  imageUrl?: string
  description?: string
}

interface BmcxCalendarEventsData {
  baseYear: number
  solarFestivals: Record<string, BmcxCalendarEventItem[]>
  lunarFestivals: Record<string, BmcxCalendarEventItem[]>
  solarTerms: Record<string, BmcxCalendarEventItem[]>
}

const chinaHolidayData: ChinaHolidayData = chineseDaysData
const chinaLunarSolarEventsData: ChinaLunarSolarEventsData = lunarSolarEventsData
const bmcxCalendarEventsData = bmcxCalendarEvents2026Data as BmcxCalendarEventsData
const bmcxCalendarEventNameMap = [
  ...Object.values(bmcxCalendarEventsData.solarFestivals).flat(),
  ...Object.values(bmcxCalendarEventsData.lunarFestivals).flat(),
  ...Object.values(bmcxCalendarEventsData.solarTerms).flat(),
].reduce<Record<string, BmcxCalendarEventItem>>(
  (result, items) => {
    result[normalizeFestivalName(items.name)] ??= items

    return result
  },
  {},
)

const HOLIDAY_NAME_KEY_MAP: Record<string, CalendarFestivalKey> = {
  'New Year\'s Day': 'newYear',
  'Spring Festival': 'springFestival',
  'Tomb-sweeping Day': 'qingming',
  'Labour Day': 'labourDay',
  'Dragon Boat Festival': 'dragonBoat',
  'Mid-autumn Festival': 'midAutumn',
  'National Day': 'nationalDay',
}

const HOLIDAY_CHINESE_NAME_MAP: Record<CalendarFestivalKey, string[]> = {
  newYear: ['元旦'],
  springFestival: ['春节'],
  qingming: ['清明', '清明节'],
  labourDay: ['劳动节'],
  dragonBoat: ['端午节'],
  midAutumn: ['中秋节'],
  nationalDay: ['国庆节'],
}

const FIXED_SOLAR_LEGAL_FESTIVAL_KEY_MAP: Record<string, CalendarFestivalKey> = {
  '01-01': 'newYear',
  '05-01': 'labourDay',
  '10-01': 'nationalDay',
}

const TRADITIONAL_CHINESE_NAME_MAP: Record<string, string[]> = {
  laba: ['腊八节'],
  xiaonian: ['北方小年', '南方小年', '小年'],
  chuxi: ['除夕'],
  springFestival: ['春节', '农历新年'],
  lanternFestival: ['元宵节'],
  dragonHeadsRaising: ['龙抬头'],
  shangsi: ['上巳节'],
  dragonBoat: ['端午节', '端午'],
  qixi: ['七夕节', '七夕情人节', '七夕'],
  zhongyuan: ['中元节'],
  midAutumn: ['中秋节'],
  doubleNinth: ['重阳节'],
  hanYi: ['寒衣节'],
  xiayuan: ['下元节'],
}

const SOLAR_TERM_CHINESE_NAME_MAP: Record<string, string[]> = {
  lesser_cold: ['小寒', '小寒节气'],
  greater_cold: ['大寒', '大寒节气'],
  the_beginning_of_spring: ['立春', '立春节气'],
  rain_water: ['雨水', '雨水节气'],
  the_waking_of_insects: ['惊蛰', '惊蛰节气'],
  the_spring_equinox: ['春分', '春分节气'],
  pure_brightness: ['清明', '清明节', '清明节气'],
  grain_rain: ['谷雨', '谷雨节气'],
  the_beginning_of_summer: ['立夏', '立夏节气'],
  lesser_fullness_of_grain: ['小满', '小满节气'],
  grain_in_beard: ['芒种', '芒种节气'],
  the_summer_solstice: ['夏至', '夏至节气'],
  lesser_heat: ['小暑', '小暑节气'],
  greater_heat: ['大暑', '大暑节气'],
  the_beginning_of_autumn: ['立秋', '立秋节气'],
  the_end_of_heat: ['处暑', '处暑节气'],
  white_dew: ['白露', '白露节气'],
  the_autumn_equinox: ['秋分', '秋分节气'],
  code_dew: ['寒露', '寒露节气'],
  frost_descent: ['霜降', '霜降节气'],
  the_beginning_of_winter: ['立冬', '立冬节气'],
  lesser_snow: ['小雪', '小雪节气'],
  greater_snow: ['大雪', '大雪节气'],
  the_winter_solstice: ['冬至', '冬至节气'],
}

type TranslateText = (key: string) => string

export function getCalendarFestivalName(festival: CalendarFestivalInfo, t: TranslateText, compact = false) {
  if (compact && festival.shortName) {
    return festival.shortName
  }

  if (!compact && festival.name) {
    return festival.name
  }

  const key = compact
    ? festival.shortNameKey ?? festival.nameKey
    : festival.nameKey ?? festival.shortNameKey

  return key ? t(key) : ''
}

export function getCalendarFestivalTitle(festival: CalendarFestivalInfo, t: TranslateText) {
  const name = getCalendarFestivalName(festival, t)
  return `${name} · ${t(festival.statusTitleKey)}`
}

export function getCalendarFestivalTabValue(festival: CalendarFestivalInfo, index: number) {
  return festival.id ?? `${festival.type}-${festival.nameKey ?? festival.name ?? festival.shortName ?? index}-${index}`
}

function getFestivalKey(name: string) {
  const [englishName] = name.split(',')
  return HOLIDAY_NAME_KEY_MAP[englishName]
}

function normalizeFestivalName(name: string) {
  return name
    .trim()
    .replace(/节气$/u, '')
}

function findBmcxCalendarEvent(names: string[]) {
  const nameSet = new Set(names.map(normalizeFestivalName))

  for (const name of nameSet) {
    const fallbackEvent = bmcxCalendarEventNameMap[name]

    if (fallbackEvent) {
      return fallbackEvent
    }
  }

  return undefined
}

function getDateKey(dateStr: string) {
  return dateStr.slice(5)
}

function getLunarDateKey(lunar?: ChinaLunarDateItem) {
  if (!lunar) {
    return ''
  }

  return `${String(lunar.month).padStart(2, '0')}-${String(lunar.day).padStart(2, '0')}`
}

function getCurrentDateBmcxEvents(dateStr: string, lunarSolarEvent?: ChinaLunarSolarDateItem) {
  const result: BmcxCalendarEventItem[] = []
  const eventIds = new Set<string>()

  const appendItems = (items?: BmcxCalendarEventItem[]) => {
    for (const item of items ?? []) {
      if (eventIds.has(item.id)) {
        continue
      }

      eventIds.add(item.id)
      result.push(item)
    }
  }

  appendItems(bmcxCalendarEventsData.solarFestivals[getDateKey(dateStr)])

  const lunarDateKey = getLunarDateKey(lunarSolarEvent?.lunar)
  if (lunarDateKey) {
    appendItems(bmcxCalendarEventsData.lunarFestivals[lunarDateKey])
  }

  for (const solarTermKey of lunarSolarEvent?.solarTerms ?? []) {
    for (const name of SOLAR_TERM_CHINESE_NAME_MAP[solarTermKey] ?? []) {
      appendItems(bmcxCalendarEventsData.solarTerms[normalizeFestivalName(name)])
    }
  }

  return result
}

function appendChineseNames(result: Set<string>, names?: string[]) {
  names?.forEach(name => result.add(normalizeFestivalName(name)))
}

function withBmcxMetadata(event: CalendarFestivalInfo, metadata?: BmcxCalendarEventItem): CalendarFestivalInfo {
  if (!metadata) {
    return event
  }

  return {
    ...event,
    id: event.id ?? metadata.id,
    description: metadata.description,
    imageUrl: metadata.imageUrl,
    important: metadata.important,
    display: metadata.display,
  }
}

function toBmcxCalendarFestivalInfo(item: BmcxCalendarEventItem, dateStr: string): CalendarFestivalInfo {
  return {
    id: item.id,
    type: item.type,
    name: item.name,
    shortName: item.shortName,
    statusKey: item.type === 'solarTerm'
      ? 'calendar.chinaHolidays.status.solarTerm'
      : item.type === 'traditional'
        ? 'calendar.chinaHolidays.status.traditional'
        : 'calendar.chinaHolidays.status.solarFestival',
    statusTitleKey: item.type === 'solarTerm'
      ? 'calendar.chinaHolidays.statusTitle.solarTerm'
      : item.type === 'traditional'
        ? 'calendar.chinaHolidays.statusTitle.traditional'
        : 'calendar.chinaHolidays.statusTitle.solarFestival',
    date: dateStr,
    description: item.description,
    imageUrl: item.imageUrl,
    important: item.important,
    display: item.display,
    isHoliday: false,
    isWorkday: false,
    isInLieu: false,
  }
}

function getAdditionalBmcxCalendarEvents(
  dateStr: string,
  lunarSolarEvent: ChinaLunarSolarDateItem | undefined,
  existingNames: Set<string>,
) {
  return getCurrentDateBmcxEvents(dateStr, lunarSolarEvent)
    .filter(item => !existingNames.has(normalizeFestivalName(item.name)))
    .map(item => toBmcxCalendarFestivalInfo(item, dateStr))
}

function canShowChinaCalendarInfo(date: dayjs.ConfigType, lng?: string) {
  if ((!isChina && (!lng || !isChineseLanguage(lng))) || !date) {
    return false
  }

  return true
}

function getFallbackLegalFestivalKey(dateStr: string, lunarSolarEvent?: ChinaLunarSolarDateItem) {
  const fixedSolarFestivalKey = FIXED_SOLAR_LEGAL_FESTIVAL_KEY_MAP[getDateKey(dateStr)]

  if (fixedSolarFestivalKey) {
    return fixedSolarFestivalKey
  }

  if (lunarSolarEvent?.traditional.includes('springFestival')) {
    return 'springFestival'
  }

  if (lunarSolarEvent?.traditional.includes('dragonBoat')) {
    return 'dragonBoat'
  }

  if (lunarSolarEvent?.traditional.includes('midAutumn')) {
    return 'midAutumn'
  }

  if (lunarSolarEvent?.solarTerms.includes('pure_brightness')) {
    return 'qingming'
  }

  return undefined
}

function getLegalCalendarEvent(dateStr: string, lunarSolarEvent?: ChinaLunarSolarDateItem) {
  const holidayName = chinaHolidayData.holidays[dateStr]
  const workdayName = chinaHolidayData.workdays[dateStr]
  const fallbackFestivalKey = getFallbackLegalFestivalKey(dateStr, lunarSolarEvent)
  const festivalKey = getFestivalKey(holidayName || workdayName || '') ?? fallbackFestivalKey

  if (!festivalKey) {
    return null
  }

  const holiday = Boolean(holidayName || (!workdayName && fallbackFestivalKey))
  const workday = Boolean(workdayName)

  if (!holiday && !workday) {
    return null
  }

  return {
    event: withBmcxMetadata({
      id: `legal-${dateStr}-${festivalKey}`,
      type: workday ? 'workday' : 'holiday',
      nameKey: `calendar.chinaHolidays.festivals.${festivalKey}`,
      shortNameKey: `calendar.chinaHolidays.festivalShortNames.${festivalKey}`,
      statusKey: workday
        ? 'calendar.chinaHolidays.status.workday'
        : 'calendar.chinaHolidays.status.holiday',
      statusTitleKey: workday
        ? 'calendar.chinaHolidays.statusTitle.adjustedWorkday'
        : chinaHolidayData.inLieuDays[dateStr]
          ? 'calendar.chinaHolidays.statusTitle.adjustedHoliday'
          : 'calendar.chinaHolidays.statusTitle.holiday',
      isHoliday: holiday,
      isWorkday: workday,
      isInLieu: Boolean(chinaHolidayData.inLieuDays[dateStr]),
      display: true,
    } satisfies CalendarFestivalInfo, findBmcxCalendarEvent(HOLIDAY_CHINESE_NAME_MAP[festivalKey])),
    festivalKey,
  }
}

export function getChinaCalendarEvents(date: dayjs.ConfigType, lng?: string): CalendarFestivalInfo[] {
  if (!canShowChinaCalendarInfo(date, lng)) {
    return []
  }

  const dateStr = dayjs(date).format('YYYY-MM-DD')
  const events: CalendarFestivalInfo[] = []
  const lunarSolarEvent = chinaLunarSolarEventsData.dates[dateStr]
  const legalEvent = getLegalCalendarEvent(dateStr, lunarSolarEvent)
  const existingNames = new Set<string>()

  if (legalEvent) {
    events.push(legalEvent.event)
    appendChineseNames(existingNames, HOLIDAY_CHINESE_NAME_MAP[legalEvent.festivalKey])
  }

  if (!lunarSolarEvent) {
    return events.concat(getAdditionalBmcxCalendarEvents(dateStr, undefined, existingNames))
  }

  for (const traditionalKey of lunarSolarEvent.traditional) {
    appendChineseNames(existingNames, TRADITIONAL_CHINESE_NAME_MAP[traditionalKey])

    if (traditionalKey === legalEvent?.festivalKey) {
      continue
    }

    events.push(withBmcxMetadata({
      id: `traditional-${dateStr}-${traditionalKey}`,
      type: 'traditional',
      nameKey: `calendar.chinaHolidays.traditional.${traditionalKey}`,
      shortNameKey: `calendar.chinaHolidays.traditionalShortNames.${traditionalKey}`,
      statusKey: 'calendar.chinaHolidays.status.traditional',
      statusTitleKey: 'calendar.chinaHolidays.statusTitle.traditional',
      isHoliday: false,
      isWorkday: false,
      isInLieu: false,
      display: true,
    }, findBmcxCalendarEvent(TRADITIONAL_CHINESE_NAME_MAP[traditionalKey] ?? [])))
  }

  for (const solarTermKey of lunarSolarEvent.solarTerms) {
    appendChineseNames(existingNames, SOLAR_TERM_CHINESE_NAME_MAP[solarTermKey])

    if (legalEvent?.festivalKey === 'qingming' && solarTermKey === 'pure_brightness') {
      continue
    }

    events.push(withBmcxMetadata({
      id: `solar-term-${dateStr}-${solarTermKey}`,
      type: 'solarTerm',
      nameKey: `calendar.chinaHolidays.solarTerms.${solarTermKey}`,
      shortNameKey: `calendar.chinaHolidays.solarTermShortNames.${solarTermKey}`,
      statusKey: 'calendar.chinaHolidays.status.solarTerm',
      statusTitleKey: 'calendar.chinaHolidays.statusTitle.solarTerm',
      isHoliday: false,
      isWorkday: false,
      isInLieu: false,
      display: true,
    }, findBmcxCalendarEvent(SOLAR_TERM_CHINESE_NAME_MAP[solarTermKey] ?? [])))
  }

  return events.concat(getAdditionalBmcxCalendarEvents(dateStr, lunarSolarEvent, existingNames))
}

export function getChinaCalendarDay(date: dayjs.ConfigType, lng?: string): CalendarFestivalInfo | null {
  return getChinaCalendarEvents(date, lng)[0] ?? null
}

export function filterCalendarFestivalEvents(
  festivals: CalendarFestivalInfo[],
  options: { showSolarFestivals: boolean, showSolarTerms: boolean },
) {
  return festivals.filter((festival) => {
    if (festival.type === 'solarFestival') {
      return options.showSolarFestivals
    }

    if (festival.type === 'solarTerm') {
      return options.showSolarTerms
    }

    return true
  })
}

export function getChinaCalendarLunarInfo(date: dayjs.ConfigType, lng?: string): CalendarLunarInfo | null {
  if (!canShowChinaCalendarInfo(date, lng)) {
    return null
  }

  const dateStr = dayjs(date).format('YYYY-MM-DD')
  const lunar = chinaLunarSolarEventsData.dates[dateStr]?.lunar

  if (!lunar) {
    return null
  }

  return {
    ...lunar,
    monthKey: `calendar.chinaHolidays.lunarMonths.m${lunar.month}`,
    dayKey: `calendar.chinaHolidays.lunarDays.d${lunar.day}`,
    leapPrefixKey: 'calendar.chinaHolidays.lunar.leapPrefix',
    titleKey: 'calendar.chinaHolidays.lunar.title',
  }
}
