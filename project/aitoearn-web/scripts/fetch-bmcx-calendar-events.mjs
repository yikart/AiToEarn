import { Buffer } from 'node:buffer'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const BMCX_LIST_URL = 'https://wannianrili.bmcx.com/jieri/'
const DEFAULT_OUTPUT = 'src/app/[lng]/accounts/components/CalendarTiming/data/china-calendar-events-2026.json'
const DEFAULT_ASSET_DIR = 'public/assets/calendar'
const DEFAULT_IMAGE_PUBLIC_PATH = '/assets/calendar'
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36'

const TRADITIONAL_FESTIVAL_NAMES = new Set([
  '腊八节',
  '北方小年',
  '南方小年',
  '除夕',
  '春节',
  '元宵节',
  '龙抬头',
  '上巳节',
  '端午节',
  '七夕节',
  '中元节',
  '中秋节',
  '重阳节',
  '寒衣节',
  '下元节',
])

const SOLAR_TERM_NAMES = new Set([
  '小寒',
  '大寒',
  '立春',
  '雨水',
  '惊蛰',
  '春分',
  '清明',
  '谷雨',
  '立夏',
  '小满',
  '芒种',
  '夏至',
  '小暑',
  '大暑',
  '立秋',
  '处暑',
  '白露',
  '秋分',
  '寒露',
  '霜降',
  '立冬',
  '小雪',
  '大雪',
  '冬至',
])

const LUNAR_DATE_EVENT_NAME_PATTERN = /菩萨|佛|释迦|弥勒|伽蓝|韦驮|药师|药王|月光|日光|龙树|燃灯|准提|祭灶|中和节|浴佛|寒衣|下元|腊八|小年|除夕|春节|元宵|龙抬头|上巳|端午|七夕|中元|中秋|重阳/u

const LUNAR_MONTH_MAP = new Map([
  ['正月', 1],
  ['一月', 1],
  ['二月', 2],
  ['三月', 3],
  ['四月', 4],
  ['五月', 5],
  ['六月', 6],
  ['七月', 7],
  ['八月', 8],
  ['九月', 9],
  ['十月', 10],
  ['冬月', 11],
  ['十一月', 11],
  ['腊月', 12],
  ['十二月', 12],
])

const LUNAR_DAY_MAP = new Map([
  ['初一', 1],
  ['初二', 2],
  ['初三', 3],
  ['初四', 4],
  ['初五', 5],
  ['初六', 6],
  ['初七', 7],
  ['初八', 8],
  ['初九', 9],
  ['初十', 10],
  ['十一', 11],
  ['十二', 12],
  ['十三', 13],
  ['十四', 14],
  ['十五', 15],
  ['十六', 16],
  ['十七', 17],
  ['十八', 18],
  ['十九', 19],
  ['二十', 20],
  ['廿一', 21],
  ['廿二', 22],
  ['廿三', 23],
  ['廿四', 24],
  ['廿五', 25],
  ['廿六', 26],
  ['廿七', 27],
  ['廿八', 28],
  ['廿九', 29],
  ['三十', 30],
])

function getArg(name, fallback) {
  const prefix = `--${name}=`
  const value = process.argv.find(arg => arg.startsWith(prefix))
  return value ? value.slice(prefix.length) : fallback
}

function normalizeUrl(url, baseUrl = BMCX_LIST_URL) {
  if (!url) {
    return ''
  }

  if (url.startsWith('//')) {
    return `https:${url}`
  }

  return new URL(url, baseUrl).toString()
}

function decodeHtml(text) {
  return text
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', '\'')
}

