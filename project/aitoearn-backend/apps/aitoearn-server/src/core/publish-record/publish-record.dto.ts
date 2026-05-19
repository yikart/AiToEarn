import { AccountType, createZodDto } from '@yikart/common'
import { PublishRecordLinkStatus, PublishStatus, PublishType } from '@yikart/mongodb'
import { z } from 'zod'

/**
 * 创建发布记录
 */
export const publishRecordIdSchema = z.object({
  id: z.string({ message: 'id' }),
})
export class PublishRecordIdDto extends createZodDto(publishRecordIdSchema) {}

export const UpdatePublishRecordWorkLinkSchema = z.object({
  id: z.string({ message: '发布记录ID' }).describe('发布记录ID'),
  workLink: z.string({ message: '作品链接' }).min(1, { message: '作品链接不能为空' }).optional().describe('作品链接'),
  dataId: z.string().min(1).optional().describe('作品数据ID'),
  platformWorkId: z.string().min(1).optional().describe('平台作品ID'),
  linkStatus: z.enum(PublishRecordLinkStatus).default(PublishRecordLinkStatus.READY).describe('作品链接状态'),
  linkError: z.string().optional().describe('作品链接获取错误'),
  linkMeta: z.record(z.string(), z.any()).optional().describe('作品链接扩展信息'),
})
export class UpdatePublishRecordWorkLinkDto extends createZodDto(UpdatePublishRecordWorkLinkSchema) {}

export enum BilibiliNoReprint {
  No = 1,
  Yes = 0,
}
export enum Copyright {
  Original = 1, // 原创
  Reprint = 2,
}

/**
 * 创建发布记录
 */
export const CreatePublishRecordSchema = z.object({
  flowId: z.string({ message: '流水ID' }).optional(),
  dataId: z.string({ message: '数据ID' }),
  userId: z.string({ message: '用户ID' }),
  uid: z.string({ message: '频道账户ID' }),
  accountId: z.string({ message: '账户ID' }),
  accountType: z.enum(AccountType, { message: '平台类型' }),
  type: z.enum(PublishType, { message: '类型' }),
  status: z.enum(PublishStatus, { message: '状态' }),
  title: z.string().optional(),
  desc: z.string().optional(),
  materialGroupId: z.string({ message: '草稿箱ID' }).optional(), // 草稿箱ID
  materialId: z.string({ message: '草稿ID' }).optional(), // 草稿ID (替换原 taskMaterialId)
  videoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  imgUrlList: z.array(z.string()).optional(),
  publishTime: z.coerce.date(),
  topics: z.array(z.string()),
  workLink: z.string({ message: '作品链接' }).optional(),
  option: z.object().optional(),
})
export class CreatePublishRecordDto extends createZodDto(CreatePublishRecordSchema) {}

export const PublishRecordListFilterSchema = z.object({
  userId: z.string({ message: '用户ID' }),
  accountId: z.string({ message: '账户ID' }).optional(),
  uid: z.string({ message: '第三方平台id' }).optional(),
  accountType: z.enum(AccountType, { message: '账户类型' }).optional(),
  type: z.enum(PublishType, { message: '类型' }).optional(),
  status: z.enum(PublishStatus, { message: '状态' }).optional(),
  time: z.tuple([
    z.coerce.date(),
    z.coerce.date(),
  ]).optional(),
})
export class PublishRecordListFilterDto extends createZodDto(PublishRecordListFilterSchema) {}

export const PublishDayInfoListFiltersSchema = z.object({
  userId: z.string(),
  time: z.tuple([
    z.coerce.date(),
    z.coerce.date(),
  ]).optional(),
})
export class PublishDayInfoListFiltersDto extends createZodDto(PublishDayInfoListFiltersSchema) {}

export const PublishDayInfoListSchema = z.object({
  filters: PublishDayInfoListFiltersSchema,
  page: z.object({
    pageNo: z.number().min(1, { message: '页码不能小于1' }),
    pageSize: z.number().min(1, { message: '页大小不能小于1' }),
  }),
})
export class PublishDayInfoListDto extends createZodDto(PublishDayInfoListSchema) {}

export const GetPublishRecordDetailSchema = z.object({
  flowId: z.string({ message: 'flowId is required' }),
  userId: z.string({ message: 'userId is required' }),
})

export class GetPublishRecordDetailDto extends createZodDto(GetPublishRecordDetailSchema) {}

export const donePublishRecordSchema = z.object({
  filter: z.object({
    dataId: z.string({ message: '数据ID' }),
    uid: z.string({ message: '渠道ID' }),
  }),
  data: z.object({
    workLink: z.string({ message: '作品链接' }).optional(),
    dataOption: z.any().optional(),
  }),
})
export class DonePublishRecordDto extends createZodDto(donePublishRecordSchema) {}
