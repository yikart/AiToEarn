/**
 * beliefs.ts - 公司信念数据
 * 已弃用：数据已迁移到国际化文件中
 * 保留类型定义以备后用
 */

export interface Belief {
  id: string
  title: string
  description: string
}

/** @deprecated 使用国际化翻译代替 */
export const beliefs: Belief[] = []

/** @deprecated CEO 信息已移除 */
export const ceoInfo = {
  name: '',
  title: '',
  image: '',
}
