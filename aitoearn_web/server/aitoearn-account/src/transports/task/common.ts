export enum ContentTag {
  BEAUTY = '美妆',
  TRAVEL = '旅游',
  FOOD = '美食',
  FASHION = '时尚',
  LIFESTYLE = '生活',
  TECH = '科技',
  SPORTS = '运动',
  MUSIC = '音乐',
  DANCE = '舞蹈',
  GAME = '游戏',
  EDUCATION = '教育',
  ENTERTAINMENT = '娱乐',
  HEALTH = '健康',
  FINANCE = '金融',
  BUSINESS = '商业',
  ART = '艺术',
  PHOTOGRAPHY = '摄影',
  PETS = '宠物',
  PARENTING = '育儿',
  HOME = '家居',
}

export interface AccountPortraitReportData {
  accountId: string
  contentTags?: Record<string, number>
  totalFollowers?: number
  totalWorks?: number
  totalViews?: number
  totalLikes?: number
  totalCollects?: number
}
