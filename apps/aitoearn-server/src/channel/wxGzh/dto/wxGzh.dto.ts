/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:16:37
 * @LastEditors: nevin
 * @Description:
 */
import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { ArchiveStatus } from '../../../transports/channel/api/bilibili.common'
import { VideoUTypes } from '../common'

const AccountIdSchema = z.object({
  accountId: z.string({ message: '账号ID' }),
})
export class AccountIdDto extends createZodDto(AccountIdSchema) {}

export class AccessBackDto {
  code: string
  state: string
}

const VideoInitSchema = AccountIdSchema.extend({
  name: z.string({ message: '文件名称' }),
  utype: z.nativeEnum(VideoUTypes).optional(),
})
export class VideoInitDto extends createZodDto(VideoInitSchema) {}

const UploadLitVideoSchema = z.object({
  uploadToken: z.string({ message: '上传token' }),
})
export class UploadLitVideoDto extends createZodDto(UploadLitVideoSchema) {}

const UploadVideoPartSchema = UploadLitVideoSchema.extend({
  partNumber: z.number({ message: '分片索引' }),
})
export class UploadVideoPartDto extends createZodDto(UploadVideoPartSchema) {}

export class VideoCompleteDto extends createZodDto(UploadLitVideoSchema) {}

const ArchiveAddByUtokenBodySchema = z.object({
  accountId: z.string({ message: '账号ID' }),
  uploadToken: z.string({ message: '上传token' }),
  title: z.string().regex(/^(?!\s*$).+/, { message: '标题不能为空或仅包含空白字符' }),
  cover: z.string().optional(),
  tid: z.number({ message: '分区ID，由获取分区信息接口得到' }),
  noReprint: z.union([z.literal(0), z.literal(1)]).optional(),
  desc: z.string().optional(),
  tag: z.array(z.string()).min(1, { message: '最少添加一个标签' }).describe('标签必须是字符串数组'),
  copyright: z.union([z.literal(1), z.literal(2)], { message: '1-原创，2-转载(转载时source必填)' }),
  source: z.string().optional(),
})
export class ArchiveAddByUtokenBodyDto extends createZodDto(ArchiveAddByUtokenBodySchema) {}

const GetArchiveListSchema = AccountIdSchema.extend({
  status: z.nativeEnum(ArchiveStatus).optional(),
})
export class GetArchiveListDto extends createZodDto(GetArchiveListSchema) {}

const GetArcStatSchema = AccountIdSchema.extend({
  resourceId: z.string({ message: '稿件ID' }),
})
export class GetArcStatDto extends createZodDto(GetArcStatSchema) {}

const GetUserCumulateDataSchema = AccountIdSchema.extend({
  beginDate: z.string({ message: '开始日期' }),
  endDate: z.string({ message: '结束日期' }),
})
export class GetUserCumulateData extends createZodDto(GetUserCumulateDataSchema) {}

const AuthBackQuerySchema = z.object({
  stat: z.string({ message: ' 透传数据（任务ID）' }),
  auth_code: z.string({ message: '授权码' }),
  expires_in: z.number({ message: '过期时间' }),
})
export class AuthBackQueryDto extends createZodDto(AuthBackQuerySchema) {}
