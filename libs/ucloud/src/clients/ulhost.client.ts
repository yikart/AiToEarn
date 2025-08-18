import Client from '@ucloud-sdks/ucloud-sdk-js/lib/core/client'
import Request from '@ucloud-sdks/ucloud-sdk-js/lib/core/request'

// ===============================
// ULHost Instance Interfaces
// ===============================

/**
 * 创建轻量应用云主机请求参数
 */
export interface CreateULHostInstanceRequest {
  /** 地域。 参见 地域和可用区列表 */
  Region: string
  /** 项目ID（可选） */
  ProjectId?: string
  /** 镜像标识符 */
  ImageId: string
  /** 套餐ID */
  BundleId: string
  /** 密码（base64编码） */
  Password: string
  /** 主机名称（可选） */
  Name?: string
  /** 计费类型（Year/Month，默认Month） */
  ChargeType?: 'Year' | 'Month'
  /** 购买时长（默认1） */
  Quantity?: number
  /** VPC ID（可选） */
  VPCId?: string
  /** 子网ID（可选） */
  SubnetId?: string
  /** 安全组ID（可选） */
  SecurityGroupId?: string
  /** 优惠券ID（可选） */
  CouponId?: string
}

/**
 * 创建轻量应用云主机响应
 */
export interface CreateULHostInstanceResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 操作名称 */
  Action: string
  /** 错误信息 */
  Message?: string
  /** 实例标识符 */
  ULHostId: string
}

/**
 * 获取轻量应用云主机套餐列表请求参数
 */
export interface DescribeULHostBundlesRequest {
  /** 地域 */
  Region: string
  /** 项目ID（可选） */
  ProjectId?: string
}

/**
 * 套餐信息
 */
export interface ULHostBundle {
  /** 套餐唯一标识符 */
  BundleId: string
  /** CPU核数 */
  CPU: number
  /** 内存大小（MB） */
  Memory: number
  /** 系统盘大小（GB） */
  SysDiskSpace: number
  /** 外网带宽（Mbps） */
  Bandwidth: number
  /** 流量包大小（GB） */
  TrafficPacket: number
}

/**
 * 获取轻量应用云主机套餐列表响应
 */
export interface DescribeULHostBundlesResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 操作名称 */
  Action: string
  /** 错误信息 */
  Message?: string
  /** 可用主机套餐列表 */
  Bundles: ULHostBundle[]
}

/**
 * 获取轻量应用云主机列表请求参数
 */
export interface DescribeULHostInstanceRequest {
  /** 地域 */
  Region: string
  /** 项目ID（可选） */
  ProjectId?: string
  /** 轻量应用云主机ID数组（可选） */
  ULHostIds?: string[]
  /** 列表起始位置（默认0） */
  Offset?: number
  /** 返回数据长度（默认20，最大100） */
  Limit?: number
}

/**
 * 轻量应用云主机实例信息
 */
export interface ULHostInstance {
  /** 可用区 */
  Zone: string
  /** ULHost ID */
  ULHostId: string
  /** 实例名称 */
  Name: string
  /** CPU核数 */
  CPU: number
  /** 内存大小 */
  Memory: number
  /** 实例状态 */
  State: string
  /** 计费类型 */
  ChargeType: string
  /** IP集合 */
  IPSet: unknown[]
  /** 磁盘集合 */
  DiskSet: unknown[]
  /** 过期详情 */
  ExpireTime?: number
}

/**
 * 获取轻量应用云主机列表响应
 */
export interface DescribeULHostInstanceResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 操作名称 */
  Action: string
  /** 错误信息 */
  Message?: string
  /** 实例列表 */
  ULHostInstanceSets: ULHostInstance[]
}

/**
 * 获取轻量应用云主机套餐价格请求参数
 */
export interface GetULHostInstancePriceRequest {
  /** 地域 */
  Region: string
  /** 项目ID（可选） */
  ProjectId?: string
  /** 套餐/套餐ID */
  BundleId: string
  /** 计费模式（Year/Month，可选） */
  ChargeType?: 'Year' | 'Month'
  /** 主机数量（1-5，默认1） */
  Count?: number
  /** 购买时长（默认1） */
  Quantity?: number
}

/**
 * 价格信息
 */
export interface PriceInfo {
  /** 计费模式 */
  ChargeType: string
  /** 当前价格 */
  Price: number
  /** 原价/标价 */
  OriginalPrice: number
}

/**
 * 获取轻量应用云主机套餐价格响应
 */
export interface GetULHostInstancePriceResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 操作名称 */
  Action: string
  /** 错误信息 */
  Message?: string
  /** 价格信息 */
  PriceSet: PriceInfo[]
}

/**
 * 获取主机续费价格请求参数
 */
export interface GetULHostRenewPriceRequest {
  /** 地域 */
  Region: string
  /** 项目ID（可选） */
  ProjectId?: string
  /** ULHost实例ID */
  ULHostId: string
  /** 计费类型（Year/Month，默认Month） */
  ChargeType?: 'Year' | 'Month'
}

