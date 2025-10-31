/**
 * 云空间配置任务数据
 */
export interface CloudspaceConfigureData {
  /** 云空间ID */
  cloudSpaceId: string
}

/**
 * 云空间过期处理任务数据
 */
export interface CloudspaceExpirationData {
  /** 云空间ID */
  cloudSpaceId: string
  /** 其他任务参数 */
  [key: string]: any
}
