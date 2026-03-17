// 任务状态枚举
export enum TaskStatus {
  Queued = 'queued',
  Running = 'running',
  Cancelled = 'cancelled',
  Succeeded = 'succeeded',
  Failed = 'failed',
}

// 内容类型枚举
export enum ContentType {
  Text = 'text',
  ImageUrl = 'image_url',
}

// 图片角色枚举
export enum ImageRole {
  FirstFrame = 'first_frame',
  LastFrame = 'last_frame',
  ReferenceImage = 'reference_image',
}

// 错误信息接口
export interface TaskError {
  /** 错误码 */
  code: string
  /** 错误提示信息 */
  message: string
}

// 图片URL接口
export interface ImageUrl {
  /** 图片信息，可以是图片URL或图片Base64编码。图片URL需确保可被访问；Base64编码格式：data:image/<图片格式>;base64,<Base64编码> */
  url: string
}

// 文本内容接口
export interface TextContent {
  /** 输入内容的类型，此处应为text */
  type: ContentType.Text
  /** 输入给模型的文本内容，描述期望生成的视频。支持中英文，建议不超过500字。可在文本提示词后追加--[parameters]控制视频输出规格 */
  text: string
}

// 图片内容接口
export interface ImageContent {
  /** 输入内容的类型，此处应为image_url */
  type: ContentType.ImageUrl
  /** 输入给模型的图片对象 */
  image_url: ImageUrl
  /** 图片的位置或用途。首帧图生视频可不填或为first_frame；首尾帧图生视频必填first_frame/last_frame；参考图生视频必填reference_image */
  role?: ImageRole
}

// 内容联合类型
export type Content = TextContent | ImageContent

// 视频内容接口
export interface VideoContent {
  /** 生成视频的URL，格式为mp4。为保障信息安全，生成的视频会在24小时后被清理，请及时转存 */
  video_url: string
  /** 视频的尾帧图像URL。有效期为24小时，请及时转存。说明：创建视频生成任务时设置"return_last_frame": true时，会返回参数 */
  last_frame_url?: string
}

// 使用量统计接口
export interface Usage {
  /** 模型生成的token数量 */
  completion_tokens: number
  /** 视频生成模型不统计输入token，输入token为0，故total_tokens=completion_tokens */
  total_tokens: number
}

// 创建视频生成任务请求接口
export interface CreateVideoGenerationTaskRequest {
  /** 您需要调用的模型的ID（Model ID）或Endpoint ID */
  model: string
  /** 输入给模型，生成视频的信息，支持文本信息和图片信息 */
  content: Content[]
  /** 填写本次生成任务结果的回调通知地址。当视频生成任务有状态变化时，方舟将向此地址推送POST请求 */
  callback_url?: string
  /** 是否返回生成视频的尾帧图像。仅doubao-seedance-1-0-lite-i2v支持该参数。默认值false */
  return_last_frame?: boolean
}

// 创建视频生成任务响应接口
export interface CreateVideoGenerationTaskResponse {
  /** 视频生成任务ID。创建视频生成任务为异步接口，获取ID后，需要通过查询视频生成任务API来查询视频生成任务的状态 */
  id: string
}

// 查询视频生成任务响应接口
export interface GetVideoGenerationTaskResponse {
  /** 视频生成任务ID */
  id: string
  /** 任务使用的模型名称和版本，模型名称-版本 */
  model: string
  /** 任务状态：queued（排队中）、running（任务运行中）、cancelled（取消任务，取消状态24h自动删除）、succeeded（任务成功）、failed（任务失败） */
  status: TaskStatus
  /** 错误提示信息，任务成功返回null，任务失败时返回错误数据 */
  error: TaskError | null
  /** 任务创建时间的Unix时间戳（秒） */
  created_at: number
  /** 任务当前状态更新时间的Unix时间戳（秒） */
  updated_at: number
  /** 当视频生成任务完成，会输出该字段，包含生成视频下载的URL */
  content?: VideoContent
  /** 本次请求使用的种子整数值 */
  seed?: number
  /** 生成视频的分辨率 */
  resolution?: string
  /** 生成视频的宽高比 */
  ratio?: string
  /** 生成视频的时长，单位：秒 */
  duration?: number
  /** 生成视频的帧率 */
  framespersecond?: number
  /** 本次请求的token用量 */
  usage?: Usage
}

// 支持的分辨率
export type Resolution = '480p' | '720p' | '1080p' | string

// 支持的宽高比
export type Ratio
  = | '21:9'
    | '16:9'
    | '4:3'
    | '1:1'
    | '3:4'
    | '9:16'
    | '9:21'
    | 'keep_ratio'
    | 'adaptive'
    | string

// 支持的模型
export type VideoModel
  = | 'doubao-seedance-pro'
    | 'doubao-seedance-1-0-lite-t2v'
    | 'doubao-seedance-1-0-lite-i2v'
    | 'wan2-1-14b-t2v'
    | 'wan2-1-14b-i2v'
    | 'wan2-1-14b-flf2v'
    | string

// ========== 视频点播 (VOD) 相关接口 ==========

// URL 上传项接口
export interface UrlSet {
  /** 源文件 URL，支持 HTTP 和 HTTPS */
  SourceUrl: string
  /** 文件路径（可选）。设置 FileName，当 FileName 相同时，有文件覆盖的风险；需要保证 FileName 不同 */
  FileName?: string
  /** 文件后缀（可选）。以 . 开头，不超过 8 位。当您传入 FileExtension 时，不需要重复传入 FileName 参数 */
  FileExtension?: string
}

// URL 批量拉取上传请求接口
export interface UploadMediaByUrlRequest {
  /** 空间名 */
  SpaceName: string
  /** URL 集合 */
  URLSets: UrlSet[]
}

// URL 批量拉取上传响应接口
export interface UploadMediaByUrlResponse {
  /** 任务 ID 列表，多个任务 ID 用逗号分隔 */
  JobIds?: string
  /** 请求 ID */
  RequestId?: string
}

// 上传功能函数接口
export interface UploadFunction {
  /** 功能名称，如 GetMeta、Snapshot、AddOptionInfo 等 */
  Name: string
  /** 功能输入参数 */
  Input?: Record<string, unknown>
}

// 流式上传请求接口
export interface UploadMaterialRequest {
  /** 空间名 */
  SpaceName: string
  /** 文件可读流 */
  Content: NodeJS.ReadableStream | Buffer
  /** 文件大小（字节） */
  FileSize: number
  /** 文件路径（可选）。您可根据业务需求自定义文件路径。设置 FileName，当 FileName 相同时，有文件覆盖的风险；需要保证 FileName 不同 */
  FileName?: string
  /** 文件后缀（可选）。以 . 开头，不超过 8 位。当您传入 FileExtension 时，不需要重复传入 FileName 参数 */
  FileExtension?: string
  /** 文件类型。media（默认，音视频文件）、image（图片文件）、object（其他类型文件） */
  FileType?: 'media' | 'image' | 'object'
  /** 上传功能函数（可选）。JSON 字符串格式 */
  Functions?: string
  /** 回调参数（可选） */
  CallbackArgs?: string
}

// 流式上传响应接口
export interface UploadMaterialResponse {
  /** 视频 ID */
  Vid?: string
  /** 请求 ID */
  RequestId?: string
}

// 查询上传任务状态请求接口
export interface QueryUploadTaskInfoRequest {
  /** 任务 ID 列表，多个任务 ID 用逗号分隔，最多 20 个 */
  JobIds: string
}

// 上传任务源信息接口
export interface UploadTaskSourceInfo {
  /** 文件 MD5 */
  Md5?: string
  /** 文件类型 */
  FileType?: string
  /** 视频高度 */
  Height?: number
  /** 视频宽度 */
  Width?: number
  /** 视频格式 */
  Format?: string
  /** 视频时长（秒） */
  Duration?: number
  /** 文件大小（字节） */
  Size?: number
  /** 存储 URI */
  StoreUri?: string
  /** 视频码率 */
  Bitrate?: number
  /** TOS 存储类型 */
  TosStorageClass?: string
  /** 文件名 */
  FileName?: string
}

