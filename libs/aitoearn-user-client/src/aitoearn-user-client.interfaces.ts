export interface User {
  id: string
  name: string
  mail: string
  avatar?: string
  phone?: string
  wxOpenid?: string
  wxUnionid?: string
  popularizeCode?: string // 我的推广码
  inviteUserId?: string // 邀请人用户ID
  inviteCode?: string // 我填写的邀请码
  score: number // 积分字段
}

export interface IdDto {
  id: string
}
