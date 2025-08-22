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

export class PagesSelectionDto extends UserIdDto {
  @IsArray()
  @Expose()
  readonly pageIds: string[]
}

export class GetAuthUrlDto extends UserIdDto {
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
