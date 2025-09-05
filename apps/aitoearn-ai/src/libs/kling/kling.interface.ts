// 通用响应类型
export interface KlingResponse<T> {
  /** 错误码；具体定义见错误码 */
  code: number
  /** 错误信息 */
  message: string
  /** 请求ID，系统生成，用于跟踪请求、排查问题 */
  request_id: string
  /** 响应数据 */
  data: T
}

// 任务状态枚举
export enum TaskStatus {
  /** 已提交 */
  Submitted = 'submitted',
  /** 处理中 */
  Processing = 'processing',
  /** 成功 */
  Succeed = 'succeed',
  /** 失败 */
  Failed = 'failed',
}

// 模式枚举
export enum Mode {
  /** 标准模式 */
  Std = 'std',
  /** 专家模式 */
  Pro = 'pro',
}

// 视频时长枚举
export enum Duration {
  /** 5秒 */
  Five = '5',
  /** 10秒 */
  Ten = '10',
}

// 画面纵横比枚举
export enum AspectRatio {
  /** 16:9 */
  SixteenNine = '16:9',
  /** 9:16 */
  NineSixteen = '9:16',
  /** 1:1 */
  OneOne = '1:1',
}

// 运镜类型枚举
export enum CameraControlType {
  /** 简单运镜 */
  Simple = 'simple',
  /** 镜头下压并后退 */
  DownBack = 'down_back',
  /** 镜头前进并上仰 */
  ForwardUp = 'forward_up',
  /** 先右旋转后前进 */
  RightTurnForward = 'right_turn_forward',
  /** 先左旋并前进 */
  LeftTurnForward = 'left_turn_forward',
}

// 编辑模式枚举
export enum EditMode {
  /** 增加元素 */
  Addition = 'addition',
  /** 替换元素 */
  Swap = 'swap',
  /** 删除元素 */
  Removal = 'removal',
}

// 对口型模式枚举
export enum LipSyncMode {
  /** 文本生成视频模式 */
  Text2Video = 'text2video',
  /** 音频生成视频模式 */
  Audio2Video = 'audio2video',
}

// 音色语种枚举
export enum VoiceLanguage {
  /** 中文 */
  Zh = 'zh',
  /** 英文 */
  En = 'en',
}

// 音频类型枚举
export enum AudioType {
  /** 上传文件模式 */
  File = 'file',
  /** 提供下载链接模式 */
  Url = 'url',
}

// 文生视频模型名称
export type Text2VideoModel = 'kling-v1' | 'kling-v1-6' | 'kling-v2-master' | 'kling-v2-1-master' | string

// 图生视频模型名称
export type Image2VideoModel = 'kling-v1' | 'kling-v1-5' | 'kling-v1-6' | 'kling-v2-master' | 'kling-v2-1' | 'kling-v2-1-master' | string

// 多图生视频模型名称
export type MultiImage2VideoModel = 'kling-v1-6' | string

// 多模态视频编辑模型名称
export type MultiElementsModel = 'kling-v1-6' | string

// 对口型模型名称
export type LipSyncModel = 'kling-v1-6' | string

// 视频特效模型名称
export type VideoEffectsSingleImageModel = 'kling-v1-6' | string
export type VideoEffectsInteractionModel = 'kling-v1' | 'kling-v1-5' | 'kling-v1-6' | string

// 运镜配置接口
export interface CameraControlConfig {
  /** 水平运镜，控制摄像机在水平方向上的移动量（沿x轴平移） */
  horizontal?: number
  /** 垂直运镜，控制摄像机在垂直方向上的移动量（沿y轴平移） */
  vertical?: number
  /** 水平摇镜，控制摄像机在水平面上的旋转量（绕y轴旋转） */
  pan?: number
  /** 垂直摇镜，控制摄像机在垂直面上的旋转量（沿x轴旋转） */
  tilt?: number
  /** 旋转运镜，控制摄像机的滚动量（绕z轴旋转） */
  roll?: number
  /** 变焦，控制摄像机的焦距变化，影响视野的远近 */
  zoom?: number
}

