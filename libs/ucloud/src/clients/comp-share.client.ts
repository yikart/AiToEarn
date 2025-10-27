import Client from '@ucloud-sdks/ucloud-sdk-js/lib/core/client'
import Request from '@ucloud-sdks/ucloud-sdk-js/lib/core/request'

// ===============================
// CompShare Instance Interfaces
// ===============================

/**
 * 创建轻量级算力平台主机资源请求参数
 */
export interface CreateCompShareInstanceRequest {
  /** 地域 */
  Region: string
  /** 可用区 */
  Zone: string
  /** 项目ID（可选） */
  ProjectId?: string
  /** 磁盘配置数组 */
  Disks: {
    /** 是否为启动盘 */
    IsBoot: boolean
    /** 磁盘类型 */
    Type: string
    /** 磁盘大小 */
    Size: number
  }[]
  /** 机器类型 */
  MachineType: string
  /** GPU数量 */
  GPU: number
  /** 内存大小（MB，1024-262144，默认8192） */
  Memory?: number
  /** CPU核数（1-64，默认4） */
  CPU?: number
  /** GPU类型（G类型机器必需） */
  GpuType?: string
  /** 算力平台镜像ID */
  CompShareImageId: string
  /** 登录方式（默认Password） */
  LoginMode?: string
  /** 计费类型 */
  ChargeType?: 'Month' | 'Day' | 'Dynamic' | 'Postpay' | 'Spot'
  /** 购买数量 */
  Quantity?: number
  /** 密码（base64编码） */
  Password?: string
  /** 主机名称 */
  Name?: string
  /** 安全组ID */
  SecurityGroupId?: string
}

/**
 * 创建轻量级算力平台主机资源响应
 */
export interface CreateCompShareInstanceResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 操作名称 */
  Action: string
  /** 错误信息 */
  Message?: string
  /** 创建的主机ID数组 */
  UHostIds: string[]
}

/**
 * 获取算力平台镜像信息请求参数
 */
export interface DescribeCompShareImagesRequest {
  /** 地域 */
  Region: string
  /** 可用区（可选） */
  Zone?: string
  /** 项目ID（可选） */
  ProjectId?: string
  /** 镜像类型（System=平台镜像，App=应用镜像） */
  ImageType?: 'System' | 'App'
  /** 特定镜像ID */
  CompShareImageId?: string
  /** 镜像名称（支持模糊匹配） */
  Name?: string
  /** 镜像作者昵称 */
  Author?: string
  /** 镜像标签 */
  Tag?: string
  /** 列表起始位置（默认0） */
  Offset?: number
  /** 返回数据长度（默认20，最大100） */
  Limit?: number
}

/**
 * 算力平台镜像信息
 */
export interface CompShareImage {
  /** 镜像ID */
  CompShareImageId: string
  /** 镜像名称 */
  Name: string
  /** 镜像作者 */
  Author: string
  /** 镜像类型 */
  ImageType: string
  /** 镜像状态 */
  Status: string
  /** 镜像大小 */
  Size: number
  /** 镜像描述 */
  Description?: string
  /** 镜像标签 */
  Tags?: string[]
  /** 镜像价格 */
  Price?: number
  /** 创建次数 */
  CreatedCount?: number
  /** 收藏次数 */
  FavoritesCount?: number
  /** 创建时间 */
  CreateTime?: string
}

/**
 * 获取算力平台镜像信息响应
 */
export interface DescribeCompShareImagesResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 操作名称 */
  Action: string
  /** 错误信息 */
  Message?: string
  /** 镜像详情数组 */
  ImageSet: CompShareImage[]
  /** 镜像总数 */
  TotalCount: number
}

/**
 * 获取社区镜像列表请求参数
 */
