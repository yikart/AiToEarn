import { AccountType, createZodDto } from '@yikart/common'
import { z } from 'zod'
import { ChannelPaginationMetadataVoSchema } from './platform-pagination.vo'
import {
  AuthType,
  ChannelEngagementFunctionName,
  ChannelEngagementTargetType,
  CompletionStrategy,
  EditorType,
  PlatformStatus,
  PublishContentMode,
  PublishOptionValueType,
} from './platforms.interface'

export const LocaleTextSchema = z.object({
  'en-US': z.string().describe('英文文案'),
  'zh-CN': z.string().describe('中文文案'),
})

const PlatformContentLimitsVoSchema = z.object({
  modes: z.array(z.enum(PublishContentMode)).describe('支持的发布内容模式'),
  maxTitleLength: z.number().optional().describe('标题最大长度'),
  maxBodyLength: z.number().optional().describe('正文最大长度'),
  maxTotalTextLength: z.number().optional().describe('最终发布文本最大长度'),
  maxMediaCount: z.number().optional().describe('媒体最大数量'),
  maxImages: z.number().optional().describe('图片最大数量'),
  maxVideos: z.number().optional().describe('视频最大数量'),
})

const PlatformMediaRulesVoSchema = z.object({
  imageFormats: z.array(z.string()).optional().describe('图片格式'),
  videoFormats: z.array(z.string()).optional().describe('视频格式'),
  maxImageSize: z.number().optional().describe('图片最大字节数'),
  maxVideoSize: z.number().optional().describe('视频最大字节数'),
  minVideoDuration: z.number().optional().describe('视频最小秒数'),
  maxVideoDuration: z.number().optional().describe('视频最大秒数'),
  minImageWidth: z.number().optional().describe('图片最小宽度'),
  minImageHeight: z.number().optional().describe('图片最小高度'),
  maxImageWidth: z.number().optional().describe('图片最大宽度'),
  maxImageHeight: z.number().optional().describe('图片最大高度'),
  aspectRatio: z.object({
    min: z.number().optional().describe('最小宽高比'),
    max: z.number().optional().describe('最大宽高比'),
  }).optional().describe('宽高比限制'),
})

const TopicCapabilityVoSchema = z.object({
  supported: z.boolean().describe('是否支持话题'),
  nativeField: z.boolean().optional().describe('是否使用平台原生话题字段'),
  maxCount: z.number().optional().describe('话题最大数量'),
  maxTotalLength: z.number().optional().describe('话题序列化后的最大总长度'),
})

const JsonSchemaVoSchema = z.record(z.string(), z.unknown()).describe('发布选项 JSON Schema')

const PlatformAuthCapabilitiesVoSchema = z.object({
  supported: z.boolean().describe('是否支持授权'),
  revoke: z.boolean().describe('是否支持取消授权'),
  selectableAccounts: z.boolean().describe('是否支持授权后选择子账号'),
  refreshAccountAccess: z.boolean().describe('是否支持刷新子账号访问凭证'),
})

const PlatformEmptyAccountHintVoSchema = z.object({
  title: LocaleTextSchema.describe('空账号提示标题'),
  description: LocaleTextSchema.describe('空账号提示描述'),
  action: z.object({
    label: LocaleTextSchema.describe('操作按钮文案'),
    url: z.url().describe('操作链接'),
  }).optional().describe('操作按钮'),
})

const PlatformPublishCapabilitiesVoSchema = z.object({
  supported: z.boolean().describe('是否支持服务端发布'),
  cancel: z.boolean().describe('是否支持取消平台侧发布'),
  update: z.boolean().describe('是否支持更新已发布内容'),
  verify: z.boolean().describe('是否支持发布结果验证'),
  finalize: z.boolean().describe('是否支持发布后轮询或收尾'),
  scheduleByPlatform: z.boolean().describe('是否支持平台原生定时发布'),
  optionSources: z.boolean().describe('是否支持动态发布选项'),
  completionStrategy: z.enum(CompletionStrategy).optional().describe('发布完成策略'),
})

const PlatformAnalyticsCapabilitiesVoSchema = z.object({
  account: z.boolean().describe('是否支持账号数据分析'),
  work: z.boolean().describe('是否支持作品数据分析'),
})

const ChannelEngagementOperationParametersVoSchema = z.object({
  querySchema: JsonSchemaVoSchema.describe('Query 参数 JSON Schema'),
  bodySchema: JsonSchemaVoSchema.optional().describe('Body 参数 JSON Schema'),
  dataSchema: JsonSchemaVoSchema.optional().describe('函数 data 参数 JSON Schema'),
})

const PlatformEngagementCapabilitiesVoSchema = z.object({
  comments: z.object({
    list: z.object({
      supported: z.boolean().describe('是否支持评论列表'),
      pagination: ChannelPaginationMetadataVoSchema.describe('评论列表分页能力'),
      parameters: ChannelEngagementOperationParametersVoSchema.describe('评论列表参数'),
    }).describe('评论列表能力'),
    create: z.object({
      supported: z.boolean().describe('是否支持创建评论'),
      parameters: ChannelEngagementOperationParametersVoSchema.describe('创建评论参数'),
    }).describe('创建评论能力'),
  }).describe('评论能力'),
  functions: z.array(z.object({
    name: z.enum(ChannelEngagementFunctionName).describe('互动函数名称'),
    label: LocaleTextSchema.describe('函数展示文案'),
    target: z.enum(ChannelEngagementTargetType).describe('互动目标类型'),
    parameters: z.object({
      querySchema: JsonSchemaVoSchema.describe('Query 参数 JSON Schema'),
      bodySchema: JsonSchemaVoSchema.describe('Body 参数 JSON Schema'),
      dataSchema: JsonSchemaVoSchema.describe('函数 data 参数 JSON Schema'),
    }).describe('函数参数'),
  })).describe('平台支持的互动函数'),
})