// 运镜控制接口
export interface CameraControl {
  /** 预定义的运镜类型 */
  type?: CameraControlType
  /** 运镜配置 */
  config?: CameraControlConfig
}

// 文生视频创建任务请求接口
export interface Text2VideoCreateTaskRequest {
  /** 模型名称 */
  model_name?: Text2VideoModel
  /** 正向文本提示词 */
  prompt: string
  /** 负向文本提示词 */
  negative_prompt?: string
  /** 生成视频的自由度 */
  cfg_scale?: number
  /** 生成视频的模式 */
  mode?: Mode
  /** 控制摄像机运动的协议 */
  camera_control?: CameraControl
  /** 生成视频的画面纵横比 */
  aspect_ratio?: AspectRatio
  /** 生成视频时长 */
  duration?: Duration
  /** 本次任务结果回调通知地址 */
  callback_url?: string
  /** 自定义任务ID */
  external_task_id?: string
}

// 视频结果接口
export interface VideoResult {
  /** 生成的视频ID；全局唯一 */
  id: string
  /** 生成视频的URL */
  url: string
  /** 视频总时长，单位s */
  duration: string
}

// 任务结果接口
export interface TaskResult {
  /** 视频列表 */
  videos: VideoResult[]
}

// 任务信息接口
export interface TaskInfo {
  /** 客户自定义任务ID */
  external_task_id: string
}

// 文生视频创建任务响应数据接口
export interface Text2VideoCreateTaskResponseData {
  /** 任务ID，系统生成 */
  task_id: string
  /** 任务信息 */
  task_info: TaskInfo
  /** 任务状态 */
  task_status: TaskStatus
  /** 任务创建时间，Unix时间戳、单位ms */
  created_at: number
  /** 任务更新时间，Unix时间戳、单位ms */
  updated_at: number
}

// 文生视频查询任务响应数据接口（单个）
export interface Text2VideoGetTaskResponseData {
  /** 任务ID，系统生成 */
  task_id: string
  /** 任务状态 */
  task_status: TaskStatus
  /** 任务状态信息，当任务失败时展示失败原因 */
  task_status_msg?: string
  /** 任务信息 */
  task_info: TaskInfo
  /** 任务结果 */
  task_result: TaskResult
  /** 任务创建时间，Unix时间戳、单位ms */
  created_at: number
  /** 任务更新时间，Unix时间戳、单位ms */
  updated_at: number
}

// 文生视频查询任务列表响应数据接口
export type Text2VideoGetTasksResponseData = Text2VideoGetTaskResponseData[]

// 动态笔刷轨迹点接口
export interface TrajectoryPoint {
  /** 轨迹点横坐标 */
  x: number
  /** 轨迹点纵坐标 */
  y: number
}

// 动态笔刷配置接口
export interface DynamicMask {
  /** 动态笔刷涂抹区域 */
  mask: string
  /** 运动轨迹坐标序列 */
  trajectories: TrajectoryPoint[]
}

// 图生视频创建任务请求接口
export interface Image2VideoCreateTaskRequest {
  /** 模型名称 */
  model_name?: Image2VideoModel
  /** 参考图像 */
  image?: string
  /** 参考图像 - 尾帧控制 */
  image_tail?: string
  /** 正向文本提示词 */
  prompt?: string
  /** 负向文本提示词 */
  negative_prompt?: string
  /** 生成视频的自由度 */
  cfg_scale?: number
  /** 生成视频的模式 */
  mode?: Mode
  /** 静态笔刷涂抹区域 */
  static_mask?: string
  /** 动态笔刷配置列表 */
  dynamic_masks?: DynamicMask[]
  /** 控制摄像机运动的协议 */
  camera_control?: CameraControl
  /** 生成视频时长 */
  duration?: Duration
  /** 本次任务结果回调通知地址 */
  callback_url?: string
  /** 自定义任务ID */
  external_task_id?: string
}

// 图生视频创建任务响应数据接口
export interface Image2VideoCreateTaskResponseData {
  /** 任务ID，系统生成 */
  task_id: string
  /** 任务信息 */
  task_info: TaskInfo
  /** 任务状态 */
  task_status: TaskStatus
  /** 任务创建时间，Unix时间戳、单位ms */
  created_at: number
  /** 任务更新时间，Unix时间戳、单位ms */
  updated_at: number
}

