import { ApiProperty } from '@nestjs/swagger'
import { createZodDto } from '@yikart/common'
import { Expose, Type } from 'class-transformer'
import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator'
import { z } from 'zod'
import { ArchiveStatus } from '../bilibili.common'

export const AccountIdSchema = z.object({
  accountId: z.string().describe('账号ID'),
})
export class AccountIdDto extends createZodDto(AccountIdSchema) {}

export const AccessBackSchema = z.object({
  code: z.string().describe('code'),
  state: z.string().describe('state'),
})
export class AccessBackDto extends createZodDto(AccessBackSchema) {}

export class GetArchiveListDto extends AccountIdDto {
  @ApiProperty({ enum: ArchiveStatus })
  @IsEnum(ArchiveStatus)
  @Type(() => Number)
  @IsOptional()
  @Expose()
  readonly status?: ArchiveStatus
}

export class GetArcStatDto extends AccountIdDto {
  @ApiProperty({ title: '稿件ID', required: true })
  @IsString({ message: '稿件ID' })
  @Expose()
  readonly resourceId: string
}
