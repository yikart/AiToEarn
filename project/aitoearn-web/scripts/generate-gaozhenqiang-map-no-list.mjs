import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

const baseWidth = 2326
const baseHeight = 3720
const outputWidth = 8192
const outputHeight = Math.round((outputWidth * baseHeight) / baseWidth)

const outputDir = path.join(repoRoot, 'public', 'gaozhenqiang', '2')
const svgPath = path.join(outputDir, 'map-no-list-polished.svg')
const htmlPath = path.join(outputDir, 'map-no-list-polished.html')

const esc = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

const attrs = (values) =>
  Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([key, value]) => `${key}="${esc(value)}"`)
    .join(' ')

const node = (name, values, children = '') =>
  `<${name} ${attrs(values)}>${children}</${name}>`

const self = (name, values) => `<${name} ${attrs(values)} />`

const rect = (x, y, width, height, values = {}) =>
  self('rect', { x, y, width, height, ...values })

const roundRect = (x, y, width, height, radius, values = {}) =>
  rect(x, y, width, height, { rx: radius, ry: radius, ...values })

const circle = (cx, cy, r, values = {}) => self('circle', { cx, cy, r, ...values })

const ellipse = (cx, cy, rx, ry, values = {}) =>
  self('ellipse', { cx, cy, rx, ry, ...values })

const pathEl = (d, values = {}) => self('path', { d, ...values })

const line = (x1, y1, x2, y2, values = {}) =>
  self('line', { x1, y1, x2, y2, ...values })

const polyline = (points, values = {}) => self('polyline', { points, ...values })
const polygon = (points, values = {}) => self('polygon', { points, ...values })

const text = (content, x, y, values = {}) => {
  const {
    size = 42,
    weight = 700,
    fill = '#334155',
    anchor = 'middle',
    className,
    ...rest
  } = values

  return node(
    'text',
    {
      x,
      y,
      'font-size': size,
      'font-weight': weight,
      fill,
      'text-anchor': anchor,
      'dominant-baseline': 'middle',
      class: className,
      ...rest,
    },
    esc(content),
  )
}

const verticalText = (content, x, y, values = {}) => {
  const { size = 32, gap = size * 0.95, weight = 700, fill = '#2563eb' } = values
  return [...content]
    .map((char, index) =>
      text(char, x, y + index * gap, {
        size,
        weight,
        fill,
      }),
    )
    .join('')
}

const label = (content, x, y, width, height, values = {}) => {
  const {
    fill = '#fff7ed',
    stroke = '#fb923c',
    textFill = '#f97316',
    radius = 24,
    size = 38,
    weight = 800,
  } = values

  return [
    roundRect(x, y, width, height, radius, {
      fill,
      stroke,
      'stroke-width': 4,
    }),
    text(content, x + width / 2, y + height / 2 + 2, {
      size,
      weight,
      fill: textFill,
    }),
  ].join('')
}

const marker = (content, x, y, values = {}) => {
  const { fill = '#0ea5e9', size = 34, radius = 16, width = 84, height = 66 } = values
  return [
    roundRect(x, y, width, height, radius, {
      fill,
      stroke: '#ffffff',
      'stroke-width': 5,
      filter: 'url(#softShadow)',
    }),
    text(content, x + width / 2, y + height / 2 + 2, {
      size,
      fill: '#ffffff',
      weight: 900,
    }),
  ].join('')
}

const boothColumn = (items, x, y, width, height, fill, values = {}) => {
  const { gap = 5, size = 25, textFill = '#17324d', radius = 6 } = values
  const itemHeight = (height - gap * (items.length - 1)) / items.length

  return items
    .map((item, index) => {
      const itemY = y + index * (itemHeight + gap)
      return [
        roundRect(x, itemY, width, itemHeight, radius, {
          fill,
          stroke: 'rgba(255,255,255,.82)',
          'stroke-width': 2,
        }),
        text(item, x + width / 2, itemY + itemHeight / 2 + 1, {
          size,
          fill: textFill,
          weight: 800,
        }),
      ].join('')
    })
    .join('')
}