export interface DescribeCommunityImagesRequest {
  /** 地域 */
  'Region': string
  /** 可用区 */
  'Zone': string
  /** 项目ID（可选） */
  'ProjectId'?: string
  /** 特定镜像ID */
  'CompShareImageId'?: string
  /** 镜像名称（模糊搜索） */
  'Name'?: string
  /** 镜像作者 */
  'Author'?: string
  /** 列表起始位置（默认0） */
  'Offset'?: number
  /** 返回数据长度（默认20，最大100） */
  'Limit'?: number
  /** 标签（精确匹配） */
  'Tag'?: string
  /** 排序条件字段（Favor, PubTime, Price, CreatedCount） */
  'SortCondition.Field'?: 'Favor' | 'PubTime' | 'Price' | 'CreatedCount'
  /** 升序排序 */
  'SortCondition.ASC'?: string
}

/**
 * 社区镜像信息
 */
export interface CommunityImage {
  /** 镜像ID */
  CompShareImageId: string
  /** 镜像名称 */
  Name: string
  /** 镜像作者 */
  Author: string
  /** 镜像类型 */
  ImageType: string
  /** 镜像状态 */
  Status: string
  /** 镜像大小 */
  Size: number
  /** 镜像标签 */
  Tags: string[]
  /** 镜像价格 */
  Price: number
  /** 创建时间 */
  CreateTime: string
  /** 发布时间 */
  PubTime: string
}

/**
 * 获取社区镜像列表响应
 */
export interface DescribeCommunityImagesResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 操作名称 */
  Action: string
  /** 错误信息 */
  Message?: string
  /** 社区镜像数组 */
  ImageSet: CommunityImage[]
  /** 镜像总数 */
  TotalCount: number
}

/**
 * 获取自制镜像列表请求参数
 */
export interface DescribeCompShareCustomImagesRequest {
  /** 地域 */
  Region: string
  /** 可用区 */
  Zone: string
  /** 项目ID（可选） */
  ProjectId?: string
  /** 特定镜像ID */
  CompShareImageId?: string
  /** 列表起始位置（默认0） */
  Offset?: number
  /** 返回数据长度（默认20，最大100） */
  Limit?: number
}

/**
 * 自制镜像信息
 */
export interface CompShareCustomImage {
  /** 镜像ID */
  CompShareImageId: string
  /** 镜像名称 */
  Name: string
  /** 镜像作者 */
  Author: string
  /** 镜像类型 */
  ImageType: string
  /** 镜像状态 */
  Status: string
  /** 镜像大小 */
  Size: number
  /** 可见性 */
  Visibility: string
  /** 镜像描述 */
  Description?: string
  /** 镜像标签 */
  Tags?: string[]
  /** 镜像价格 */
  Price?: number
  /** 创建时间 */
  CreateTime: string
}

/**
 * 获取自制镜像列表响应
 */
export interface DescribeCompShareCustomImagesResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 操作名称 */
  Action: string
  /** 错误信息 */
  Message?: string
  /** 自制镜像数组 */
  ImageSet: CompShareCustomImage[]
  /** 镜像总数 */
  TotalCount?: number
}

/**
 * 获取用户所有地域的主机资源列表请求参数
 */
export interface DescribeCompShareInstanceRequest {
  /** 地域（可选） */
  Region?: string
  /** 可用区（可选） */
  Zone?: string
  /** 项目ID（可选） */
  ProjectId?: string
  /** 特定主机资源ID数组 */
  UHostIds?: string[]
  /** 过滤无GPU的主机 */
  WithoutGpu?: boolean
  /** 列表起始位置（默认0） */
  Offset?: number
  /** 返回数据长度（默认20，最大100） */
  Limit?: number
}

/**
 * 算力平台实例信息
 */
export interface CompShareInstance {
  /** 可用区 */
  Zone: string
  /** 主机ID */
  UHostId: string
  /** CPU核数 */
  CPU: number
  /** 内存大小 */
  Memory: number
  /** 主机状态 */
  State: string
  /** 计费类型 */
  ChargeType: string
  /** IP配置 */
  IPSet?: unknown[]
  /** 磁盘信息 */
  DiskSet?: unknown[]
  /** 网络信息 */
  NetworkInfo?: unknown
}

/**
 * 获取用户所有地域的主机资源列表响应
 */
export interface DescribeCompShareInstanceResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 主机实例总数 */
  TotalCount: number
  /** 云主机实例列表 */
  UHostSet: CompShareInstance[]
}

/**
 * 重启轻量算力平台实例请求参数
 */
export interface RebootCompShareInstanceRequest {
  /** 地域 */
  Region: string
  /** 可用区 */
  Zone: string
  /** 项目ID（可选） */
  ProjectId?: string
  /** 实例ID */
  UHostId: string
}

/**
 * 重启轻量算力平台实例响应
 */
export interface RebootCompShareInstanceResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 操作名称 */
  Action: string
  /** 错误信息 */
  Message?: string
  /** 重启的实例ID */
  UHostId: string
}

/**
 * 重装算力平台实例请求参数
 */
export interface ReinstallCompShareInstanceRequest {
  /** 地域 */
  Region: string
  /** 可用区 */
  Zone: string
  /** 项目ID（可选） */
  ProjectId?: string
  /** 实例ID */
  UHostId: string
  /** 镜像ID */
  CompShareImageId: string
  /** 新实例密码（可选） */
  Password?: string
}

/**
 * 重装算力平台实例响应
 */
export interface ReinstallCompShareInstanceResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 操作名称 */
  Action: string
  /** 错误信息 */
  Message?: string
  /** 实例ID */
  UHostId: string
}

/**
 * 重置算力平台实例密码请求参数
 */
export interface ResetCompShareInstancePasswordRequest {
  /** 地域 */
  Region: string
  /** 可用区 */
  Zone: string
  /** 项目ID（可选） */
  ProjectId?: string
  /** 实例ID */
  UHostId: string
  /** 新密码（Base64编码） */
  Password: string
}

/**
 * 重置算力平台实例密码响应
 */
export interface ResetCompShareInstancePasswordResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 操作名称 */
  Action: string
  /** 错误信息 */
  Message?: string
  /** 实例ID */
  UHostId: string
}

/**
 * 启动算力平台实例请求参数
 */
export interface StartCompShareInstanceRequest {
  /** 地域 */
  Region: string
  /** 可用区 */
  Zone: string
  /** 项目ID（可选） */
  ProjectId?: string
  /** 实例ID */
  UHostId: string
}

/**
 * 启动算力平台实例响应
 */
export interface StartCompShareInstanceResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 操作名称 */
  Action: string
  /** 错误信息 */
  Message?: string
  /** 实例ID */
  UHostId: string
}

/**
 * 关闭算力平台实例请求参数
 */
export interface StopCompShareInstanceRequest {
  /** 地域 */
  Region: string
  /** 可用区 */
  Zone: string
  /** 项目ID（可选） */
  ProjectId?: string
  /** 实例ID */
  UHostId: string
}

/**
 * 关闭算力平台实例响应
 */
export interface StopCompShareInstanceResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 操作名称 */
  Action: string
  /** 错误信息 */
  Message?: string
  /** 实例ID */
  UHostId: string
}

/**
 * 删除轻量算力共享平台虚机实例请求参数
 */
export interface TerminateCompShareInstanceRequest {
  /** 地域 */
  Region: string
  /** 可用区 */
  Zone: string
  /** 项目ID（可选） */
  ProjectId?: string
  /** 虚机资源ID */
  UHostId: string
}

/**
 * 删除轻量算力共享平台虚机实例响应
 */
export interface TerminateCompShareInstanceResponse {
  /** 返回码，0表示成功 */
  RetCode: number
  /** 操作名称 */
  Action: string
  /** 错误信息 */
  Message?: string
  /** 虚机资源ID */
  UHostId: string
}

/**
 * UCloud算力共享平台客户端
 * 提供轻量级算力平台的完整API操作
 */
export class CompShareClient extends Client {
  /**
   * 创建轻量级算力平台主机资源
   * @param request 创建请求参数
   * @returns 创建结果，包含主机ID列表
   */
  async createCompShareInstance(request: CreateCompShareInstanceRequest): Promise<CreateCompShareInstanceResponse> {
    const args = Object.assign({ Action: 'CreateCompShareInstance' }, request)
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as CreateCompShareInstanceResponse
  }