/**
 * 获取主机续费价格响应
 */
export interface GetULHostRenewPriceResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 操作名称 */
  Action: string
  /** 错误信息 */
  Message?: string
  /** 价格信息 */
  PriceSet: PriceInfo[]
}

/**
 * 修改轻量应用主机属性信息请求参数
 */
export interface ModifyULHostAttributeRequest {
  /** 地域 */
  Region: string
  /** ULHost实例ID */
  ULHostId: string
  /** 项目ID（可选） */
  ProjectId?: string
  /** 要修改的名称（可选） */
  Name?: string
  /** 要修改的备注（可选） */
  Remark?: string
}

/**
 * 修改轻量应用主机属性信息响应
 */
export interface ModifyULHostAttributeResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 操作名称 */
  Action: string
  /** 错误信息 */
  Message?: string
  /** 修改的实例ID */
  ULHostId: string
}

/**
 * 模拟主机掉电请求参数
 */
export interface PoweroffULHostInstanceRequest {
  /** 地域 */
  Region: string
  /** 项目ID（可选） */
  ProjectId?: string
  /** UHost实例ID */
  ULHostId: string
}

/**
 * 模拟主机掉电响应
 */
export interface PoweroffULHostInstanceResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 操作名称 */
  Action: string
  /** 错误信息 */
  Message?: string
  /** UHost实例ID */
  ULHostId: string
}

/**
 * 重启轻量应用云主机请求参数
 */
export interface RebootULHostInstanceRequest {
  /** 地域 */
  Region: string
  /** 项目ID（可选） */
  ProjectId?: string
  /** ULHost实例ID */
  ULHostId: string
}

/**
 * 重启轻量应用云主机响应
 */
export interface RebootULHostInstanceResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 操作名称 */
  Action: string
  /** 错误信息 */
  Message?: string
  /** 确认的实例ID */
  ULHostId?: string
}

/**
 * 重装轻量应用云主机请求参数
 */
export interface ReinstallULHostInstanceRequest {
  /** 地域 */
  Region: string
  /** 实例ID */
  ULHostId: string
  /** 镜像ID */
  ImageId: string
  /** 登录密码（base64编码） */
  Password: string
  /** 项目ID（可选） */
  ProjectId?: string
}

/**
 * 重装轻量应用云主机响应
 */
export interface ReinstallULHostInstanceResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 操作名称 */
  Action: string
  /** 错误信息 */
  Message?: string
  /** 实例ID */
  ULHostId: string
}

/**
 * 重置轻量应用云主机密码请求参数
 */
export interface ResetULHostInstancePasswordRequest {
  /** 地域 */
  Region: string
  /** ULHost实例ID */
  ULHostId: string
  /** 新密码（BASE64编码） */
  Password: string
  /** 项目ID（可选） */
  ProjectId?: string
}

/**
 * 重置轻量应用云主机密码响应
 */
export interface ResetULHostInstancePasswordResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 操作名称 */
  Action: string
  /** ULHost实例ID */
  ULHostId: string
  /** 错误信息 */
  Message?: string
}

/**
 * 启动轻量应用主机请求参数
 */
export interface StartULHostInstanceRequest {
  /** 地域 */
  Region: string
  /** ULHost实例ID */
  ULHostId: string
  /** 项目ID（可选） */
  ProjectId?: string
}

/**
 * 启动轻量应用主机响应
 */
export interface StartULHostInstanceResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 操作名称 */
  Action: string
  /** 启动的实例ID */
  ULHostId: string
  /** 错误信息 */
  Message?: string
}

/**
 * 关闭轻量应用云主机请求参数
 */
export interface StopULHostInstanceRequest {
  /** 地域 */
  Region: string
  /** 项目ID（可选） */
  ProjectId?: string
  /** ULHost实例ID */
  ULHostId: string
}

/**
 * 关闭轻量应用云主机响应
 */
export interface StopULHostInstanceResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 操作名称 */
  Action: string
  /** 错误信息 */
  Message?: string
  /** 关闭的实例ID */
  ULHostId: string
}

/**
 * 删除轻量应用云主机请求参数
 */
export interface TerminateULHostInstanceRequest {
  /** 地域 */
  Region: string
  /** 项目ID（可选） */
  ProjectId?: string
  /** ULHost资源ID */
  ULHostId: string
  /** 是否删除附加数据盘（默认false） */
  ReleaseUDisk?: boolean
}

/**
 * 删除轻量应用云主机响应
 */
export interface TerminateULHostInstanceResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 操作名称 */
  Action: string
  /** 错误信息 */
  Message?: string
  /** 删除状态（"Yes"=回收站，"No"=永久删除） */
  InRecycle: string
  /** 实例ID */
  ULHostId: string
}

/**
 * UCloud轻量应用云主机客户端
 * 提供轻量应用云主机的完整API操作
 */