// 上传任务信息接口
export interface UploadTaskInfo {
  /** 请求 ID */
  RequestId?: string
  /** 任务 ID */
  JobId?: string
  /** 源文件 URL */
  SourceUrl?: string
  /** 任务状态（小写）。running（执行中）、success（成功）、failed（失败） */
  State?: string
  /** 视频 ID */
  Vid?: string
  /** 空间名 */
  SpaceName?: string
  /** 账号 ID */
  AccountId?: string
  /** 回调参数 */
  CallbackArgs?: string
  /** 源文件信息 */
  SourceInfo?: UploadTaskSourceInfo
  /** 错误信息（已废弃，使用 State 判断） */
  Error?: {
    Code?: string
    Message?: string
  }
}

// 查询上传任务状态响应数据接口
export interface QueryUploadTaskInfoData {
  /** 任务信息列表 */
  MediaInfoList?: UploadTaskInfo[]
  /** 不存在的任务 ID 列表 */
  NotExistJobIds?: string[]
}

// 查询上传任务状态响应接口
export interface QueryUploadTaskInfoResponse {
  /** 响应数据 */
  Data?: QueryUploadTaskInfoData
  /** 请求 ID（已废弃，在 ResponseMetadata 中） */
  RequestId?: string
}

// ========== Aideo Agent 相关接口 ==========

// 技能类型枚举
export enum SkillType {
  /** AI 视频翻译 */
  AITranslation = 'AITranslation',
  /** AI 字幕擦除 */
  Erase = 'Erase',
  /** AI 高光剪辑 */
  Highlight = 'Highlight',
  /** AI 剪辑 */
  VCreative = 'VCreative',
  /** AI 视频理解 */
  Vision = 'Vision',
}

// 输入文件类型
export interface MultiInput {
  /** 输入文件类型。当前仅支持取值为 Vid，表示 Vid 模式 */
  Type: 'Vid'
  /** 视频 ID (Vid) 或媒资 ID (Mid) */
  Vid: string
}

// ========== 视频上传输入类型 ==========

// URL 输入项
export interface VideoUrlInput {
  /** 输入类型标识 */
  type: 'url'
  /** 视频 URL */
  url: string
  /** 文件路径（可选） */
  fileName?: string
  /** 文件后缀（可选） */
  fileExtension?: string
}

// 文件流输入项
export interface VideoStreamInput {
  /** 输入类型标识 */
  type: 'stream'
  /** 文件流 */
  stream: NodeJS.ReadableStream | Buffer
  /** 文件大小（字节） */
  fileSize: number
  /** 文件路径（可选） */
  fileName?: string
  /** 文件后缀（可选） */
  fileExtension?: string
}

// 视频输入联合类型
export type VideoInput = VideoUrlInput | VideoStreamInput | string

// ========== AITranslation 技能参数 ==========

// 支持的语言类型
export enum LanguageCode {
  /** 中文 */
  Zh = 'zh',
  /** 英文 */
  En = 'en',
  /** 日语 */
  Ja = 'ja',
  /** 韩语 */
  Ko = 'ko',
  /** 德语 */
  De = 'de',
  /** 法语 */
  Fr = 'fr',
  /** 俄语 */
  Ru = 'ru',
  /** 西班牙语 */
  Es = 'es',
  /** 葡萄牙语 */
  Pt = 'pt',
  /** 意大利语 */
  It = 'it',
  /** 印尼语 */
  Id = 'id',
  /** 越南语 */
  Vi = 'vi',
  /** 泰语 */
  Th = 'th',
  /** 阿拉伯语 */
  Ar = 'ar',
  /** 土耳其语 */
  Tr = 'tr',
}

// 翻译类型
export enum TranslationType {
  /** 文本翻译 */
  SubtitleTranslation = 'SubtitleTranslation',
  /** 语音翻译 */
  VoiceTranslation = 'VoiceTranslation',
  /** 面容翻译 */
  FacialTranslation = 'FacialTranslation',
}

// 术语库配置
export interface AITranslationTermbaseConfig {
  /** 要应用的术语库 ID 列表。单次翻译任务最多支持应用 10 个术语库 */
  TranslationTermbaseIds: string[]
}

// 翻译配置
export interface TranslationConfig {
  /** 源语言 */
  SourceLanguage: LanguageCode
  /** 目标语言 */
  TargetLanguage: LanguageCode
  /** 需要执行的翻译类型组合 */
  TranslationTypeList: TranslationType[]
  /** 术语库配置，用于在翻译过程中应用自定义的术语表 */
  TermbaseConfig?: AITranslationTermbaseConfig
}

// 字幕识别类型
export enum SubtitleRecognitionType {
  /** 从视频的画面中识别文字并生成字幕 */
  OCR = 'OCR',
  /** 从视频的音轨中识别文字并生成字幕 */
  ASR = 'ASR',
  /** 使用提供的源语言字幕文件 */
  SourceSubtitleFile = 'SourceSubtitleFile',
  /** 使用提供的源语言和目标语言字幕文件 */
  SourceAndTargetSubtitleFile = 'SourceAndTargetSubtitleFile',
  /** 使用提供的双语字幕文件 */
  BilingualSubtitleFile = 'BilingualSubtitleFile',
  /** 通过 AI 综合理解视频画面和语音来生成字幕 */
  Vision = 'Vision',
  /** （已废弃）行为等同于 SourceSubtitleFile */
  SubtitleFile = 'SubtitleFile',
}

// 字幕识别配置
export interface AITranslationSubtitleRecognitionConfig {
  /** 字幕来源 */
  RecognitionType: SubtitleRecognitionType
  /** 源语言字幕文件的 FileName。当 RecognitionType 为 SourceSubtitleFile 或 SourceAndTargetSubtitleFile 时必填 */
  SourceSubtitleFileName?: string
  /** 目标语言字幕文件的 FileName。当 RecognitionType 为 SourceAndTargetSubtitleFile 时必填 */
  TargetSubtitleFileName?: string
  /** 双语字幕文件的 FileName。当 RecognitionType 为 BilingualSubtitleFile 时必填 */
  BilingualSubtitleFileName?: string
  /** （已废弃）字幕文件的 FileName。当字幕来源 RecognitionType 为 SubtitleFile 时必填 */
  SubtitleFileName?: string
}

// 操作配置
export interface AITranslationOperatorConfig {
  /** 字幕识别配置。字幕来源默认为 OCR */
  SubtitleRecognitionConfig?: AITranslationSubtitleRecognitionConfig
}

// 支持的字体大小
export type SubtitleFontSize = 16 | 18 | 20 | 24 | 28 | 32 | 36 | 40 | 44 | 48

// 暂停阶段
export type SuspensionStage = 'SubtitleRecognition' | 'SubtitleTranslation'

// 执行配置
export interface AITranslationProcessConfig {
  /** 执行过程中需要暂停的阶段列表。设置后，任务将在指定阶段完成后暂停，等待人工干预。目前仅支持暂停单一阶段 */
  SuspensionStageList?: SuspensionStage[]
  /** 是否禁用字幕断句优化（字幕打轴）。false（默认）：系统会自动根据标点符号将过长的字幕分割成更易于阅读的短句；true：禁用此功能 */
  DisableSubtitlePunctSplit?: boolean
  /** 是否禁用智能字幕改写。false（默认）：系统会利用大模型能力，对翻译后的字幕进行智能优化；true：禁用此功能，输出机器翻译的原始结果 */
  DisableSmartSubtitleRewrite?: boolean
}

// AI 翻译技能参数
export interface AITranslationSkillParams {
  /** 翻译配置 */
  TranslationConfig: TranslationConfig
  /** 操作配置 */
  OperatorConfig?: AITranslationOperatorConfig
  /** 字幕配置 */
  SubtitleConfig?: AITranslationSubtitleConfig
  /** 处理配置 */
  ProcessConfig?: AITranslationProcessConfig
}

// ========== Highlight 技能参数 ==========

// 高光剪辑配置
export interface HighlightCuts {
  /** 是否输出分镜信息。true：系统会在高光分析结果中输出算法基于分镜理解得出的视频片段信息；false（默认）：不输出分镜信息 */
  WithStoryboard?: boolean
  /** 输出高光片段的最小时长，单位为秒，默认值为 90。注意：在实际高光分析过程中，为确保剧情的连贯性并保留"钩子"剧情，算法所输出高光视频的时长可能不会与您所设置的 MinDuration 和 MaxDuration 严格相符 */
  MinDuration?: number
  /** 输出高光片段的最大时长，单位为秒。默认值为 300。若您指定最大时长，系统会将混剪结果截断至合适长度，可能不会使用全部输入视频片段 */
  MaxDuration?: number
  /** 输出高光片段的最多片段数，默认值为 6 */
  MaxNumber?: number
}

