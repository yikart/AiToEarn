/**
 * tagConfig - 任务标签配置中心
 * 前端统一管理所有 tag 值、标签、颜色，供创建任务、筛选、卡片渲染使用
 * 后端无"查询所有 tags"接口，故由前端维护
 */

import { directTrans } from '@/app/i18n/client'

/** 标签类型枚举，值与 CreateTabType 一致但类型解耦 */
export enum TagType {
  CPS = 'cps',
  CPM = 'cpm',
  CPE = 'cpe',
  INTERACTION = 'interaction',
  FOLLOW = 'follow',
  BRAND_COMMENT = 'brand_comment',
  FIXED = 'fixed',
}

/** 标签信息 */
export interface ITagInfo {
  /** 显示名称（通过 directTrans 动态解析 i18n） */
  label: string
  /** 标签描述（通过 directTrans 动态解析 i18n） */
  description: string
  /** Tailwind badge 样式类（背景 + 文字颜色） */
  colorClass: string
}

/** 标签信息映射表 */
export const TagInfoMap = new Map<TagType, ITagInfo>([
  [TagType.CPS, {
    label: 'tag.cps',
    description: 'create.tabCpsDesc',
    colorClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  }],
  [TagType.CPM, {
    label: 'tag.cpm',
    description: 'create.tabCpmDesc',
    colorClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  }],
  [TagType.CPE, {
    label: 'tag.promotion',
    description: 'create.tabPromotionMergedDesc',
    colorClass: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  }],
  [TagType.INTERACTION, {
    label: 'tag.interaction',
    description: 'create.tabInteractionDesc',
    colorClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  }],
  [TagType.FOLLOW, {
    label: 'tag.follow',
    description: 'create.tabFollowDesc',
    colorClass: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  }],
  [TagType.BRAND_COMMENT, {
    label: 'tag.brandComment',
    description: 'create.tabBrandCommentDesc',
    colorClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  }],
  [TagType.FIXED, {
    label: 'tag.fixed',
    description: 'create.tabFixedDesc',
    colorClass: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  }],
])

// 遍历设置 label/description getter，实现运行时 i18n 翻译
TagInfoMap.forEach((info) => {
  const rawLabel = info.label
  const rawDescription = info.description
  Object.defineProperty(info, 'label', {
    get() {
      if (typeof directTrans === 'function') {
        return directTrans('task', rawLabel)
      }
      return rawLabel
    },
    configurable: true,
    enumerable: true,
  })
  Object.defineProperty(info, 'description', {
    get() {
      if (typeof directTrans === 'function') {
        return directTrans('task', rawDescription)
      }
      return rawDescription
    },
    configurable: true,
    enumerable: true,
  })
})

/** 标签信息数组，用于遍历 */
export const TagInfoArr = Array.from(TagInfoMap)

/** 根据 tag 值获取标签信息 */
export function getTagInfo(tag: string): ITagInfo | undefined {
  return TagInfoMap.get(tag as TagType)
}