function stripHtml(html) {
  return decodeHtml(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/[\s\S]/g, (char) => {
      const code = char.charCodeAt(0)
      return (code < 32 && char !== '\n' && char !== '\t') || code === 127 ? '' : char
    })
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

function isLunarDateBasedEvent(item) {
  return item.type === 'traditional' || LUNAR_DATE_EVENT_NAME_PATTERN.test(item.name)
}

function parseLunarDateText(lunarDateText) {
  const monthText = [...LUNAR_MONTH_MAP.keys()]
    .sort((current, next) => next.length - current.length)
    .find(text => lunarDateText.startsWith(text))

  if (!monthText) {
    return null
  }

  const dayText = lunarDateText.slice(monthText.length)
  const month = LUNAR_MONTH_MAP.get(monthText)
  const day = LUNAR_DAY_MAP.get(dayText)

  if (!month || !day) {
    return null
  }

  return { month, day }
}

function getSolarDateKey(date) {
  return date.slice(5)
}

function getSolarTermKey(name) {
  return name
}

function getEventRule(item) {
  if (item.type === 'solarTerm') {
    return {
      bucket: 'solarTerms',
      key: getSolarTermKey(item.name),
    }
  }

  if (isLunarDateBasedEvent(item)) {
    const lunarDate = parseLunarDateText(item.lunarDateText)

    if (lunarDate) {
      return {
        bucket: 'lunarFestivals',
        key: `${String(lunarDate.month).padStart(2, '0')}-${String(lunarDate.day).padStart(2, '0')}`,
        lunarMonth: lunarDate.month,
        lunarDay: lunarDate.day,
      }
    }
  }

  return {
    bucket: 'solarFestivals',
    key: getSolarDateKey(item.date),
  }
}

function parseDetailDescription(mainContent, html, item) {
  const sectionRegExp = /<div class="jieqi_neirong_x_biaoti"><span>(?<title>[\s\S]*?)<\/span><\/div>\s*<div class="jieqi_neirong_x_beizhu">(?<body>[\s\S]*?)<\/div>/g
  const sections = []
  const shouldRemoveTimeSection = true
  let matchedSectionCount = 0

  for (const match of mainContent.matchAll(sectionRegExp)) {
    matchedSectionCount += 1
    const title = stripHtml(match.groups.title)
    const body = stripHtml(match.groups.body)

    if (!title || !body) {
      continue
    }

    if (shouldRemoveTimeSection && title.endsWith('时间')) {
      continue
    }

    if (item.type === 'solarTerm' && title.startsWith('其它年份的')) {
      continue
    }

    sections.push(`${title}\n${body}`)
  }

  if (sections.length > 0) {
    return sections.join('\n\n')
  }

  if (matchedSectionCount > 0 && shouldRemoveTimeSection) {
    return ''
  }

  const metaDescription = html.match(/<meta\s+name="description"\s+content="(?<description>[^"]*)"/i)?.groups?.description ?? ''
  const firstParagraph = mainContent.match(/<p[^>]*>(?<paragraph>[\s\S]*?)<\/p>/i)?.groups?.paragraph ?? ''

  return stripHtml(firstParagraph || metaDescription)
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  })

  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status}: ${url}`)
  }

  return response.text()
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      'accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    },
  })

  if (!response.ok) {
    throw new Error(`Fetch image failed ${response.status}: ${url}`)
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get('content-type') ?? '',
  }
}

function getImageExtension(imageUrl, contentType) {
  const pathname = new URL(imageUrl).pathname
  const extname = path.extname(pathname).toLowerCase().replace('.', '')

  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(extname)) {
    return extname === 'jpeg' ? 'jpg' : extname
  }

  if (contentType.includes('webp')) {
    return 'webp'
  }

  if (contentType.includes('jpeg') || contentType.includes('jpg')) {
    return 'jpg'
  }

  if (contentType.includes('gif')) {
    return 'gif'
  }

  if (contentType.includes('svg')) {
    return 'svg'
  }

  return 'png'
}

async function downloadImage(imageUrl, item, assetDir, imagePublicPath) {
  if (!imageUrl) {
    return ''
  }

  const { buffer, contentType } = await fetchBuffer(imageUrl)
  const extension = getImageExtension(imageUrl, contentType)
  const filename = `${item.id}.${extension}`
  const filePath = path.join(assetDir, filename)

  await fs.mkdir(assetDir, { recursive: true })
  await fs.writeFile(filePath, buffer)

  return `${imagePublicPath.replace(/\/$/, '')}/${filename}`
}

function getMainContent(html) {
  return html.match(/<div id="main_content"[^>]*>(?<content>[\s\S]*?)(?:<div id="main_right"|<div id="ggwz___4"|<\/body>)/i)?.groups?.content ?? html
}

function getDetailImageSrc(mainContent, item) {
  const imgRegExp = /<img\b(?<attrs>[^>]*)>/gi
  let firstImageSrc = ''

  for (const match of mainContent.matchAll(imgRegExp)) {
    const attrs = match.groups.attrs
    const src = attrs.match(/\bsrc="(?<src>[^"]+)"/i)?.groups?.src ?? ''
    const alt = attrs.match(/\balt="(?<alt>[^"]*)"/i)?.groups?.alt ?? ''

    if (!firstImageSrc && src) {
      firstImageSrc = src
    }

    if (item.type === 'solarTerm' && src.includes('/file/jieqi/jieqi/') && alt.includes(item.name)) {
      return src
    }
  }

  return firstImageSrc
}

function parseList(html, year) {
  const mainContent = getMainContent(html)
  const itemRegExp = /<li><a\s+href="(?<href>[^"]+)"\s+target="_blank">(?<nameHtml>[\s\S]*?)<\/a>\s*（公历(?<month>\d+)月(?<day>\d+)日\u3000农历(?<lunar>[^\u3000]+)\u3000(?<weekday>[^）]+)）<\/li>/g
  const items = []

  for (const match of mainContent.matchAll(itemRegExp)) {
    const nameHtml = match.groups.nameHtml
    const name = stripHtml(nameHtml)
    const month = Number(match.groups.month)
    const day = Number(match.groups.day)
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const detailUrl = normalizeUrl(match.groups.href)
    const isSolarTerm = detailUrl.includes('jieqi.bmcx.com') || SOLAR_TERM_NAMES.has(name)
    const isTraditional = TRADITIONAL_FESTIVAL_NAMES.has(name)
    const isImportant = /class="[^"]*(?:hongse|lvse)[^"]*"/i.test(nameHtml)

    items.push({
      id: detailUrl
        .replace(/^https?:\/\//, '')
        .replace(/__?(jieri|jieqi)\/$/i, '')
        .replace(/[^\w\u4E00-\u9FA5-]+/g, '-')
        .replace(/^-+|-+$/g, ''),
      name,
      shortName: name.replace(/^国际|^世界|^中国|^全国/u, ''),
      type: isSolarTerm ? 'solarTerm' : isTraditional ? 'traditional' : 'solarFestival',
      date,
      lunarDateText: match.groups.lunar,
      weekday: match.groups.weekday,
      important: isImportant,
      display: isSolarTerm || isTraditional || isImportant,
      detailUrl,
    })
  }

  return items
}

function parseDetail(html, detailUrl, item) {
  const mainContent = getMainContent(html)
  const imageSrc = getDetailImageSrc(mainContent, item)
  const description = parseDetailDescription(mainContent, html, item)

  return {
    imageUrl: normalizeUrl(imageSrc, detailUrl),
    description,
  }
}

function removeInternalFields(item) {
  const { date, detailUrl, lunarDateText, weekday, ...outputItem } = item
  return outputItem
}

function buildReusableCalendarEvents(items) {
  return items.reduce((result, item) => {
    const rule = getEventRule(item)
    const outputItem = removeInternalFields(item)

    if (rule.lunarMonth && rule.lunarDay) {
      outputItem.lunarMonth = rule.lunarMonth
      outputItem.lunarDay = rule.lunarDay
    }

    result[rule.bucket][rule.key] ??= []
    if (result[rule.bucket][rule.key].some(current => current.id === outputItem.id)) {
      return result
    }

    result[rule.bucket][rule.key].push(outputItem)

    return result
  }, {
    solarFestivals: {},
    lunarFestivals: {},
    solarTerms: {},
  })
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = Array.from({ length: items.length })
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      results[currentIndex] = await mapper(items[currentIndex], currentIndex)
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker))
  return results
}

async function main() {
  const year = Number(getArg('year', '2026'))
  const output = getArg('output', DEFAULT_OUTPUT)
  const assetDir = getArg('asset-dir', DEFAULT_ASSET_DIR)
  const imagePublicPath = getArg('image-public-path', DEFAULT_IMAGE_PUBLIC_PATH)
  const concurrency = Number(getArg('concurrency', '6'))
  const fetchDetails = getArg('details', 'all') !== 'none'
  const downloadImages = getArg('images', 'download') !== 'none'
  const listUrl = getArg('url', BMCX_LIST_URL)

  const listHtml = await fetchText(listUrl)
  const listItems = parseList(listHtml, year)

  const detailItems = fetchDetails
    ? await mapWithConcurrency(listItems, concurrency, async (item, index) => {
        try {
          const html = await fetchText(item.detailUrl)
          const detail = parseDetail(html, item.detailUrl, item)
          const imageUrl = downloadImages
            ? await downloadImage(detail.imageUrl, item, assetDir, imagePublicPath)
            : detail.imageUrl
          console.log(`[${index + 1}/${listItems.length}] ${item.name}`)
          return { ...item, ...detail, imageUrl }
        }
        catch (error) {
          console.warn(`[warn] ${item.name}: ${error instanceof Error ? error.message : String(error)}`)
          return item
        }
      })
    : listItems

  const calendarEvents = buildReusableCalendarEvents(detailItems)

  const payload = {
    baseYear: year,
    ...calendarEvents,
  }

  await fs.mkdir(path.dirname(output), { recursive: true })
  await fs.writeFile(output, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  console.log(`Saved ${detailItems.length} events to ${output}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