// 开头钩子配置
export interface OpeningHook {
  /** 是否启用精彩前置功能。true：开启精彩前置功能，系统将自动分析并提取视频中最精彩的片段，将其置于视频开头；false（默认）：关闭精彩前置功能 */
  WithOpeningHook?: boolean
  /** 视频开头精彩片段的最小时长，单位为秒，默认为 5 */
  MinDuration?: number
  /** 视频开头精彩片段的最大时长，单位为秒，默认值为 15 */
  MaxDuration?: number
  /** 设置构成视频开头精彩片段的单个高光片段的最小持续时长。单位为秒，默认值为 5。视频开头的精彩片段可能会由多个高光片段拼接而成。此参数用于避免因拼接过多过短片段而导致的画面频闪问题，以确保最终成片的视觉流畅性。注意：请确保 MinClipDuration 大于 MinDuration，否则可能会导致输出多个独立的前置精彩片段 */
  MinClipDuration?: number
  /** 设置构成视频开头精彩片段的单个高光片段的高光打分下限，默认值为 3。视频开头精彩片段可能会由多个高光片段拼接而成，此参数用于筛选高质量片段以确保开场效果 */
  MinScore?: number
}

// 高光剪辑技能参数
export interface HighlightSkillParams {
  /** 高光剪辑配置 */
  HighlightCuts?: HighlightCuts
  /** 开头钩子配置 */
  OpeningHook?: OpeningHook
}

// ========== Vision 技能参数 ==========

// 视频理解模型配置
export interface OperationTaskVisionModel {
  /** 豆包 VLM (Vision Language Model) 模型的推理接入点 ID。DoubaoVisionEndpoint 和 DoubaoTextEndpoint 二选一必填 */
  DoubaoVisionEndpoint?: string
  /** 语音识别 (ASR) 产品的 APP ID */
  AsrAppId: string
  /** 语音识别 (ASR) 产品中流式语音识别大模型的类型 */
  AsrAppType: 'volc.bigasr.sauc.duration' | 'volc.bigasr.sauc.concurrent'
  /** 豆包 LLM (Large Language Model) 模型的推理接入点 ID。DoubaoVisionEndpoint 和 DoubaoTextEndpoint 二选一必填 */
  DoubaoTextEndpoint?: string
}

// 视频分段理解配置
export interface OperationTaskVisionSegment {
  /** 起始时间，单位为秒。若不设置，则默认从视频开头开始 */
  Start?: number
  /** 结束时间，单位为秒。若不设置，则默认到视频结尾结束。End 要大于 Start */
  End?: number
}

// 截图分辨率
export enum SnapshotResolution {
  /** 240p 分辨率 */
  P240 = '240p',
  /** 360p 分辨率 */
  P360 = '360p',
  /** 480p 分辨率 */
  P480 = '480p',
  /** 720p 分辨率 */
  P720 = '720p',
  /** 1080p 分辨率 */
  P1080 = '1080p',
}

// 截图区域配置
export interface RatioRectangle {
  /** 框选区域左上角相对于视频左上角在X轴上的偏移比例，取值范围为[0,1] */
  TopLeftX?: number
  /** 框选区域左上角相对于视频左上角在 Y 轴上的偏移比例，取值范围为 [0,1] */
  TopLeftY?: number
  /** 框选区域右下角相对于视频左上角在 X 轴上的偏移比例，取值范围为 [0,1] */
  BottomRightX?: number
  /** 框选区域右下角相对于视频左上角在 Y 轴上的偏移比例，取值范围为 [0,1] */
  BottomRightY?: number
}

// 截图策略配置
export interface OperationTaskVisionSnapshotParam {
  /** 视频截图的分辨率 */
  Resolution: SnapshotResolution
  /** 每秒截取的帧数 */
  Fps: number
  /** 截图区域配置 */
  Area?: RatioRectangle
}

// AI 视频理解技能参数
export interface VisionSkillParams {
  /** 大模型提示词。使用 UTF-8 编码。长度不可超过 30000 个字符。根据 Model 参数所配置的视频理解模式，提示词中需包含相应占位符 */
  Prompt: string
  /** 大模型配置。您可通过此参数配置对视频的理解模式 */
  Model: OperationTaskVisionModel
  /** 视频分段理解配置。用于指定视频理解任务的起始和结束时间 */
  Segment?: OperationTaskVisionSegment
  /** 截图策略配置。视频理解处理过程中会对视频进行截图。默认截图策略为均匀时间间隔截图最多 50 张 */
  SnapshotParam?: OperationTaskVisionSnapshotParam
  /** 是否在 ASR（语音识别）结果中包含说话人信息并用于大模型的推理。默认值为 false */
  NeedAsrSpeaker?: boolean
  /** 指定视频理解结果的输出格式。""：默认值；json_object：大模型会参考 Prompt 中指定的 JSON 格式稳定输出准确的 JSON 格式 */
  ResponseFormatType?: '' | 'json_object'
}

// ========== VCreative 技能参数 ==========

// AI 剪辑技能参数
export interface VCreativeSkillParams {
  /** 剪辑提示词 */
  Text: string
}

// ========== Erase 技能参数 ==========

// 擦除框位置信息
export interface OperationTaskEraseLocation {
  /** 擦除框位置信息 */
  RatioLocation?: RatioRectangle
}

// 字幕过滤器配置
export interface OperationTaskEraseSubtitleFilter {
  /** 文字高度最小比例，默认值为 0.01，即视频高度的 1% */
  MinTextHeightRatio?: number
  /** 文字高度最大比例，默认值为 0.1，即视频高度的 10% */
  MaxTextHeightRatio?: number
  /** 文字区域中心偏离视频宽中心的比例。默认值为 0.08，即 8% */
  RectangleCenterOffsetRatio?: number
}

// 自动擦除模式配置
export interface OperationTaskEraseAuto {
  /** 文本擦除类型。Subtitle：擦除 OCR 检测为字幕的文本；Text：(Beta) 擦除除场景文字（如宫殿门牌匾等）以外的字幕及其他文本（如人物介绍等） */
  Type: 'Subtitle' | 'Text'
  /** 擦除框数组。添加擦除框后，系统仅擦除框内文本 */
  Locations?: OperationTaskEraseLocation[]
  /** 用于指定擦除文字的高度和距离视频宽度中心的比例，精确控制擦除范围。仅当 Mode 为 Auto、Type 为 Subtitle 时生效 */
  SubtitleFilter?: OperationTaskEraseSubtitleFilter
}

// 手动擦除模式配置
export interface OperationTaskEraseManual {
  /** 擦除框数组。添加擦除框后，系统仅擦除框内文本 */
  Locations?: OperationTaskEraseLocation[]
}

// 视频片段过滤器
export interface OperationTaskEraseOptionClip {
  /** 片段的起始时间，单位为秒 */
  Start: number
  /** 片段的结束时间，单位为秒 */
  End: number
}

// 擦除选项片段过滤器
export interface OperationTaskEraseOptionClipFilter {
  /** 片段处理模式。Skip：跳过模式，系统将擦除整个视频，但会跳过 Clips 数组中指定的片段区域；Selected：选中模式，系统将仅对 Clips 数组中指定的片段区域进行字幕擦除 */
  Mode: 'Skip' | 'Selected'
  /** 目标时间片段数组 */
  Clips: OperationTaskEraseOptionClip[]
}

// 擦除选项
export interface OperationTaskEraseOption {
  /** 视频片段过滤器。用于定义一个或多个时间片段，并指定对这些片段执行的操作模式（擦除或跳过） */
  ClipFilter?: OperationTaskEraseOptionClipFilter
}

// 字幕擦除技能参数
export interface EraseSkillParams {
  /** 字幕擦除模式。Auto：自动擦除模式，系统将启用 OCR 识别，并依据检测结果进行擦除操作；Manual：(Beta) 手动擦除模式，系统不会启用 OCR 识别，仅擦除白色字幕内容 */
  Mode: 'Auto' | 'Manual'
  /** 自动擦除模式配置 */
  Auto?: OperationTaskEraseAuto
  /** 手动擦除模式配置 */
  Manual?: OperationTaskEraseManual
  /** 是否返回擦除信息详情 */
  WithEraseInfo?: boolean
  /** 是否为擦除后的视频生成一个新的 Vid */
  NewVid?: boolean
  /** 擦除选项。可用于指定仅对视频的特定时间片段进行或跳过字幕擦除，实现更精细的控制 */
  EraseOption?: OperationTaskEraseOption
}