// 图生视频查询任务响应数据接口（单个）
export interface Image2VideoGetTaskResponseData {
  /** 任务ID，系统生成 */
  task_id: string
  /** 任务状态 */
  task_status: TaskStatus
  /** 任务状态信息，当任务失败时展示失败原因 */
  task_status_msg?: string
  /** 任务信息 */
  task_info: TaskInfo
  /** 任务结果 */
  task_result: TaskResult
  /** 任务创建时间，Unix时间戳、单位ms */
  created_at: number
  /** 任务更新时间，Unix时间戳、单位ms */
  updated_at: number
}

// 图生视频查询任务列表响应数据接口
export type Image2VideoGetTasksResponseData = Image2VideoGetTaskResponseData[]

// 图片列表项接口
export interface ImageListItem {
  /** 图片URL */
  image: string
}

// 多图生视频创建任务请求接口
export interface MultiImage2VideoCreateTaskRequest {
  /** 模型名称 */
  model_name?: MultiImage2VideoModel
  /** 图片列表 */
  image_list: ImageListItem[]
  /** 正向文本提示词 */
  prompt: string
  /** 负向文本提示词 */
  negative_prompt?: string
  /** 生成视频的模式 */
  mode?: Mode
  /** 生成视频时长 */
  duration?: Duration
  /** 生成图片的画面纵横比 */
  aspect_ratio?: AspectRatio
  /** 本次任务结果回调通知地址 */
  callback_url?: string
  /** 自定义任务ID */
  external_task_id?: string
}

// 多图生视频创建任务响应数据接口
export interface MultiImage2VideoCreateTaskResponseData {
  /** 任务ID，系统生成 */
  task_id: string
  /** 任务信息 */
  task_info: TaskInfo
  /** 任务状态 */
  task_status: TaskStatus
  /** 任务创建时间，Unix时间戳、单位ms */
  created_at: number
  /** 任务更新时间，Unix时间戳、单位ms */
  updated_at: number
}

// 多图生视频查询任务响应数据接口（单个）
export interface MultiImage2VideoGetTaskResponseData {
  /** 任务ID，系统生成 */
  task_id: string
  /** 任务状态 */
  task_status: TaskStatus
  /** 任务状态信息，当任务失败时展示失败原因 */
  task_status_msg?: string
  /** 任务信息 */
  task_info: TaskInfo
  /** 任务结果 */
  task_result: TaskResult
  /** 任务创建时间，Unix时间戳、单位ms */
  created_at: number
  /** 任务更新时间，Unix时间戳、单位ms */
  updated_at: number
}

// 对口型输入接口
export interface LipSyncInput {
  /** 通过可灵AI生成的视频的ID */
  video_id?: string
  /** 所上传视频的获取链接 */
  video_url?: string
  /** 生成视频的模式 */
  mode: LipSyncMode
  /** 生成对口型视频的文本内容 */
  text?: string
  /** 音色ID */
  voice_id?: string
  /** 音色语种 */
  voice_language?: VoiceLanguage
  /** 语速 */
  voice_speed?: number
  /** 使用音频文件生成对口型视频时，传输音频文件的方式 */
  audio_type?: AudioType
  /** 音频文件本地路径 */
  audio_file?: string
  /** 音频文件下载url */
  audio_url?: string
}

// 对口型创建任务请求接口
export interface LipSyncCreateTaskRequest {
  /** 输入参数 */
  input: LipSyncInput
  /** 本次任务结果回调通知地址 */
  callback_url?: string
}

// 对口型父视频接口
export interface ParentVideo {
  /** 原视频ID；全局唯一 */
  id: string
  /** 原视频的URL */
  url: string
  /** 原视频总时长，单位s */
  duration: string
}

// 对口型任务信息接口
export interface LipSyncTaskInfo {
  /** 父视频信息 */
  parent_video: ParentVideo
}

