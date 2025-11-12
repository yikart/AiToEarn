import { z } from 'zod'

export const AccountIdSchema = z.object({
  accountId: z.string(),
})
export type AccountIdDto = z.infer<typeof AccountIdSchema>

export const UserIdSchema = z.object({
  userId: z.string(),
})
export type UserIdDto = z.infer<typeof UserIdSchema>

export const GetAuthorDataByDateSchema = AccountIdSchema.extend({
  platform: z.string(),
  date: z.string(),
})
export type GetAuthorDataByDateDto = z.infer<typeof GetAuthorDataByDateSchema>

export const GetAccountDataLatestSchema = AccountIdSchema.extend({
  platform: z.string(),
  uid: z.string(),
})
export type GetAccountDataLatestDto = z.infer<typeof GetAccountDataLatestSchema>

export const GetAccountDataByParamsSchema = z.object({
  params: z.any().optional(),
  sort: z.any().optional(),
  pageNo: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
})
export type GetAccountDataByParamsDto = z.infer<typeof GetAccountDataByParamsSchema>

export const GetAccountDataPeriodSchema = AccountIdSchema.extend({
  platform: z.string(),
  uid: z.string(),
  startDate: z.string(),
  endDate: z.string(),
})
export type GetAccountDataPeriodDto = z.infer<typeof GetAccountDataPeriodSchema>

export const PlatformUidQuerySchema = z.object({
  platform: z.string(),
  uid: z.string(),
})
export type PlatformUidQueryDto = z.infer<typeof PlatformUidQuerySchema>

export const GetChannelDataLatestByUidsSchema = z.object({
  queries: z.array(PlatformUidQuerySchema),
})
export type GetChannelDataLatestByUidsDto = z.infer<typeof GetChannelDataLatestByUidsSchema>

export const GetChannelDataPeriodByUidsSchema = z.object({
  queries: z.array(PlatformUidQuerySchema),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})
export type GetChannelDataPeriodByUidsDto = z.infer<typeof GetChannelDataPeriodByUidsSchema>
