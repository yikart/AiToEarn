import { createZodDto } from '@yikart/common'
import { Expose } from 'class-transformer'
import { IsArray, IsOptional, IsString } from 'class-validator'
import { z } from 'zod'

export class AccountIdDto {
  @IsString()
  @Expose()
  readonly accountId: string
}

export class UserIdDto {
  @IsString()
  @Expose()
  readonly userId: string
}

export class PagesSelectionDto extends UserIdDto {
  @IsArray()
  @Expose()
  readonly pageIds: string[]
}

export class GetAuthUrlDto extends UserIdDto {
  @IsString({ message: '空间ID' })
  @Expose()
  readonly spaceId: string

  @IsArray()
  @IsOptional()
  @Expose()
  readonly scopes?: string[]

  @IsString()
  @Expose()
  readonly platform: string // Optional, can be 'facebook', 'instagram', or 'thread'
}

export class GetAuthInfoDto {
  @IsString()
  @Expose()
  readonly taskId: string
}

export class CreateAccountAndSetAccessTokenDto {
  @IsString()
  @Expose()
  readonly code: string

  @IsString()
  @Expose()
  readonly state: string
}

export class RefreshTokenDto extends AccountIdDto {
  @IsString()
  @Expose()
  readonly refreshToken: string
}

export const ListCommentsSchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'threads']),
  accountId: z.string(),
  targetId: z.string(),
  targetType: z.enum(['post', 'comment']),
  before: z.string().nullish(),
  after: z.string().nullish(),
})

export const CreateCommentSchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'threads']),
  accountId: z.string(),
  targetId: z.string(),
  targetType: z.enum(['post', 'comment']),
  message: z.string(),
})

export class ListCommentsDto extends createZodDto(ListCommentsSchema) {}
export class CreateCommentDto extends createZodDto(CreateCommentSchema) {}
