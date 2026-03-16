# MobileCalendar 移动端日历组件

## 概述

移动端专用的日历组件，用于替代桌面端的 FullCalendar 网格视图。
提供更适合触屏操作的周视图/月视图切换，以及选中日期的任务列表展示。

## 目录结构

```
MobileCalendar/
├── index.tsx                  # 主组件，管理状态和组合子组件
├── MobileCalendarHeader.tsx   # 顶部工具栏（年月选择、视图切换）
├── MobileWeekView.tsx         # 周视图组件
├── MobileMonthView.tsx        # 月视图组件
├── MobileDayRecords.tsx       # 选中日期的任务列表
├── mobileCalendar.types.ts    # 类型定义
└── README.md                  # 本文档
```

## 组件说明

### MobileCalendar (index.tsx)

主组件，负责：

- 管理 `selectedDate`（当前选中日期）
- 管理 `viewType`（'week' | 'month'）
- 组合各子组件
- 接收 `onClickPub` 回调，传递给子组件

**Props:**
| 属性 | 类型 | 说明 |
|------|------|------|
| onClickPub | `(date: string) => void` | 点击添加任务时的回调 |

### MobileCalendarHeader

顶部工具栏，功能：

- 显示当前年月（格式：YYYY/MM）
- 点击年月弹出月份选择器
- 周视图/月视图切换按钮
- 今天按钮

**Props:**
| 属性 | 类型 | 说明 |
|------|------|------|
| currentDate | `Date` | 当前显示的日期 |
| viewType | `'week' \| 'month'` | 当前视图类型 |
| onDateChange | `(date: Date) => void` | 日期改变回调 |
| onViewTypeChange | `(type: ViewType) => void` | 视图切换回调 |
| onToday | `() => void` | 点击今天按钮回调 |

### MobileWeekView

周视图组件，功能：

- 显示星期标题行（Sun/Mon/Tue...）
- 显示当前周的 7 天
- 支持左右滑动切换周
- 选中日期高亮
- 有数据的日期显示小圆点

**Props:**
| 属性 | 类型 | 说明 |
|------|------|------|
| currentDate | `Date` | 当前周的基准日期 |
| selectedDate | `Date` | 选中的日期 |
| onDateSelect | `(date: Date) => void` | 选择日期回调 |
| onWeekChange | `(direction: 'prev' \| 'next') => void` | 周切换回调 |
| recordMap | `Map<string, PublishRecordItem[]>` | 发布记录数据 |

### MobileMonthView

月视图组件，功能：

- 紧凑型月历网格
- 有数据的日期显示小圆点
- 选中日期高亮
- 点击日期切换选中

**Props:**
| 属性 | 类型 | 说明 |
|------|------|------|
| currentDate | `Date` | 当前月的基准日期 |
| selectedDate | `Date` | 选中的日期 |
| onDateSelect | `(date: Date) => void` | 选择日期回调 |
| recordMap | `Map<string, PublishRecordItem[]>` | 发布记录数据 |

### MobileDayRecords

任务列表组件，功能：

- 显示选中日期的所有任务
- 使用 RecordCore 组件展示每条记录
- 支持 loading 骨架屏
- 空状态显示
- 添加任务按钮

**Props:**
| 属性 | 类型 | 说明 |
|------|------|------|
| selectedDate | `Date` | 选中的日期 |
| records | `PublishRecordItem[]` | 当天的发布记录 |
| loading | `boolean` | 加载状态 |
| onClickPub | `(date: string) => void` | 添加任务回调 |

## 数据流

```
useCalendarTiming.recordMap (现有 store)
       ↓
MobileCalendar (获取整月数据用于显示圆点)
       ↓
  ┌────┴────────┐
  ↓             ↓
周/月视图       MobileDayRecords
(根据 recordMap  (根据 selectedDate
 显示有数据的圆点) 过滤显示任务列表)
```

**recordMap 结构：**

```typescript
Map<string, PublishRecordItem[]>
// key: 日期字符串，格式 'YYYY-MM-DD'
// value: 该日期的发布记录数组
```

## 复用的组件/工具

| 组件/工具         | 说明                         |
| ----------------- | ---------------------------- |
| useCalendarTiming | 数据获取和状态管理 store     |
| RecordCore        | 任务详情展示（已支持移动端） |
| useIsMobile       | 设备检测 hook（< 768px）     |
| getDays           | dayjs 工具函数               |
| Popover           | shadcn/ui 弹出层组件         |
| Button/Skeleton   | shadcn/ui 基础组件           |

## 样式规范

- 使用 Tailwind CSS
- 遵循 shadcn/ui 语义化变量
- 选中日期: `bg-(--primary-color) text-white`
- 今天日期: `text-blue-500`（未选中时）
- 小圆点: `bg-blue-500 w-1.5 h-1.5 rounded-full`
- 过去日期: `text-muted-foreground`
- 非当月日期: `text-muted-foreground/40`

## 交互说明

### 日期选择

点击任意日期 → 更新 `selectedDate` → 任务列表刷新

### 周视图滑动

- **左滑**: 显示下一周
- **右滑**: 显示上一周
- **实现**: touch 事件监听，计算滑动距离和方向（阈值 50px）

### 视图切换

点击切换按钮 → 周视图 ⇄ 月视图

- 默认显示周视图
- 使用图标按钮（CalendarDays / Grid3X3）

### 月份跳转

点击顶部年月 → 弹出 Popover 月份选择器 → 选择月份 → 跳转并获取数据

## 国际化

翻译 key 位于 `account` 命名空间下的 `mobileCalendar` 对象：

```json
{
  "mobileCalendar": {
    "weekView": "周视图",
    "monthView": "月视图",
    "tasks": "任务",
    "addTask": "添加任务",
    "noTasks": "该日期暂无任务",
    "addFirstTask": "添加第一个任务"
  }
}
```

## 注意事项

1. **数据获取**: 切换月份时需要调用 `getPubRecord()` 获取新月份数据
2. **小圆点显示**: 只在有数据时显示，空数据不显示
3. **拖拽功能**: 移动端禁用拖拽功能（已在 RecordCore 中处理）
4. **数据同步**: 保持与 PC 端数据同步，共用 `useCalendarTiming` store
5. **设备判断**: 使用 `useIsMobile` hook，断点为 768px

## 修改记录

| 日期       | 修改内容                                      |
| ---------- | --------------------------------------------- |
| 2025-12-30 | 初始版本，实现周视图/月视图切换、任务列表展示 |