const boothRow = (items, x, y, width, height, fill, values = {}) => {
  const { gap = 5, size = 24, textFill = '#17324d', radius = 6 } = values
  const itemWidth = (width - gap * (items.length - 1)) / items.length

  return items
    .map((item, index) => {
      const itemX = x + index * (itemWidth + gap)
      return [
        roundRect(itemX, y, itemWidth, height, radius, {
          fill,
          stroke: 'rgba(255,255,255,.82)',
          'stroke-width': 2,
        }),
        text(item, itemX + itemWidth / 2, y + height / 2 + 1, {
          size,
          fill: textFill,
          weight: 800,
        }),
      ].join('')
    })
    .join('')
}

const tree = (x, y, scale = 1) => {
  const trunk = rect(x - 5 * scale, y + 18 * scale, 10 * scale, 24 * scale, {
    fill: '#9a6a38',
  })
  const crown = [
    circle(x, y, 28 * scale, { fill: '#35b85f' }),
    circle(x - 18 * scale, y + 12 * scale, 21 * scale, { fill: '#259d53' }),
    circle(x + 18 * scale, y + 12 * scale, 21 * scale, { fill: '#4fca70' }),
  ].join('')
  return node('g', { filter: 'url(#tinyShadow)' }, `${trunk}${crown}`)
}

const tent = (x, y, color = '#22c55e') =>
  node(
    'g',
    { filter: 'url(#tinyShadow)' },
    [
      polygon(`${x},${y} ${x + 92},${y} ${x + 46},${y - 58}`, {
        fill: color,
        stroke: '#ffffff',
        'stroke-width': 4,
      }),
      line(x + 46, y - 58, x + 46, y, {
        stroke: '#ffffff',
        'stroke-width': 4,
      }),
      rect(x + 6, y, 80, 52, { fill: '#fff7ed', stroke: color, 'stroke-width': 4 }),
    ].join(''),
  )

const roadLabel = (content, x, y, values = {}) =>
  label(content, x, y, values.width ?? 360, values.height ?? 58, {
    fill: '#fff7ed',
    stroke: '#fb923c',
    textFill: '#f97316',
    radius: 28,
    size: values.size ?? 32,
  })

const defs = `
  <defs>
    <linearGradient id="landBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#eef7ff"/>
      <stop offset="100%" stop-color="#e7f1ff"/>
    </linearGradient>
    <linearGradient id="orangeLandmark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ff8a1f"/>
      <stop offset="100%" stop-color="#ff5a1f"/>
    </linearGradient>
    <linearGradient id="goldHall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffe167"/>
      <stop offset="100%" stop-color="#ffc400"/>
    </linearGradient>
    <linearGradient id="water" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="100%" stop-color="#2f7eea"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#475569" flood-opacity="0.22"/>
    </filter>
    <filter id="tinyShadow" x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#475569" flood-opacity="0.18"/>
    </filter>
    <style>
      text { font-family: "Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif; paint-order: stroke; stroke: rgba(255,255,255,.46); stroke-width: 2px; stroke-linejoin: round; }
      .small-text { stroke-width: 1px; }
    </style>
  </defs>
`

const background = [
  rect(0, 0, baseWidth, baseHeight, { fill: '#fffaf0' }),
  pathEl('M90 170 H2218 V3400 H90 V1986 H56 C17 1986 0 1902 0 1760 C0 1618 17 1532 90 1532 Z', {
    fill: 'url(#landBg)',
    stroke: '#f5a400',
    'stroke-width': 18,
    'stroke-linejoin': 'round',
  }),
  rect(118, 210, 2058, 3132, { fill: 'rgba(255,255,255,.18)' }),
  pathEl('M115 3364 H2178', { stroke: '#f5a400', 'stroke-width': 7, 'stroke-linecap': 'round' }),
].join('')