// 对口型创建任务响应数据接口
export interface LipSyncCreateTaskResponseData {
  /** 任务ID，系统生成 */
  task_id: string
  /** 任务状态 */
  task_status: TaskStatus
  /** 任务创建时间，Unix时间戳、单位ms */
  created_at: number
  /** 任务更新时间，Unix时间戳、单位ms */
  updated_at: number
}

// 视频特效单图输入接口
export interface VideoEffectsSingleImageInput {
  /** 模型名称 */
  model_name: VideoEffectsSingleImageModel
  /** 参考图像 */
  image: string
  /** 生成视频时长 */
  duration: Duration
}

// 视频特效双人互动输入接口
export interface VideoEffectsInteractionInput {
  /** 模型名称 */
  model_name?: VideoEffectsInteractionModel
  /** 生成视频的模式 */
  mode?: Mode
  /** 参考图像组 */
  images: string[]
  /** 生成视频时长 */
  duration: Duration
}

// 视频特效创建任务请求接口
export interface VideoEffectsCreateTaskRequest {
  /** 场景名称 */
  effect_scene: string
  /** 输入参数 */
  input: VideoEffectsSingleImageInput | VideoEffectsInteractionInput
  /** 本次任务结果回调通知地址 */
  callback_url?: string
  /** 自定义任务ID */
  external_task_id?: string
}

// 视频特效创建任务响应数据接口
export interface VideoEffectsCreateTaskResponseData {
  /** 任务ID，系统生成 */
  task_id: string
  /** 任务信息 */
  task_info: TaskInfo
  /** 任务状态 */
  task_status: TaskStatus
  /** 任务创建时间，Unix时间戳、单位ms */
  created_at: number
  /** 任务更新时间，Unix时间戳、单位ms */
  updated_at: number
}

// 视频特效查询任务响应数据接口（单个）
export interface VideoEffectsGetTaskResponseData {
  /** 任务ID，系统生成 */
  task_id: string
  /** 任务状态 */
  task_status: TaskStatus
  /** 任务状态信息，当任务失败时展示失败原因 */
  task_status_msg?: string
  /** 任务信息 */
  task_info: TaskInfo
  /** 任务结果 */
  task_result: TaskResult
  /** 任务创建时间，Unix时间戳、单位ms */
  created_at: number
  /** 任务更新时间，Unix时间戳、单位ms */
  updated_at: number
}

// 视频特效查询任务列表响应数据接口
export type VideoEffectsGetTasksResponseData = VideoEffectsGetTaskResponseData[]

// 对口型查询任务响应数据接口（单个）
export interface LipSyncGetTaskResponseData {
  /** 任务ID，系统生成 */
  task_id: string
  /** 任务状态 */
  task_status: TaskStatus
  /** 任务状态信息，当任务失败时展示失败原因 */
  task_status_msg?: string
  /** 任务信息 */
  task_info: LipSyncTaskInfo
  /** 任务结果 */
  task_result: TaskResult
  /** 任务创建时间，Unix时间戳、单位ms */
  created_at: number
  /** 任务更新时间，Unix时间戳、单位ms */
  updated_at: number
}

// 对口型查询任务列表响应数据接口
export type LipSyncGetTasksResponseData = LipSyncGetTaskResponseData[]

// 多图生视频查询任务列表响应数据接口
export type MultiImage2VideoGetTasksResponseData = MultiImage2VideoGetTaskResponseData[]

// 多模态视频编辑初始化待编辑视频请求接口
export interface MultiElementsInitSelectionRequest {
  /** 视频ID */
  video_id?: string
  /** 获取视频的URL */
  video_url?: string
}

// 多模态视频编辑初始化待编辑视频响应数据接口
export interface MultiElementsInitSelectionResponseData {
  /** 拒识码，非0为识别失败 */
  status: number
  /** 会话ID */
  session_id: string
  /** 解析后视频的帧数 */
  fps?: number
  /** 解析后视频的时长 */
  original_duration?: number
  /** 解析后视频的宽 */
  width?: number
  /** 解析后视频的高 */
  height?: number
  /** 解析后视频的总帧数 */
  total_frame?: number
  /** 初始化后的视频URL */
  normalized_video?: string
}

