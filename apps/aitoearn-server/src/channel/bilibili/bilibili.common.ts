export enum VideoUTypes {
  Little = 0,
  Big = 1,
}

export interface BClient {
  clientName: string
  clientId: string
  clientSecret: string
  authBackUrl: string
}

export enum NoReprint {
  No = 1,
  Yes = 0,
}

export enum Copyright {
  Original = 1, // 原创
  Reprint = 2,
}

export interface BilibiliPublishOption {
  tid: number // 分区ID，由获取分区信息接口得到
  no_reprint?: NoReprint // 是否允许转载 0-允许，1-不允许。默认0
  copyright: Copyright // 1-原创，2-转载(转载时source必填)
  source?: string // 如果copyright为转载，则此字段表示转载来源
  topic_id?: number // 参加的话题ID，默认情况下不填写，需要填写和运营联系
}

export type AddArchiveData = {
  title: string // 标题
  cover?: string // 封面url
  desc?: string // 描述
} & BilibiliPublishOption

export enum ArchiveStatus {
  all = 'all',
  is_pubing = 'is_pubing',
  pubed = 'pubed',
  not_pubed = 'not_pubed',
}

export interface AccessToken {
  access_token: string // 'd30bedaa4d8eb3128cf35ddc1030e27d';
  expires_in: number // 1630220614;
  refresh_token: string // 'WxFDKwqScZIQDm4iWmKDvetyFugM6HkX';
  scopes: string[] // ['USER_INFO', 'ATC_DATA', 'ATC_BASE'];
}
