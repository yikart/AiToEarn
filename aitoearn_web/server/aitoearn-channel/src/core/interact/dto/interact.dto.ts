import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ReplyCommentSchema = z.object({
  accountId: z.string({ required_error: '账号ID' }),
  commentId: z.string({ required_error: '评论ID' }),
  content: z.string({ required_error: '内容' }),
});
export class ReplyCommentDto extends createZodDto(ReplyCommentSchema) {}

export const DelCommentSchema = z.object({
  accountId: z.string({ required_error: '账号ID' }),
  commentId: z.string({ required_error: '评论ID' }),
});
export class DelCommentDto extends createZodDto(DelCommentSchema) {}

export const AddArcCommentSchema = z.object({
  accountId: z.string({ required_error: '账号ID' }),
  dataId: z.string({ required_error: 'dataId不能为空' }),
  content: z.string({ required_error: '内容' }),
});
export class AddArcCommentDto extends createZodDto(AddArcCommentSchema) {}

export const GetArcCommentListSchema = z.object({
  recordId: z.string({ required_error: '记录ID' }),
  pageNo: z.number({ required_error: '页码' }),
  pageSize: z.number({ required_error: '每页数据' }),
});
export class GetArcCommentListDto extends createZodDto(
  GetArcCommentListSchema,
) {}