// 技能参数联合类型
export type SkillParams
  = | AITranslationSkillParams
    | HighlightSkillParams
    | VisionSkillParams
    | VCreativeSkillParams
    | EraseSkillParams

// ========== SubmitAITranslationWorkflow 接口 ==========

// AI翻译输入
export interface AITranslationInput {
  /** 视频ID */
  Vid: string
  /** 视频URL */
  VideoUrl?: string
}

// AI翻译配置
export interface AITranslationConfig {
  /** 源语言 */
  SourceLanguage?: string
  /** 目标语言 */
  TargetLanguage?: string
  /** 翻译类型列表 */
  TranslationTypeList?: TranslationType[]
}

// AI翻译字幕配置
export interface AITranslationSubtitleConfig {
  /** 是否为硬字幕 */
  IsHardSubtitle?: boolean
  /** 是否擦除源字幕 */
  IsEraseSource?: boolean
  /** 字体大小 */
  FontSize?: number
  /** 边距设置 */
  MarginL?: number
  MarginR?: number
  MarginV?: number
  /** 显示行数 */
  ShowLines?: number
}

// 项目基本信息
export interface ProjectBaseInfo {
  /** 项目ID */
  ProjectId?: string
  /** 项目版本 */
  ProjectVersion?: string
}

// ========== 提交任务请求/响应 ==========

// 基础请求字段
interface BaseSubmitAideoTaskAsyncRequest {
  /** 点播空间名 */
  SpaceName: string
  /** 输入文件列表 */
  MultiInputs: MultiInput[]
}

// 自然语言驱动请求（使用 Prompt）
interface PromptDrivenRequest extends BaseSubmitAideoTaskAsyncRequest {
  /** 自然语言提示词 */
  Prompt: string
  /** 禁止使用 SkillType */
  SkillType?: never
  /** 禁止使用 SkillParams */
  SkillParams?: never
}

// 指定技能驱动请求（使用 SkillType）
interface SkillDrivenRequest extends BaseSubmitAideoTaskAsyncRequest {
  /** 禁止使用 Prompt */
  Prompt?: never
  /** 指定要调用的 AI 技能类型 */
  SkillType: SkillType
  /** 技能参数（JSON 序列化后的字符串，当使用 SkillType 时可能需要） */
  SkillParams?: string
}

// 提交异步智能视频处理任务请求（联合类型确保 Prompt 和 SkillType 互斥）
export type SubmitAideoTaskAsyncRequest = PromptDrivenRequest | SkillDrivenRequest

// 提交异步智能视频处理任务响应
export interface SubmitAideoTaskAsyncResponse {
  /** 异步智能处理任务的 ID */
  TaskId: string
}

// ========== 查询任务结果请求/响应 ==========

// 获取异步智能视频处理任务结果请求
export interface GetAideoTaskResultRequest {
  /** 点播空间名 */
  SpaceName?: string
  /** 智能视频处理任务的 ID */
  TaskId: string
}

// 任务状态枚举
export enum AideoTaskStatus {
  /** 处理中 */
  Processing = 'Processing',
  /** 处理完成 */
  Completed = 'Completed',
  /** 处理失败 */
  Failed = 'Failed',
}

// ========== AITranslation 结果类型 ==========

// 视频文件信息
export interface VideoFileInfo {
  /** 是否为音频 */
  IsAudio: boolean
  /** 文件存储路径 */
  Uri: string
  /** 文件 Vid */
  Vid?: string
  /** 文件时长，单位为秒 */
  DurationSecond: number
  /** 文件访问 URL */
  Url: string
  /** 文件路径 */
  FileName: string
}

// AI 翻译项目状态
export enum AITranslationProjectStatus {
  /** 处理中 */
  InProcessing = 'InProcessing',
  /** 处理暂停 */
  ProcessSuspended = 'ProcessSuspended',
  /** 处理完成 */
  ProcessSucceed = 'ProcessSucceed',
  /** 处理失败 */
  ProcessFailed = 'ProcessFailed',
  /** 导出中 */
  InExporting = 'InExporting',
  /** 导出完成 */
  ExportSucceed = 'ExportSucceed',
  /** 导出失败 */
  ExportFailed = 'ExportFailed',
}

// AI 翻译项目信息
export interface AITranslationProjectInfo {
  /** 项目状态 */
  Status: AITranslationProjectStatus
  /** 输出视频信息 */
  OutputVideo?: VideoFileInfo
  /** 语音翻译视频信息 */
  VoiceTranslationVideo?: VideoFileInfo
  /** 面容翻译视频信息 */
  FacialTranslationVideo?: VideoFileInfo
}

// AI 翻译结果
export interface AITranslationResult {
  /** 项目信息 */
  ProjectInfo: AITranslationProjectInfo
}

// ========== Erase 结果类型 ==========

// 任务元信息
export interface ExecutionMeta {
  /** 点播空间名称 */
  SpaceName: string
  /** 任务来源。取值如下：API（调用接口触发）、AutoTrigger（上传自动触发）、TranscodeStrategy（转码策略触发）、AideoAgent（Aideo Agent 触发） */
  Trigger: 'API' | 'AutoTrigger' | 'TranscodeStrategy' | 'AideoAgent'
  /** 任务创建时间。遵循 RFC3339 格式的东八区（UTC+8）时间，精度为秒 */
  CreateTime: string
  /** 任务开始时间。遵循 RFC3339 格式的东八区（UTC+8）时间，精度为秒 */
  StartTime: string
  /** 任务结束时间。遵循 RFC3339 格式的东八区（UTC+8）时间，精度为秒 */
  EndTime: string
}

// 擦除任务输入文件信息
export interface EraseInput {
  /** 输入文件类型。当前仅支持取值为 Vid，表示 Vid 模式 */
  Type: 'Vid'
  /** 视频 ID */
  Vid: string
}

// 擦除区域像素矩形
export interface PixelRectangle {
  /** 擦除区域左上角相对于视频左上角在 X 轴上的偏移，单位为像素 */
  TopLeftX: number
  /** 擦除区域左上角相对于视频左上角在 Y 轴上的偏移，单位为像素 */
  TopLeftY: number
  /** 擦除区域右下角相对于视频左上角在 X 轴上的偏移，单位为像素 */
  BottomRightX: number
  /** 擦除区域右下角相对于视频左上角在 Y 轴上的偏移，单位为像素 */
  BottomRightY: number
}

// 擦除区域信息
export interface EraseArea {
  /** 开始时间，单位为秒 */
  Start: number
  /** 结束时间，单位为秒 */
  End: number
  /** 擦除区域位置信息 */
  PixelRectangle: PixelRectangle[]
}

// 擦除详细信息
export interface EraseInfo {
  /** 擦除后视频的宽度，单位为像素 */
  Width: number
  /** 擦除后视频的高度，单位为像素 */
  Height: number
  /** 擦除区域信息 */
  Areas: EraseArea[]
}

// 擦除文件信息
export interface EraseFileInfo {
  /** 文件大小，单位为字节 */
  Size: string
  /** 文件路径 */
  FileName: string
  /** S3 转存后的视频 URL */
  url?: string
}

// 字幕擦除结果
export interface EraseResult {
  /** 输出视频时长，单位为秒 */
  Duration: number
  /** 输出文件信息 */
  File: EraseFileInfo
  /** 擦除详细信息。仅当提交任务时 Erase.WithEraseInfo 设为 true 时会返回该值 */
  Info?: EraseInfo
}

// 擦除输出任务
export interface EraseOutputTask {
  /** 任务类型 */
  Type: 'Erase'
  /** 字幕擦除结果 */
  Erase: EraseResult
}

// 擦除输出
export interface EraseOutput {
  /** 任务类型 */
  Type: 'Task'
  /** 单任务输出结果 */
  Task: EraseOutputTask
}

// 擦除操作任务配置
export interface EraseOperationTask {
  /** 任务类型 */
  Type: 'Erase'
  /** 精细化字幕擦除任务配置 */
  Erase: EraseSkillParams
}

// 擦除操作
export interface EraseOperation {
  /** 处理类型 */
  Type: 'Task'
  /** 单任务配置 */
  Task: EraseOperationTask
}

// 字幕擦除执行结果
export interface EraseExecutionResult {
  /** 任务元信息 */
  Meta: ExecutionMeta
  /** 任务输入文件信息 */
  Input: EraseInput
  /** 执行 ID */
  RunId: string
  /** 任务输出文件信息 */
  Output: EraseOutput
  /** 任务状态 */
  Status: string
  /** 媒体处理操作配置 */
  Operation: EraseOperation
}