const roadsAndGreenery = [
  pathEl('M390 310 C720 278 1110 278 1455 305 C1735 326 1970 320 2160 285', {
    fill: 'none',
    stroke: '#f8e5c7',
    'stroke-width': 110,
    'stroke-linecap': 'round',
  }),
  pathEl('M430 360 V3145', {
    fill: 'none',
    stroke: '#f8e5c7',
    'stroke-width': 86,
    'stroke-linecap': 'round',
  }),
  pathEl('M2045 372 V3145', {
    fill: 'none',
    stroke: '#f8e5c7',
    'stroke-width': 86,
    'stroke-linecap': 'round',
  }),
  pathEl('M475 1265 H2040', {
    fill: 'none',
    stroke: '#f8e5c7',
    'stroke-width': 70,
    'stroke-linecap': 'round',
  }),
  pathEl('M460 2248 H2050', {
    fill: 'none',
    stroke: '#f8e5c7',
    'stroke-width': 70,
    'stroke-linecap': 'round',
  }),
  pathEl('M445 2550 C540 2520 622 2508 738 2528', {
    fill: 'none',
    stroke: '#f8e5c7',
    'stroke-width': 62,
    'stroke-linecap': 'round',
  }),
  pathEl('M1885 2538 C1965 2520 2038 2510 2115 2540', {
    fill: 'none',
    stroke: '#f8e5c7',
    'stroke-width': 62,
    'stroke-linecap': 'round',
  }),
  ...Array.from({ length: 12 }, (_, index) => tree(165 + index * 165, 164, 0.72)),
  ...Array.from({ length: 12 }, (_, index) => tree(178 + index * 165, 3438, 0.72)),
  ...Array.from({ length: 15 }, (_, index) => tree(70, 410 + index * 190, 0.58)),
  ...Array.from({ length: 15 }, (_, index) => tree(2250, 430 + index * 190, 0.58)),
  tree(275, 360, 0.82),
  tree(270, 2980, 0.78),
  tree(2000, 520, 0.82),
  tree(2035, 2988, 0.78),
  tent(178, 2920, '#22c55e'),
  tent(1942, 590, '#fb923c'),
  tent(1980, 2924, '#14b8a6'),
].join('')

const topArea = [
  text('总品牌数：67个', baseWidth / 2, 100, {
    size: 108,
    weight: 900,
    fill: '#ff5a1f',
  }),
  label('库房', 225, 245, 255, 96, {
    fill: '#00a88a',
    stroke: '#00a88a',
    textFill: '#ffffff',
    size: 34,
  }),
  boothRow(['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'], 525, 235, 465, 56, '#7dd3fc', {
    size: 22,
    textFill: '#075985',
  }),
  boothColumn(['S8', 'S9'], 993, 295, 80, 120, '#7dd3fc', { size: 22, textFill: '#075985' }),
  label('小鹿音乐', 1008, 340, 250, 66, {
    fill: '#c084fc',
    stroke: '#c084fc',
    textFill: '#ffffff',
    size: 28,
  }),
  text('北展宾馆', 1490, 310, { size: 28, fill: '#2563eb', weight: 800 }),
  boothRow(['60', '61', '62', '63', '64', '65', '66', '67'], 1395, 350, 450, 48, '#a78bfa', {
    size: 21,
    textFill: '#4c1d95',
  }),
  boothRow(['G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8'], 1320, 425, 430, 56, '#c084fc', {
    size: 22,
    textFill: '#581c87',
  }),
  boothRow(['F1'], 1830, 425, 72, 56, '#c084fc', { size: 22, textFill: '#581c87' }),
  roadLabel('北门', 2118, 352, { width: 165, height: 64, size: 34 }),
  polygon('2266,382 2310,337 2310,427', { fill: '#f97316' }),
].join('')