const PlatformWorkCapabilitiesVoSchema = z.object({
  listWorks: z.boolean().describe('是否支持账号作品列表'),
  listWorksPagination: ChannelPaginationMetadataVoSchema.describe('账号作品列表分页能力'),
  getLinkInfo: z.boolean().describe('是否支持解析作品链接'),
  getDetail: z.boolean().describe('是否支持作品详情'),
  verifyOwnership: z.boolean().describe('是否支持作品归属校验'),
})

const PlatformBrowseCapabilitiesVoSchema = z.object({
  search: z.boolean().describe('是否支持搜索浏览'),
  getDetail: z.boolean().describe('是否支持浏览详情'),
})

const PlatformWebhookCapabilitiesVoSchema = z.object({
  supported: z.boolean().describe('是否支持 webhook'),
})

const PlatformCapabilitiesVoSchema = z.object({
  auth: PlatformAuthCapabilitiesVoSchema.describe('授权能力'),
  publish: PlatformPublishCapabilitiesVoSchema.describe('发布能力'),
  analytics: PlatformAnalyticsCapabilitiesVoSchema.describe('数据分析能力'),
  engagement: PlatformEngagementCapabilitiesVoSchema.describe('互动能力'),
  work: PlatformWorkCapabilitiesVoSchema.describe('作品能力'),
  browse: PlatformBrowseCapabilitiesVoSchema.describe('浏览能力'),
  webhook: PlatformWebhookCapabilitiesVoSchema.describe('Webhook 能力'),
})

export const PlatformMetadataVoSchema = z.object({
  platform: z.enum(AccountType).describe('平台'),
  displayName: LocaleTextSchema.describe('展示名'),
  logoUrl: z.url().describe('平台 logo URL'),
  authType: z.enum(AuthType).describe('授权类型'),
  authInstructions: LocaleTextSchema.optional().describe('授权操作提示语'),
  emptyAccountHint: PlatformEmptyAccountHintVoSchema.optional().describe('空账号引导提示'),
  editor: z.enum(EditorType).describe('编辑器类型'),
  contentLimits: PlatformContentLimitsVoSchema.describe('内容限制'),
  mediaRules: PlatformMediaRulesVoSchema.describe('媒体规则'),
  topic: TopicCapabilityVoSchema.describe('话题能力'),
  capabilities: PlatformCapabilitiesVoSchema.describe('平台操作能力'),
  optionSchema: JsonSchemaVoSchema.describe('发布选项 JSON Schema'),
  defaultOption: z.record(z.string(), z.unknown()).optional().describe('默认发布选项'),
  status: z.enum(PlatformStatus).describe('平台状态'),
})

export class PlatformMetadataVo extends createZodDto(PlatformMetadataVoSchema) {}

interface PublishOptionValueItemVo {
  value: string
  label: string
  description?: string
  disabled?: boolean
  children?: PublishOptionValueItemVo[]
  extra?: Record<string, unknown>
}

export const PublishOptionSourceVoSchema = z.object({
  field: z.string().describe('发布选项字段'),
  label: z.string().describe('展示名称'),
  description: z.string().optional().describe('说明'),
  valueType: z.enum(PublishOptionValueType).describe('取值结构'),
  requiresAccount: z.boolean().describe('是否需要账号授权'),
  filterSchema: JsonSchemaVoSchema.optional().describe('过滤条件 schema'),
  createSchema: JsonSchemaVoSchema.optional().describe('创建参数 schema'),
})

export class PublishOptionSourceVo extends createZodDto(PublishOptionSourceVoSchema, 'PublishOptionSourceVo') {}

export const PublishOptionValueItemVoSchema: z.ZodType<PublishOptionValueItemVo> = z.lazy(() => z.object({
  value: z.string().describe('选项值'),
  label: z.string().describe('展示名称'),
  description: z.string().optional().describe('说明'),
  disabled: z.boolean().optional().describe('是否禁用'),
  children: z.array(PublishOptionValueItemVoSchema).optional().describe('子选项'),
  extra: z.record(z.string(), z.unknown()).optional().describe('平台原始补充字段'),
}))

export const PublishOptionValuesVoSchema = z.object({
  field: z.string().describe('发布选项字段'),
  valueType: z.enum(PublishOptionValueType).describe('取值结构'),
  items: z.array(PublishOptionValueItemVoSchema).describe('选项列表'),
})

export class PublishOptionValuesVo extends createZodDto(PublishOptionValuesVoSchema, 'PublishOptionValuesVo') {}

export const PublishOptionCreatedValueVoSchema = z.object({
  field: z.string().describe('发布选项字段'),
  valueType: z.enum(PublishOptionValueType).describe('取值结构'),
  item: PublishOptionValueItemVoSchema.describe('创建后的选项'),
})

export class PublishOptionCreatedValueVo extends createZodDto(
  PublishOptionCreatedValueVoSchema,
  'PublishOptionCreatedValueVo',
) {}