// ========== Highlight 结果类型 ==========

// 高光片段信息（Clips 模式）
export interface HighlightClip {
  /** 高光片段开始时间，单位为秒 */
  Start: number
  /** 高光片段结束时间，单位为秒 */
  End: number
  /** 输入视频标识，编号从 0 开始 */
  VideoIndex: number
}

// 自动剪辑产物信息
export interface HighlightEdit {
  /** 文件大小，单位为字节 */
  Size: string
  /** 文件路径 */
  FileName: string
  /** 文件 Vid */
  Vid: string
  /** S3 转存后的视频 URL */
  url?: string
}

// 高光片段详细信息
export interface HighlightClipDetail {
  /** 片段类型 */
  Type: 'HighlightClip' | 'OpeningHook'
  /** 高光打分，取值范围为 [1,5] */
  Score: number
  /** 该片段在原始视频中的起始时间点，单位为秒 */
  Start: number
  /** 该片段在原始视频中的结束时间点，单位为秒 */
  End: number
  /** 输入视频标识，编号从 0 开始 */
  VideoIndex: number
  /** 该片段在最终高光混剪视频中的起始时间点，单位为秒 */
  CutStart: number
  /** 该片段在最终高光混剪视频中的结束时间点，单位为秒 */
  CutEnd: number
}

// 高光片段组
export interface HighlightClipGroup {
  /** 高光片段信息 */
  Clips: HighlightClipDetail[]
}

// 视频分镜信息
export interface StoryboardSegment {
  /** 输入视频标识，编号从 0 开始 */
  VideoIndex: number
  /** 片段开始时间，单位为秒 */
  Start: number
  /** 片段结束时间，单位为秒 */
  End: number
  /** 高光打分，取值范围为 [1,5] */
  Score: number
  /** 字幕 OCR 识别 */
  Ocr?: string
  /** 画面描述 */
  Description: string
}

// 高光剪辑片段信息（StorylineCuts 模式）
export interface HighlightSegment {
  /** 片段开始时间，单位为秒 */
  Start: number
  /** 片段结束时间，单位为秒 */
  End: number
  /** 高光值，取值范围为 [1,5] */
  Score: number
  /** 字幕 OCR 识别 */
  Ocr?: string
  /** 画面描述 */
  Description: string
  /** 地点标签 */
  Location: string
  /** 景别标签 */
  Shot: string
  /** 输入视频标识，编号从 0 开始 */
  VideoIndex: number
}

// 故事线信息
export interface Storyline {
  /** 标题 */
  Title: string
  /** 描述 */
  Description: string
  /** 高光打分，取值范围为 [1,5] */
  Score: number
  /** 片段索引信息，编号从 0 开始 */
  Segments: number[]
}

// 提取的片段信息
export interface CutSegment {
  /** 片段索引信息，编号从 0 开始 */
  Segments: number[]
}

// 混剪信息
export interface StorylineCuts {
  /** 视频片段信息 */
  Segments: HighlightSegment[]
  /** 故事线信息 */
  Storylines: Storyline[]
  /** 算法提取的最精彩片段 */
  CutSegments: CutSegment[]
}

// 高光剪辑结果
export interface HighlightResult {
  /** 输入视频总时长，单位为秒 */
  Duration: number
  /** 高光片段信息（Clips 模式） */
  Clips?: HighlightClip[]
  /** 自动剪辑产物信息 */
  Edits?: HighlightEdit[]
  /** 高光片段信息（StorylineCuts 模式） */
  HighlightCuts?: {
    /** 高光片段信息 */
    Cuts: HighlightClipGroup[]
    /** 视频分镜信息 */
    Storyboard: StoryboardSegment[]
  }
  /** 混剪信息 */
  StorylineCuts?: StorylineCuts
}

// ========== Vision 结果类型 ==========

// 视频理解模型用量
export interface VisionModelUsage {
  /** 豆包 VLM 输入令牌数量 */
  DoubaoInputTokens: number
  /** 豆包 VLM 输出令牌数量 */
  DoubaoOutputTokens: number
  /** 豆包 VLM 总计令牌数量 */
  DoubaoTotalTokens: number
  /** 豆包 LLM 输入令牌数量 */
  DoubaoTextInputTokens: number
  /** 豆包 LLM 输出令牌数量 */
  DoubaoTextOutputTokens: number
  /** 豆包 LLM 总计令牌数量 */
  DoubaoTextTotalTokens: number
}

// AI 视频理解结果
export interface VisionResult {
  /** 视频时长，单位为秒 */
  Duration: number
  /** 截图张数 */
  SnapshotsNumber: number
  /** 视频理解任务大模型用量 */
  Model: VisionModelUsage
  /** 视频理解结果 */
  Content: string
}

// ========== VCreative 结果类型 ==========

// AI 剪辑任务状态
export enum VCreativeStatus {
  /** 排队中 */
  Pending = 'pending',
  /** 执行中 */
  Start = 'start',
  /** 执行成功 */
  Success = 'success',
  /** 执行失败 */
  FailedRun = 'failed_run',
  /** 用户取消 */
  UserCanceled = 'user_canceled',
  /** 服务间调用失败 */
  FailedInvokeLambda = 'failed_invoke_lambda',
}

// VCreative 参数 JSON
export interface VCreativeParamJson {
  /** 输入视频。格式为 vid://<Vid> */
  input: string
  /** 输入视频所在的点播空间名称 */
  space_name: string
  /** 转绘风格。默认为"漫画风" */
  style?: string
  /** 输出视频分辨率 */
  resolution: '480p' | '720p' | '1080p'
}

// VCreative 输出 JSON（成功时）- 支持新旧两种格式
export interface VCreativeOutputJsonSuccess {
  /** 产物视频的唯一 ID（旧版本格式） */
  vid?: string
  /** S3 转存后的视频 URL */
  url?: string
  /** 新版本格式的结果对象 */
  Result?: {
    /** 产物视频的唯一 ID */
    Vid: string
    /** 视频 URI */
    Uri?: string
    /** 视频时长（秒） */
    Duration?: number
    /** S3 转存后的视频 URL */
    url?: string
  }
}

// VCreative 输出 JSON（失败时为错误信息字符串）
export type VCreativeOutputJson = VCreativeOutputJsonSuccess | string

// AI 剪辑结果（成功时）
export interface VCreativeResultSuccess {
  /** AI 剪辑任务的状态 */
  Status: VCreativeStatus.Success
  /** 任务产物的上传空间 */
  Uploader: string
  /** AI 剪辑任务的参数 */
  ParamJson: VCreativeParamJson
  /** 请求 ID */
  RequestId: string
  /** 任务的输出结果 */
  OutputJson: VCreativeOutputJsonSuccess
  /** AI 剪辑任务工作流 ID */
  WorkflowId: string
  /** 自定义回调参数 */
  CallbackArgs?: string
}

// AI 剪辑结果（失败时）
export interface VCreativeResultFailed {
  /** AI 剪辑任务的状态 */
  Status: VCreativeStatus.FailedRun | VCreativeStatus.UserCanceled | VCreativeStatus.FailedInvokeLambda | VCreativeStatus.Pending | VCreativeStatus.Start
  /** 任务产物的上传空间 */
  Uploader: string
  /** AI 剪辑任务的参数 */
  ParamJson: VCreativeParamJson
  /** 请求 ID */
  RequestId: string
  /** 任务的输出结果（错误信息字符串） */
  OutputJson: string
  /** AI 剪辑任务工作流 ID */
  WorkflowId: string
  /** 自定义回调参数 */
  CallbackArgs?: string
}

// AI 剪辑结果（判别联合类型）
export type VCreativeResult = VCreativeResultSuccess | VCreativeResultFailed

// ========== ApiResponse 类型 ==========

// AI 视频翻译 API 响应
export interface AITranslationApiResponse {
  /** 点播任务类型 */
  VodTaskType: SkillType.AITranslation
  /** 点播任务状态 */
  Status: string
  /** AI 视频翻译项目 ID */
  ProjectId: string
  /** AI 视频翻译项目版本 */
  ProjectVersion: string
  /** AI 视频翻译结果 */
  AITranslation: AITranslationResult
  /** 错误信息 */
  Error?: {
    Code: string
    Message: string
  }
}