const leftInternal = [
  label('微优品\n生活\n体验馆', 195, 815, 230, 360, {
    fill: '#f0abfc',
    stroke: '#f0abfc',
    textFill: '#ef4444',
    size: 34,
  }).replace('微优品\n生活\n体验馆', '微优品<tspan x="310" dy="42">生活</tspan><tspan x="310" dy="42">体验馆</tspan>'),
  text('黑胶唱片', 456, 930, { size: 26, fill: '#2563eb', weight: 800, anchor: 'start' }),
  text('儿童乐园', 456, 985, { size: 26, fill: '#2563eb', weight: 800, anchor: 'start' }),
  boothColumn(['38', '37', '36', '35', '34', '33', '32', '31'], 395, 945, 62, 420, '#a3e635', {
    size: 22,
    textFill: '#365314',
  }),
  boothColumn(['49', '48', '47', '46', '45'], 640, 525, 74, 320, '#22c55e', {
    size: 24,
    textFill: '#064e3b',
  }),
  boothColumn(['44', '43', '42', '41', '40', '39'], 640, 950, 74, 390, '#38bdf8', {
    size: 24,
    textFill: '#075985',
  }),
  boothColumn(['28', '29', '30'], 346, 1235, 180, 78, '#f9a8d4', {
    size: 22,
    textFill: '#831843',
  }),
  boothColumn(['27', '26', '25', '24', '23', '22'], 322, 1345, 75, 360, '#ef4444', {
    size: 23,
    textFill: '#7f1d1d',
  }),
  boothColumn(['21', '20', '19', '18', '17', '16', '15', '14'], 400, 1808, 82, 485, '#7dd3fc', {
    size: 25,
    textFill: '#075985',
  }),
  boothColumn(['13', '12', '11', '10'], 382, 2260, 92, 270, '#fde047', {
    size: 26,
    textFill: '#854d0e',
  }),
  boothColumn(['9', '8', '7', '6', '5', '4', '3', '2', '1'], 392, 2635, 76, 490, '#fde047', {
    size: 25,
    textFill: '#854d0e',
  }),
  verticalText('北展西马路', 514, 1328, { size: 34, fill: '#2563eb', gap: 36 }),
  verticalText('北区四马路', 488, 2670, { size: 28, fill: '#2563eb', gap: 30 }),
  verticalText('莫斯科餐厅', 590, 1512, { size: 40, fill: '#ef7c00', gap: 48 }),
  verticalText('报告厅', 590, 2452, { size: 42, fill: '#ef7c00', gap: 52 }),
  verticalText('商贸区', 222, 1260, { size: 30, fill: '#ef4444', gap: 38 }),
  verticalText('批发区', 225, 1680, { size: 30, fill: '#ef4444', gap: 38 }),
  verticalText('批发区', 225, 2510, { size: 30, fill: '#ef4444', gap: 38 }),
  roundRect(102, 1360, 115, 1130, 12, {
    fill: '#ffffff',
    stroke: '#fb7185',
    'stroke-width': 6,
  }),
  ...Array.from({ length: 18 }, (_, index) =>
    rect(127, 1392 + index * 58, 66, 38, {
      fill: '#fff7ed',
      stroke: '#fb7185',
      'stroke-width': 2,
    }),
  ),
  ellipse(160, 1760, 180, 210, {
    fill: 'url(#orangeLandmark)',
    stroke: '#ffffff',
    'stroke-width': 8,
    filter: 'url(#softShadow)',
  }),
  text('婚庆广场', 160, 1760, { size: 38, fill: '#ffffff', weight: 900 }),
  label('南秀中心', 195, 2895, 150, 360, {
    fill: '#f0abfc',
    stroke: '#f0abfc',
    textFill: '#8b5cf6',
    size: 32,
  }).replace('南秀中心', '<tspan x="270" dy="-48">南秀</tspan><tspan x="270" dy="48">中心</tspan>'),
].join('')

const theatre = [
  roundRect(735, 470, 930, 915, 30, { fill: 'rgba(255,255,255,.5)' }),
  rect(845, 655, 720, 160, { fill: '#f97316', filter: 'url(#softShadow)' }),
  polygon('778,655 1632,655 1562,575 850,575', {
    fill: '#f59e0b',
    stroke: '#fb923c',
    'stroke-width': 8,
    filter: 'url(#softShadow)',
  }),
  rect(980, 558, 420, 48, { fill: '#fff7ed', stroke: '#fb923c', 'stroke-width': 4 }),
  label('剧场正门', 932, 620, 460, 70, {
    fill: '#fb923c',
    stroke: '#fb923c',
    textFill: '#ffffff',
    size: 34,
  }),
  marker('WC', 745, 665, { width: 86, height: 70, size: 29 }),
  marker('WC', 1588, 665, { width: 86, height: 70, size: 29 }),
  marker('P', 1772, 660, { fill: '#f97316', width: 82, height: 82, size: 48 }),
  circle(1190, 915, 330, {
    fill: 'url(#orangeLandmark)',
    filter: 'url(#softShadow)',
  }),
  roundRect(795, 1115, 790, 280, 24, {
    fill: 'url(#orangeLandmark)',
    filter: 'url(#softShadow)',
  }),
  text('北展剧场', 1190, 920, { size: 80, fill: '#ffffff', weight: 900 }),
  label('后广场', 1710, 925, 360, 120, {
    fill: 'rgba(255,255,255,.35)',
    stroke: '#fb923c',
    textFill: '#f97316',
    radius: 60,
    size: 58,
  }),
].join('')