// 多模态视频编辑增加视频选区请求接口
export interface MultiElementsAddSelectionRequest {
  /** 会话ID */
  session_id: string
  /** 帧号 */
  frame_index: number
  /** 点选坐标 */
  points: TrajectoryPoint[]
}

// PNG掩码接口
export interface PngMask {
  /** 尺寸 */
  size: [number, number]
  /** Base64编码 */
  base64: string
}

// RLE掩码接口
export interface RleMask {
  /** 尺寸 */
  size: [number, number]
  /** 编码 */
  counts: string
}

// 掩码列表项接口
export interface MaskListItem {
  /** 对象ID */
  object_id: number
  /** RLE掩码 */
  rle_mask: RleMask
  /** PNG掩码 */
  png_mask: PngMask
}

// 多模态视频编辑增加/删减视频选区响应数据接口
export interface MultiElementsSelectionResponseData {
  /** 拒识码，非0为识别失败 */
  status: number
  /** 会话ID */
  session_id: string
  /** 结果 */
  res: {
    /** 帧号 */
    frame_index: number
    /** 掩码列表 */
    rle_mask_list: MaskListItem[]
  }
}

// 多模态视频编辑删减视频选区请求接口
export interface MultiElementsDeleteSelectionRequest {
  /** 会话ID */
  session_id: string
  /** 帧号 */
  frame_index: number
  /** 点选坐标 */
  points: TrajectoryPoint[]
}

// 多模态视频编辑清除视频选区请求接口
export interface MultiElementsClearSelectionRequest {
  /** 会话ID */
  session_id: string
}

// 多模态视频编辑预览已选区视频请求接口
export interface MultiElementsPreviewSelectionRequest {
  /** 会话ID */
  session_id: string
}

// 多模态视频编辑预览已选区视频响应数据接口
export interface MultiElementsPreviewSelectionResponseData {
  /** 拒识码，非0为识别失败 */
  status: number
  /** 会话ID */
  session_id: string
  /** 结果 */
  res: {
    /** 含mask的视频 */
    video: string
    /** 含mask的视频的封面 */
    video_cover: string
    /** 图像分割结果中，每一帧mask结果 */
    tracking_output: string
  }
}

// 多模态视频编辑创建任务请求接口
export interface MultiElementsCreateTaskRequest {
  /** 模型名称 */
  model_name?: MultiElementsModel
  /** 会话ID */
  session_id: string
  /** 操作类型 */
  edit_mode: EditMode
  /** 裁剪后的参考图像 */
  image_list?: ImageListItem[]
  /** 正向文本提示词 */
  prompt: string
  /** 负向文本提示词 */
  negative_prompt?: string
  /** 生成视频的模式 */
  mode?: Mode
  /** 生成视频时长 */
  duration?: Duration
  /** 本次任务结果回调通知地址 */
  callback_url?: string
  /** 自定义任务ID */
  external_task_id?: string
}

// 多模态视频编辑创建任务响应数据接口
export interface MultiElementsCreateTaskResponseData {
  /** 任务ID，系统生成 */
  task_id: string
  /** 任务状态 */
  task_status: TaskStatus
  /** 会话ID */
  session_id: string
  /** 任务创建时间，Unix时间戳、单位ms */
  created_at: number
  /** 任务更新时间，Unix时间戳、单位ms */
  updated_at: number
}

// 多模态视频编辑查询任务响应数据接口（单个）
export interface MultiElementsGetTaskResponseData {
  /** 任务ID，系统生成 */
  task_id: string
  /** 任务状态 */
  task_status: TaskStatus
  /** 任务状态信息，当任务失败时展示失败原因 */
  task_status_msg?: string
  /** 任务信息 */
  task_info: TaskInfo
  /** 任务结果 */
  task_result: TaskResult
  /** 任务创建时间，Unix时间戳、单位ms */
  created_at: number
  /** 任务更新时间，Unix时间戳、单位ms */
  updated_at: number
}

// 多模态视频编辑查询任务列表响应数据接口
export type MultiElementsGetTasksResponseData = MultiElementsGetTaskResponseData[]