// AI 字幕擦除 API 响应
export interface EraseApiResponse {
  /** 点播任务类型 */
  VodTaskType: SkillType.Erase
  /** 点播任务状态 */
  Status: string
  /** 视频处理任务 ID */
  RunId: string
  /** AI 字幕擦除任务执行结果 */
  Erase?: EraseExecutionResult
  /** 错误信息 */
  Error?: {
    Code: string
    Message: string
  }
}

// AI 高光剪辑 API 响应
export interface HighlightApiResponse {
  /** 点播任务类型 */
  VodTaskType: SkillType.Highlight
  /** 点播任务状态 */
  Status: string
  /** 视频处理任务 ID */
  RunId: string
  /** AI 高光剪辑任务结果 */
  Highlight?: HighlightResult
  /** 错误信息 */
  Error?: {
    Code: string
    Message: string
  }
}

// AI 视频理解 API 响应
export interface VisionApiResponse {
  /** 点播任务类型 */
  VodTaskType: SkillType.Vision
  /** 点播任务状态 */
  Status: string
  /** 视频处理任务 ID */
  RunId: string
  /** AI 视频理解任务结果 */
  Vision?: VisionResult
  /** 错误信息 */
  Error?: {
    Code: string
    Message: string
  }
}

// AI 剪辑 API 响应
export interface VCreativeApiResponse {
  /** 点播任务类型 */
  VodTaskType: SkillType.VCreative
  /** 点播任务状态 */
  Status: string
  /** AI 剪辑任务 ID */
  VCreativeId: string
  /** AI 剪辑任务结果 */
  VCreative?: VCreativeResult
  /** 错误信息 */
  Error?: {
    Code: string
    Message: string
  }
}

// API 响应项（联合类型）
export type ApiResponse
  = AITranslationApiResponse
    | EraseApiResponse
    | HighlightApiResponse
    | VisionApiResponse
    | VCreativeApiResponse

// ========== AsyncVCreativeTask 接口定义 ==========

// 提交 AI 漫剧转绘任务请求
export interface AsyncVCreativeTaskRequest {
  /** 场景类型，漫剧转绘固定为 videostyletrans */
  Scene: 'videostyletrans'
  /** 任务产物要上传到的点播空间名称 */
  Uploader: string
  /** 任务参数对象（根据官方文档，应该是对象而不是字符串） */
  ParamObj: AsyncVCreativeTaskParamObj | string
}

// AsyncVCreativeTask 参数对象（ParamObj 的内容）
export interface AsyncVCreativeTaskParamObj {
  /** 输入视频，格式为 vid://<Vid> */
  input: string
  /** 输入视频所在的点播空间名称 */
  space_name: string
  /** 转绘风格，例如："漫画风"、"3D卡通风格"、"日漫风格" */
  style?: string
  /** 输出视频分辨率：480p、720p、1080p */
  resolution: '480p' | '720p' | '1080p'
}

// 提交 AI 漫剧转绘任务响应
export interface AsyncVCreativeTaskResponse {
  /** AI 漫剧转绘任务的唯一标识 */
  VCreativeId: string
}

// 获取 AI 漫剧转绘任务结果请求
export interface GetVCreativeTaskResultRequest {
  /** AI 漫剧转绘任务的 ID */
  VCreativeId: string
}

// AI 漫剧转绘任务状态
export enum VCreativeTaskStatus {
  /** 处理中 */
  Processing = 'processing',
  /** 成功 */
  Success = 'success',
  /** 失败 */
  FailedRun = 'failed_run',
}

// 获取 AI 漫剧转绘任务结果响应（成功时）
export interface GetVCreativeTaskResultSuccessResponse {
  /** 任务状态 */
  Status: VCreativeTaskStatus.Success
  /** 输出结果 JSON 字符串 */
  OutputJson: string // 解析后为 { vid: string }
  /** 场景类型 */
  Scene: string
  /** 其他字段... */
  [key: string]: any
}

// 获取 AI 漫剧转绘任务结果响应（失败时）
export interface GetVCreativeTaskResultFailedResponse {
  /** 任务状态 */
  Status: VCreativeTaskStatus.FailedRun
  /** 错误信息 JSON 字符串 */
  OutputJson: string
  /** 场景类型 */
  Scene: string
  /** 其他字段... */
  [key: string]: any
}

// 获取 AI 漫剧转绘任务结果响应（处理中）
export interface GetVCreativeTaskResultProcessingResponse {
  /** 任务状态 */
  Status: VCreativeTaskStatus.Processing
  /** 场景类型 */
  Scene: string
  /** 其他字段... */
  [key: string]: any
}

// 获取 AI 漫剧转绘任务结果响应（联合类型）
export type GetVCreativeTaskResultResponse
  = | GetVCreativeTaskResultSuccessResponse
    | GetVCreativeTaskResultFailedResponse
    | GetVCreativeTaskResultProcessingResponse

// ========== DirectEdit (视频剪辑) 接口定义 ==========

// 视频源类型
export enum VideoSourceType {
  /** 使用 VID (视频点播 ID) */
  VID = 'VID',
  /** 使用 URL (视频 URL) */
  URL = 'URL',
}

// 剪辑操作类型
export enum DirectEditOperationType {
  /** 裁剪 */
  Crop = 'Crop',
  /** 添加文字 */
  Text = 'Text',
  /** 添加贴纸 */
  Sticker = 'Sticker',
  /** 添加音效 */
  Audio = 'Audio',
  /** 添加滤镜 */
  Filter = 'Filter',
  /** 视频拼接 */
  Concat = 'Concat',
  /** 视频旋转 */
  Rotate = 'Rotate',
  /** 视频变速 */
  Speed = 'Speed',
  /** 视频动画 */
  Animation = 'Animation',
  /** 转场特效 */
  Transition = 'Transition',
  /** 特效 */
  Effect = 'Effect',
  /** 花字 */
  FancyText = 'FancyText',
  /** 文字动画 */
  TextAnimation = 'TextAnimation',
  /** 字幕 */
  Subtitle = 'Subtitle',
}

// 裁剪参数
export interface CropParams {
  /** 起始时间，单位为秒 */
  StartTime: number
  /** 结束时间，单位为秒 */
  EndTime: number
}

// 文字参数
export interface TextParams {
  /** 文字内容 */
  Content: string
  /** X 坐标 */
  X: number
  /** Y 坐标 */
  Y: number
  /** 字体大小 */
  FontSize?: number
  /** 字体颜色 (hex 格式, 如 #FFFFFF) */
  FontColor?: string
  /** 开始时间，单位为秒 */
  StartTime: number
  /** 结束时间，单位为秒 */
  EndTime: number
}

// 贴纸参数
export interface StickerParams {
  /** 贴纸 URL 或素材 ID */
  StickerUrl: string
  /** X 坐标 */
  X: number
  /** Y 坐标 */
  Y: number
  /** 宽度 */
  Width?: number
  /** 高度 */
  Height?: number
  /** 开始时间，单位为秒 */
  StartTime: number
  /** 结束时间，单位为秒 */
  EndTime: number
}

// 音频参数
export interface AudioParams {
  /** 音频 URL 或 VID */
  AudioUrl: string
  /** 音量，0-100 */
  Volume?: number
  /** 开始时间，单位为秒 */
  StartTime: number
  /** 结束时间，单位为秒 */
  EndTime: number
}

// 滤镜参数
export interface FilterParams {
  /** 滤镜类型 */
  FilterType: string
  /** 滤镜强度，0-100 */
  Intensity?: number
  /** 开始时间，单位为秒 */
  StartTime: number
  /** 结束时间，单位为秒 */
  EndTime: number
}

// 视频拼接参数
export interface ConcatParams {
  /** 要拼接的视频列表 */
  Videos: Array<{
    /** 视频源类型 */
    Type: VideoSourceType
    /** 视频 VID 或 URL */
    Source: string
  }>
}

// 视频旋转参数
export interface RotateParams {
  /** 旋转角度（0-360度） */
  Angle: number
}

// 视频变速参数
export interface SpeedParams {
  /** 播放速率（0.5 = 0.5倍速，2 = 2倍速） */
  Speed: number
  /** 开始时间，单位为秒 */
  StartTime: number
  /** 结束时间，单位为秒 */
  EndTime: number
}

// 视频动画参数
export interface AnimationParams {
  /** 动画ID */
  AnimationId: string
  /** 动画类型：入场(in) / 出场(out) */
  AnimationType: 'in' | 'out'
  /** 动画持续时间，单位为秒 */
  Duration?: number
}

