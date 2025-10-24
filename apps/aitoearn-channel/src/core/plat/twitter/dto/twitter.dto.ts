import { Expose } from 'class-transformer'
import { IsArray, IsOptional, IsString } from 'class-validator'

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

export class GetAuthUrlDto extends UserIdDto {
  @IsString()
  @Expose()
  readonly spaceId: string

  @IsArray()
  @IsOptional()
  @Expose()
  readonly scopes?: string[]
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

export class UserTimelineDto extends AccountIdDto {
  @IsString()
  @Expose()
  userId: string

  @IsString()
  @IsOptional()
  @Expose()
  readonly sinceId?: string

  @IsString()
  @IsOptional()
  @Expose()
  readonly untilId?: string

  @IsString()
  @IsOptional()
  readonly maxResults?: string

  // pagination_token
  @IsString()
  @IsOptional()
  readonly paginationToken?: string

  @IsArray()
  @IsOptional()
  readonly exclude?: ('retweets' | 'replies')[]

  @IsString()
  @IsOptional()
  readonly startTime?: string // ISO 8601 format

  @IsString()
  @IsOptional()
  readonly endTime?: string // ISO 8601 format
}