const halls = [
  label('体验厅', 510, 1418, 405, 90, {
    fill: '#f9a8d4',
    stroke: '#f9a8d4',
    textFill: '#ef4444',
    size: 34,
  }),
  label('友谊厅', 1480, 1418, 405, 90, {
    fill: '#f9a8d4',
    stroke: '#f9a8d4',
    textFill: '#ef4444',
    size: 34,
  }),
  roundRect(515, 1530, 440, 760, 20, {
    fill: 'url(#goldHall)',
    filter: 'url(#softShadow)',
  }),
  roundRect(1465, 1530, 440, 760, 20, {
    fill: 'url(#goldHall)',
    filter: 'url(#softShadow)',
  }),
  roundRect(970, 1458, 460, 832, 18, {
    fill: 'url(#orangeLandmark)',
    filter: 'url(#softShadow)',
  }),
  pathEl('M1164 1880 V1640 M1116 1880 L1164 1660 L1212 1880 M1075 1880 H1255 M1035 1940 H1298', {
    fill: 'none',
    stroke: '#fff7bf',
    'stroke-width': 16,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  }),
  text('北京展览馆', 1200, 2015, { size: 42, fill: '#ffffff', weight: 900 }),
  text('展位区', 735, 1905, { size: 52, fill: '#d97706', weight: 800 }),
  text('展位区', 1685, 1905, { size: 52, fill: '#d97706', weight: 800 }),
  roundRect(1935, 1445, 210, 330, 18, { fill: 'url(#goldHall)', filter: 'url(#softShadow)' }),
  roundRect(1935, 1810, 210, 330, 18, { fill: 'url(#goldHall)', filter: 'url(#softShadow)' }),
  boothColumn(['T50', 'T51', 'T52', 'T53', 'T54', 'T55', 'T56', 'T57'], 1938, 1448, 204, 680, '#facc15', {
    gap: 4,
    size: 30,
    textFill: '#78350f',
  }),
  roundRect(510, 2338, 445, 230, 18, { fill: 'url(#goldHall)', filter: 'url(#softShadow)' }),
  roundRect(970, 2338, 460, 230, 18, { fill: 'url(#goldHall)', filter: 'url(#softShadow)' }),
  roundRect(1465, 2338, 440, 230, 18, { fill: 'url(#goldHall)', filter: 'url(#softShadow)' }),
  roundRect(1932, 2300, 210, 520, 18, { fill: 'url(#goldHall)', filter: 'url(#softShadow)' }),
  marker('WC', 515, 1375, { width: 78, height: 62, size: 27 }),
  marker('WC', 1355, 1375, { width: 78, height: 62, size: 27 }),
  marker('WC', 1960, 2278, { width: 78, height: 62, size: 27 }),
  text('西色坊精品展', 602, 2265, { size: 28, fill: '#f97316', anchor: 'start' }),
  text('西夹道', 605, 2890, { size: 30, fill: '#334155' }),
  text('东夹道', 1895, 2890, { size: 30, fill: '#334155' }),
].join('')

const frontPlaza = [
  roundRect(720, 2650, 1178, 705, 140, {
    fill: 'url(#water)',
    stroke: '#dbeafe',
    'stroke-width': 16,
    filter: 'url(#softShadow)',
  }),
  ellipse(1308, 3038, 235, 70, {
    fill: 'none',
    stroke: '#bfe3ff',
    'stroke-width': 18,
    opacity: 0.95,
  }),
  pathEl('M1308 2982 C1308 2865 1215 2816 1165 2915', {
    fill: 'none',
    stroke: '#bfe3ff',
    'stroke-width': 22,
    'stroke-linecap': 'round',
  }),
  pathEl('M1308 2982 C1308 2865 1400 2816 1450 2915', {
    fill: 'none',
    stroke: '#bfe3ff',
    'stroke-width': 22,
    'stroke-linecap': 'round',
  }),
  pathEl('M1308 2970 V2790', {
    fill: 'none',
    stroke: '#bfe3ff',
    'stroke-width': 16,
    'stroke-linecap': 'round',
  }),
  ellipse(1308, 3045, 145, 36, {
    fill: 'none',
    stroke: '#e0f2fe',
    'stroke-width': 12,
    opacity: 0.9,
  }),
  text('前广场', 1308, 3210, { size: 68, fill: '#ffffff', weight: 900 }),
  marker('西票房', 860, 3445, { width: 142, height: 90, size: 28 }),
  marker('东票房', 1645, 3445, { width: 142, height: 90, size: 28 }),
  marker('i', 1190, 3472, { fill: '#ef4444', width: 78, height: 78, size: 52 }),
  text('咨询台', 1190, 3560, { size: 30, fill: '#334155', weight: 700 }),
  text('老莫啤酒花园', 500, 3310, { size: 28, fill: '#475569', anchor: 'start' }),
  tree(635, 2635, 0.62),
  tree(1995, 2635, 0.62),
  tree(674, 3348, 0.62),
  tree(1956, 3348, 0.62),
].join('')