// 转场特效参数
export interface TransitionParams {
  /** 转场ID */
  TransitionId: string
  /** 转场持续时间，单位为秒 */
  Duration: number
  /** 转场开始时间，单位为秒 */
  StartTime: number
}

// 特效参数
export interface EffectParams {
  /** 特效ID */
  EffectId: string
  /** 开始时间，单位为秒 */
  StartTime: number
  /** 结束时间，单位为秒 */
  EndTime: number
  /** 特效强度，0-100 */
  Intensity?: number
}

// 花字参数
export interface FancyTextParams {
  /** 文字内容 */
  Content: string
  /** 花字ID */
  FancyTextId: string
  /** X 坐标 */
  X: number
  /** Y 坐标 */
  Y: number
  /** 字体大小 */
  FontSize?: number
  /** 开始时间，单位为秒 */
  StartTime: number
  /** 结束时间，单位为秒 */
  EndTime: number
}

// 文字动画参数
export interface TextAnimationParams {
  /** 文字内容 */
  Content: string
  /** 文字动画ID */
  AnimationId: string
  /** 动画类型：入场(in) / 出场(out) / 循环(loop) */
  AnimationType: 'in' | 'out' | 'loop'
  /** X 坐标 */
  X: number
  /** Y 坐标 */
  Y: number
  /** 字体大小 */
  FontSize?: number
  /** 字体颜色 (hex 格式, 如 #FFFFFF) */
  FontColor?: string
  /** 开始时间，单位为秒 */
  StartTime: number
  /** 结束时间，单位为秒 */
  EndTime: number
}

// 字幕参数
export interface SubtitleParams {
  /** 字幕文件 URL（支持 SRT/WebVTT/ASS 格式） */
  SubtitleUrl: string
  /** 字体ID */
  FontId?: string
  /** 字体大小 */
  FontSize?: number
  /** 字体颜色 (hex 格式, 如 #FFFFFF) */
  FontColor?: string
  /** 字幕位置：top / center / bottom */
  Position?: 'top' | 'center' | 'bottom'
}

// 剪辑操作
export interface DirectEditOperation {
  /** 操作类型 */
  Type: DirectEditOperationType
  /** 裁剪参数 */
  Crop?: CropParams
  /** 文字参数 */
  Text?: TextParams
  /** 贴纸参数 */
  Sticker?: StickerParams
  /** 音频参数 */
  Audio?: AudioParams
  /** 滤镜参数 */
  Filter?: FilterParams
  /** 拼接参数 */
  Concat?: ConcatParams
  /** 旋转参数 */
  Rotate?: RotateParams
  /** 变速参数 */
  Speed?: SpeedParams
  /** 动画参数 */
  Animation?: AnimationParams
  /** 转场参数 */
  Transition?: TransitionParams
  /** 特效参数 */
  Effect?: EffectParams
  /** 花字参数 */
  FancyText?: FancyTextParams
  /** 文字动画参数 */
  TextAnimation?: TextAnimationParams
  /** 字幕参数 */
  Subtitle?: SubtitleParams
}

// ========== 正确的火山引擎视频剪辑参数结构（基于 Track 轨道） ==========

// 画布参数
export interface CanvasParam {
  /** 画布宽度（像素） */
  Width: number
  /** 画布高度（像素） */
  Height: number
}

// 编解码参数
export interface CodecParam {
  /** 视频编码格式，如 h264、h265 */
  VideoCodec?: string
  /** 音频编码格式，如 aac */
  AudioCodec?: string
  /** 视频码率（kbps） */
  VideoBitrate?: number
  /** 音频码率（kbps） */
  AudioBitrate?: number
  /** CRF 值（0-51），数值越小质量越高 */
  Crf?: number
  /** 编码速度预设：ultrafast、superfast、veryfast、faster、fast、medium、slow、slower、veryslow */
  Preset?: string
}

// 输出参数
export interface OutputParam {
  /** 是否禁用视频 */
  DisableVideo?: boolean
  /** 是否禁用音频 */
  DisableAudio?: boolean
  /** 输出帧率 */
  Fps?: number
  /** 是否包含 Alpha 通道 */
  Alpha?: boolean
  /** 编解码参数 */
  Codec?: CodecParam
}

// 轨道元素（视频、音频、文字、贴纸等）
// Filter 类型定义
export interface BaseFilter {
  /** Filter 类型 */
  Type: string
}

// TransformFilter - 2D 变换（位置、大小、旋转等）
export interface TransformFilter extends BaseFilter {
  Type: 'transform'
  /** X 轴位移（像素） */
  PosX: number
  /** Y 轴位移（像素） */
  PosY: number
  /** 宽度（像素） */
  Width: number
  /** 高度（像素） */
  Height: number
  /** 旋转角度 [-360, 360]，顺时针为正 */
  Rotation?: number
  /** 水平镜像翻转 */
  FlipX?: boolean
  /** 垂直镜像翻转 */
  FlipY?: boolean
  /** 透明度 [0,1]，0为透明 */
  Alpha?: number
}

// LutFilter - 调色滤镜
export interface LutFilter extends BaseFilter {
  Type: 'lut_filter'
  /** Filter 在 Element 中的时间范围 [startMs, endMs] */
  TargetTime: [number, number]
  /** 滤镜 ID */
  Source: string
  /** 滤镜强度 [0,1] */
  Intensity?: number
}

// EffectFilter - 视觉特效
export interface EffectFilter extends BaseFilter {
  Type: 'effect_filter'
  /** Filter 在 Element 中的时间范围 [startMs, endMs] */
  TargetTime: [number, number]
  /** 特效 ID */
  Source: string
}

// TransitionFilter - 转场
export interface TransitionFilter extends BaseFilter {
  Type: 'transition'
  /** 转场 ID */
  Source: string
  /** 转场时长（毫秒） */
  Duration: number
}

// SpeedFilter - 倍速
export interface SpeedFilter extends BaseFilter {
  Type: 'speed'
  /** 播放速度 [0.1, 4] */
  Speed: number
}

// TrimFilter - 时间截取
export interface TrimFilter extends BaseFilter {
  Type: 'trim'
  /** 截取开始时间（毫秒） */
  StartTime: number
  /** 截取结束时间（毫秒） */
  EndTime: number
}

// VideoAnimationsFilter - 视频动画
export interface VideoAnimationsFilter extends BaseFilter {
  Type: 'video_animation'
  /** 视频动画 ID */
  AnimRes: string
  /** 动画开始时间（毫秒） */
  AnimStartTime: number
  /** 动画结束时间（毫秒） */
  AnimEndTime: number
  /** 是否循环 */
  AnimLoop?: boolean
  /** 循环动画时长（毫秒） */
  AnimLoopDuration?: number
}

// TextAnimationsFilter - 文字动画
export interface TextAnimationsFilter extends BaseFilter {
  Type: 'text_animation'
  /** 入场动画 ID */
  AnimInRes?: string
  /** 入场动画时长（毫秒） */
  AnimInDuration?: number
  /** 出场动画 ID */
  AnimOutRes?: string
  /** 出场动画时长（毫秒） */
  AnimOutDuration?: number
  /** 循环动画 ID */
  AnimLoopRes?: string
  /** 循环动画时长（毫秒） */
  AnimLoopDuration?: number
}

// AudioVolumeFilter - 音量调节
export interface AudioVolumeFilter extends BaseFilter {
  Type: 'a_volume'
  /** 音量，0 为静音，1 为默认 */
  Volume: number
}

// Filter 联合类型
export type Filter
  = | TransformFilter
    | LutFilter
    | EffectFilter
    | TransitionFilter
    | SpeedFilter
    | TrimFilter
    | VideoAnimationsFilter
    | TextAnimationsFilter
    | AudioVolumeFilter

export interface TrackElement {
  /** 元素类型：video、audio、text、image、subtitle 等 */
  Type: string
  /** 视频/音频源：vid://xxx 或 URL */
  Source?: string
  /** 目标时间范围 [startMs, endMs]，单位毫秒 */
  TargetTime?: [number, number]
  /** 源时间范围 [startMs, endMs]，单位毫秒 */
  SourceTime?: [number, number]
  /** X 坐标（像素） */
  X?: number
  /** Y 坐标（像素） */
  Y?: number
  /** 宽度（像素） */
  Width?: number
  /** 高度（像素） */
  Height?: number
  /** 文字内容 */
  Text?: string
  /** 字体大小 */
  FontSize?: number
  /** 字体颜色（hex 格式） */
  FontColor?: string
  /** 音量（0-100） */
  Volume?: number
  /** 花字ID */
  FancyTextID?: string
  /** 字体ID */
  FontID?: string
  /** 字幕位置 */
  Position?: string