  /**
   * 获取算力平台镜像信息
   * @param request 查询请求参数
   * @returns 镜像列表和总数
   */
  async describeCompShareImages(request: DescribeCompShareImagesRequest): Promise<DescribeCompShareImagesResponse> {
    const args = Object.assign({ Action: 'DescribeCompShareImages' }, request)
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as DescribeCompShareImagesResponse
  }

  /**
   * 获取社区镜像列表
   * @param request 查询请求参数
   * @returns 社区镜像列表和总数
   */
  async describeCommunityImages(request: DescribeCommunityImagesRequest): Promise<DescribeCommunityImagesResponse> {
    const args = Object.assign({ Action: 'DescribeCommunityImages' }, request)
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as DescribeCommunityImagesResponse
  }

  /**
   * 获取自制镜像列表
   * @param request 查询请求参数
   * @returns 自制镜像列表和总数
   */
  async describeCompShareCustomImages(request: DescribeCompShareCustomImagesRequest): Promise<DescribeCompShareCustomImagesResponse> {
    const args = Object.assign({ Action: 'DescribeCompShareCustomImages' }, request)
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as DescribeCompShareCustomImagesResponse
  }

  /**
   * 获取用户所有地域的主机资源列表
   * @param request 查询请求参数
   * @returns 主机实例列表和总数
   */
  async describeCompShareInstance(request?: DescribeCompShareInstanceRequest): Promise<DescribeCompShareInstanceResponse> {
    const args = Object.assign({ Action: 'DescribeCompShareInstance' }, request || {})
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as DescribeCompShareInstanceResponse
  }

  /**
   * 重启轻量算力平台实例
   * @param request 重启请求参数
   * @returns 重启结果
   */
  async rebootCompShareInstance(request: RebootCompShareInstanceRequest): Promise<RebootCompShareInstanceResponse> {
    const args = Object.assign({ Action: 'RebootCompShareInstance' }, request)
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as RebootCompShareInstanceResponse
  }

  /**
   * 重装算力平台实例
   * @param request 重装请求参数
   * @returns 重装结果
   */
  async reinstallCompShareInstance(request: ReinstallCompShareInstanceRequest): Promise<ReinstallCompShareInstanceResponse> {
    const args = Object.assign({ Action: 'ReinstallCompShareInstance' }, request)
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as ReinstallCompShareInstanceResponse
  }

  /**
   * 重置算力平台实例密码
   * @param request 重置密码请求参数
   * @returns 重置结果
   */
  async resetCompShareInstancePassword(request: ResetCompShareInstancePasswordRequest): Promise<ResetCompShareInstancePasswordResponse> {
    const args = Object.assign({ Action: 'ResetCompShareInstancePassword' }, request)
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as ResetCompShareInstancePasswordResponse
  }

  /**
   * 启动算力平台实例
   * @param request 启动请求参数
   * @returns 启动结果
   */
  async startCompShareInstance(request: StartCompShareInstanceRequest): Promise<StartCompShareInstanceResponse> {
    const args = Object.assign({ Action: 'StartCompShareInstance' }, request)
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as StartCompShareInstanceResponse
  }

  /**
   * 关闭算力平台实例
   * @param request 关闭请求参数
   * @returns 关闭结果
   */
  async stopCompShareInstance(request: StopCompShareInstanceRequest): Promise<StopCompShareInstanceResponse> {
    const args = Object.assign({ Action: 'StopCompShareInstance' }, request)
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as StopCompShareInstanceResponse
  }

  /**
   * 删除轻量算力共享平台虚机实例
   * @param request 删除请求参数
   * @returns 删除结果
   */
  async terminateCompShareInstance(request: TerminateCompShareInstanceRequest): Promise<TerminateCompShareInstanceResponse> {
    const args = Object.assign({ Action: 'TerminateCompShareInstance' }, request)
    return await this.invoke(new Request(args)).then(resp => resp.toObject()) as TerminateCompShareInstanceResponse
  }
}