const gatesAndRoads = [
  verticalText('北展东马路', 2182, 1325, { size: 34, fill: '#2563eb', gap: 36 }),
  verticalText('北展东马路', 2182, 2608, { size: 34, fill: '#2563eb', gap: 36 }),
  roadLabel('北展北街', 1965, 870, { width: 220, height: 62, size: 31 }),
  roadLabel('西马路南口', 45, 3602, { width: 365, height: 58, size: 32 }),
  roadLabel('西直门外大街辅路', 860, 3602, { width: 590, height: 58, size: 32 }),
  roadLabel('东马路南口', 1845, 3602, { width: 365, height: 58, size: 32 }),
  roadLabel('西门', 26, 1938, { width: 142, height: 66, size: 34 }),
  polygon('84,1888 84,1996 26,1942', { fill: '#f97316' }),
  roadLabel('南门', 1076, 3404, { width: 180, height: 70, size: 38 }),
  polygon('1166,3356 1115,3424 1217,3424', { fill: '#f97316' }),
  rect(0, 3525, baseWidth, 52, { fill: '#f3f4f6' }),
  rect(0, 3668, baseWidth, 52, { fill: '#e5e7eb' }),
  ...Array.from({ length: 14 }, (_, index) =>
    rect(625 + index * 80, 3548, 42, 14, { fill: '#ffffff', opacity: 0.9 }),
  ),
].join('')

const serviceLabels = [
  label('小卖', 510, 2055, 145, 92, {
    fill: '#fde047',
    stroke: '#facc15',
    textFill: '#f97316',
    size: 36,
  }),
  label('小卖', 510, 2292, 145, 92, {
    fill: '#fde047',
    stroke: '#facc15',
    textFill: '#f97316',
    size: 36,
  }),
  label('票务中心', 125, 1215, 110, 300, {
    fill: '#ffffff',
    stroke: '#fb7185',
    textFill: '#ef4444',
    size: 28,
  }).replace('票务中心', '<tspan x="180" dy="-42">票务</tspan><tspan x="180" dy="42">中心</tspan>'),
  label('商务洽谈区', 230, 1595, 150, 330, {
    fill: '#ffffff',
    stroke: '#fb7185',
    textFill: '#ef4444',
    size: 28,
  }).replace('商务洽谈区', '<tspan x="305" dy="-58">商务</tspan><tspan x="305" dy="42">洽谈</tspan><tspan x="305" dy="42">区</tspan>'),
  marker('WC', 205, 3180, { fill: '#a78bfa', width: 82, height: 70, size: 27 }),
  marker('WC', 210, 1975, { width: 78, height: 66, size: 27 }),
].join('')

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${outputWidth}" height="${outputHeight}" viewBox="0 0 ${baseWidth} ${baseHeight}">
  ${defs}
  ${background}
  ${roadsAndGreenery}
  ${topArea}
  ${leftInternal}
  ${theatre}
  ${halls}
  ${frontPlaza}
  ${serviceLabels}
  ${gatesAndRoads}
</svg>
`

fs.mkdirSync(outputDir, { recursive: true })
fs.writeFileSync(svgPath, svg, 'utf8')
fs.writeFileSync(
  htmlPath,
  `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:white;overflow:hidden;}svg{display:block;width:${outputWidth}px;height:${outputHeight}px;}</style></head><body>${svg}</body></html>`,
  'utf8',
)

console.log(`SVG: ${svgPath}`)
console.log(`HTML: ${htmlPath}`)
console.log(`Size: ${outputWidth}x${outputHeight}`)