export class ULHostClient extends Client {
  /**
   * 创建轻量应用云主机
   * @param request 创建请求参数
   * @returns 创建结果，包含主机ID
   */
  async createULHostInstance(request: CreateULHostInstanceRequest): Promise<CreateULHostInstanceResponse> {
    const args = Object.assign({ Action: 'CreateULHostInstance' }, request)
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as CreateULHostInstanceResponse
  }

  /**
   * 获取轻量应用云主机套餐列表
   * @param request 查询请求参数
   * @returns 套餐列表
   */
  async describeULHostBundles(request: DescribeULHostBundlesRequest): Promise<DescribeULHostBundlesResponse> {
    const args = Object.assign({ Action: 'DescribeULHostBundles' }, request)
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as DescribeULHostBundlesResponse
  }

  /**
   * 获取轻量应用云主机列表
   * @param request 查询请求参数
   * @returns 主机实例列表
   */
  async describeULHostInstance(request: DescribeULHostInstanceRequest): Promise<DescribeULHostInstanceResponse> {
    const args = Object.assign({ Action: 'DescribeULHostInstance' }, request)
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as DescribeULHostInstanceResponse
  }

  /**
   * 获取轻量应用云主机套餐价格
   * @param request 价格查询请求参数
   * @returns 价格信息
   */
  async getULHostInstancePrice(request: GetULHostInstancePriceRequest): Promise<GetULHostInstancePriceResponse> {
    const args = Object.assign({ Action: 'GetULHostInstancePrice' }, request)
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as GetULHostInstancePriceResponse
  }

  /**
   * 获取主机续费价格
   * @param request 续费价格查询请求参数
   * @returns 续费价格信息
   */
  async getULHostRenewPrice(request: GetULHostRenewPriceRequest): Promise<GetULHostRenewPriceResponse> {
    const args = Object.assign({ Action: 'GetULHostRenewPrice' }, request)
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as GetULHostRenewPriceResponse
  }

  /**
   * 修改轻量应用主机属性信息
   * @param request 修改请求参数
   * @returns 修改结果
   */
  async modifyULHostAttribute(request: ModifyULHostAttributeRequest): Promise<ModifyULHostAttributeResponse> {
    const args = Object.assign({ Action: 'ModifyULHostAttribute' }, request)
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as ModifyULHostAttributeResponse
  }

  /**
   * 模拟主机掉电（危险操作：可能影响数据完整性或导致文件系统损坏）
   * @param request 掉电请求参数
   * @returns 掉电结果
   */
  async poweroffULHostInstance(request: PoweroffULHostInstanceRequest): Promise<PoweroffULHostInstanceResponse> {
    const args = Object.assign({ Action: 'PoweroffULHostInstance' }, request)
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as PoweroffULHostInstanceResponse
  }

  /**
   * 重启轻量应用云主机
   * @param request 重启请求参数
   * @returns 重启结果
   */
  async rebootULHostInstance(request: RebootULHostInstanceRequest): Promise<RebootULHostInstanceResponse> {
    const args = Object.assign({ Action: 'RebootULHostInstance' }, request)
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as RebootULHostInstanceResponse
  }

  /**
   * 重装轻量应用云主机（注意：不支持自定义镜像重装）
   * @param request 重装请求参数
   * @returns 重装结果
   */
  async reinstallULHostInstance(request: ReinstallULHostInstanceRequest): Promise<ReinstallULHostInstanceResponse> {
    const args = Object.assign({ Action: 'ReinstallULHostInstance' }, request)
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as ReinstallULHostInstanceResponse
  }

  /**
   * 重置轻量应用云主机密码（注意：UHost实例必须处于停止状态）
   * @param request 重置密码请求参数
   * @returns 重置结果
   */
  async resetULHostInstancePassword(request: ResetULHostInstancePasswordRequest): Promise<ResetULHostInstancePasswordResponse> {
    const args = Object.assign({ Action: 'ResetULHostInstancePassword' }, request)
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as ResetULHostInstancePasswordResponse
  }

  /**
   * 启动轻量应用主机
   * @param request 启动请求参数
   * @returns 启动结果
   */
  async startULHostInstance(request: StartULHostInstanceRequest): Promise<StartULHostInstanceResponse> {
    const args = Object.assign({ Action: 'StartULHostInstance' }, request)
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as StartULHostInstanceResponse
  }

  /**
   * 关闭轻量应用云主机
   * @param request 关闭请求参数
   * @returns 关闭结果
   */
  async stopULHostInstance(request: StopULHostInstanceRequest): Promise<StopULHostInstanceResponse> {
    const args = Object.assign({ Action: 'StopULHostInstance' }, request)
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as StopULHostInstanceResponse
  }

  /**
   * 删除轻量应用云主机（注意：非试用的过期资源不可删除，仅在主机关机状态下可删除）
   * @param request 删除请求参数
   * @returns 删除结果，包含是否进入回收站信息
   */
  async terminateULHostInstance(request: TerminateULHostInstanceRequest): Promise<TerminateULHostInstanceResponse> {
    const args = Object.assign({ Action: 'TerminateULHostInstance' }, request)
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as TerminateULHostInstanceResponse
  }
}