  /** 拓展资源 - 用于添加各种 Filter 效果 */
  Extra?: Filter[]

  /** 其他参数 */
  [key: string]: unknown
}

// 上传参数
export interface UploadParam {
  /** 上传到的点播空间名 */
  SpaceName: string
  /** 视频文件名 */
  VideoName?: string
  /** 文件路径和名称 */
  FileName?: string
}

// 火山引擎标准剪辑参数（基于 Track 轨道）
export interface DirectEditParam {
  /** 画布参数 */
  Canvas?: CanvasParam
  /** 输出参数 */
  Output?: OutputParam
  /** 轨道列表，每个轨道是一个元素数组 */
  Track?: TrackElement[][]
  /** 上传参数 */
  Upload?: UploadParam
  /** 上传空间（废弃，使用 Upload.SpaceName） */
  Uploader?: string
}

// ========== 简化的操作接口（用于 MCP，内部转换为 Track 结构） ==========

// 保留原有的简化操作接口，用于 MCP 层
export interface SimpleDirectEditParam {
  /** 视频源类型 */
  VideoSourceType: VideoSourceType
  /** 视频源 (VID 或 URL) */
  VideoSource: string
  /** 输出宽度 */
  Width?: number
  /** 输出高度 */
  Height?: number
  /** 输出码率 (kbps) */
  Bitrate?: number
  /** 输出帧率 */
  FrameRate?: number
  /** 剪辑操作列表 */
  Operations: DirectEditOperation[]
}

// 剪辑任务应用类型
export enum DirectEditApplicationType {
  /** 普通视频剪辑场景 */
  VideoTrackToB = 'VideoTrackToB',
  /** 短剧高光剪辑场景 */
  VideoTrackHighlight = 'VideoTrackHighlight',
}

// 提交异步剪辑任务请求
export interface SubmitDirectEditTaskAsyncRequest {
  /** 点播空间名 */
  SpaceName?: string
  /** 任务产物要上传到的点播空间名称 */
  Uploader?: string
  /** 剪辑任务类型：VideoTrackToB（普通视频剪辑）或 VideoTrackHighlight（短剧高光剪辑） */
  Application: DirectEditApplicationType | string
  /** 剪辑参数 */
  EditParam: DirectEditParam
  /** 优先级，范围 0-9，数字越大优先级越高 */
  Priority?: number
  /** 回调地址 */
  CallbackUrl?: string
  /** 自定义字段，将在视频剪辑完成事件中透传返回，长度限制为 64 KB */
  CallbackArgs?: string
}

// 提交异步剪辑任务响应
export interface SubmitDirectEditTaskAsyncResponse {
  /** 剪辑任务 ID（API 返回字段名为 ReqId） */
  ReqId: string
}

// 剪辑任务状态
export enum DirectEditTaskStatus {
  /** 处理中 */
  Processing = 'Processing',
  /** 处理完成 */
  Completed = 'Completed',
  /** 处理失败 */
  Failed = 'Failed',
}

// 获取剪辑任务结果请求
export interface GetDirectEditResultRequest {
  /** 任务 ID 列表（提交任务时返回的 ReqId），数组类型，数量不可超过 30 个 */
  ReqIds: string[]
}

// 获取剪辑任务结果响应（单个任务信息）
export interface GetDirectEditResultItem {
  /** 任务 ID */
  TaskId: string
  /** 请求 ID */
  ReqId: string
  /** 剪辑任务类型 */
  Application: string
  /** 任务状态：pending, start, processing, success, failed, failed_run, user_canceled */
  Status: string
  /** 任务信息/错误信息 */
  Message?: string
  /** 任务 ID 列表 */
  TaskList?: string
  /** 输出视频 VID */
  OutputVid?: string
  /** 输出视频 URL */
  OutputUrl?: string
  /** 任务创建时间 */
  CreateAt?: string
  /** 任务完成时间 */
  FinishAt?: string
  /** 输出产物上传的空间名 */
  Uploader?: string
  /** 优先级 */
  Priority?: number
  /** 回调地址 */
  CallbackUri?: string
  /** 自定义字段 */
  CallbackArgs?: string
  /** 剪辑参数 */
  EditParam?: DirectEditParam
}

// 获取剪辑任务结果响应（API 返回数组）
export interface GetDirectEditResultResponse extends Array<GetDirectEditResultItem> {}

// ========== GetAideoTaskResultResponse 类型 ==========

// 获取异步智能视频处理任务结果响应
export interface GetAideoTaskResultResponse {
  /** 智能视频处理任务的 ID */
  TaskId: string
  /** Aideo Agent 任务状态 */
  Status: AideoTaskStatus
  /** 提交任务时使用的 AI 技能类型 */
  SkillType?: SkillType
  /** 提交任务时传入的输入文件信息 */
  MultiInputs: MultiInput[]
  /** 提交任务时传入的 SkillParams 字符串 */
  SkillParams: string
  /** 智能视频处理任务执行结果 */
  ApiResponses: ApiResponse[]
}

// ========== 批量上传结果类型 ==========

// 单个上传成功结果
export interface UploadSuccess {
  success: true
  vid: string
  url: string
  index: number
}

// 单个上传失败结果
export interface UploadFailure {
  success: false
  url: string
  index: number
  error: string
}

// 上传结果联合类型
export type UploadResult = UploadSuccess | UploadFailure

// ========== 短剧解说相关接口 ==========

// 短剧解说配置
export interface DramaRecapConfig {

  /** 是否由 AI 自动生成解说词。true：系统将根据视频内容自动创作解说文案，此时不能设置 RecapText；false（默认）：使用您提供的文案，此时 RecapText 为必填 */
  AutoGenerateRecapText?: boolean
  /** AI 生成解说词的风格指令 */
  RecapStyle?: string
  /** 期望的解说词语速，范围 [0.5, 2.0] */
  RecapTextSpeed?: number
  /** 期望 AI 生成的解说词长度，最大 5000 */
  RecapTextLength?: number
  /** AI 配音时句间停顿的时长，单位毫秒，范围 [1, 1000] */
  PauseTime?: number
  /** 是否允许解说词匹配重复的视频画面 */
  AllowRepeatMatch?: boolean
}

// 创建短剧解说任务请求
export interface CreateDramaRecapTaskRequest {
  /** 空间名 */
  SpaceName: string
  /** 视频 VID 列表 */
  Vids: string[]
  /** 剧本还原任务 ID（可选，如果没有则自动执行剧本还原） */
  DramaScriptTaskId?: string
  /** 自定义解说词（可选） */
  RecapText?: string
  /** 短剧解说配置 */
  DramaRecapConfig: DramaRecapConfig
  /** 说话人配置 */
  SpeakerConfig?: {
    /** 应用 ID */
    AppId: string
    /** 集群 */
    Cluster: string
    /** 音色类型 */
    VoiceType: string
  }
  /** 是否擦除字幕，默认 true */
  IsEraseSubtitle?: boolean
  /** 字体配置 */
  FontConfig?: {
    /** 字体颜色，格式为 #RRGGBB */
    Color?: string
    /** 字体大小 */
    Size?: number
    /** 字体名称 */
    Name?: string
  }
}

// 创建短剧解说任务响应
export interface CreateDramaRecapTaskResponse {
  /** 解说视频生成任务 ID */
  TaskId: string
  /** 剧本还原任务 ID */
  DramaScriptTaskId: string
}

// 查询短剧解说任务结果请求
export interface QueryDramaRecapTaskRequest {
  /** 任务 ID */
  TaskId: string
  /** 空间名 */
  SpaceName: string
}

// 短剧解说任务状态枚举
export enum DramaRecapTaskStatus {
  /** 处理中 */
  Processing = 'running',
  /** 处理完成 */
  Completed = 'success',
  /** 处理失败 */
  Failed = 'failed',
}

// 查询短剧解说任务结果响应
export interface QueryDramaRecapTaskResponse {
  /** 任务 ID */
  TaskId: string
  /** 任务状态 */
  Status: DramaRecapTaskStatus
  /** 输出视频 VID */
  Vid?: string
  /** 输出视频 URL */
  OutputUrl?: string
  /** 任务创建时间 */
  CreateAt?: string
  /** 任务完成时间 */
  FinishAt?: string
  /** 错误信息 */
  ErrorMessage?: string
}
