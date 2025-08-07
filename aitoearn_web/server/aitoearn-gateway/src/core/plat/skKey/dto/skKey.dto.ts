import { Optional } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsString } from 'class-validator'

export class CreateSkKeyDto {
  @ApiProperty({
    title: '备注',
    required: false,
    description: '备注',
  })
  @IsString({ message: '备注' })
  @Optional()
  @Expose()
  readonly desc?: string
}

export class SkKeyUpInfoDto {
  @ApiProperty({
    title: 'key',
    required: true,
    description: 'key',
  })
  @IsString({ message: 'key' })
  @Expose()
  readonly key: string

  @ApiProperty({
    title: '备注',
    required: true,
    description: '备注',
  })
  @IsString({ message: '备注' })
  @Expose()
  readonly desc: string
}

export class SkKeyAddRefAccountDto {
  @ApiProperty({
    title: 'key',
    required: true,
    description: 'key',
  })
  @IsString({ message: 'key' })
  @Expose()
  readonly key: string

  @ApiProperty({
    title: '账号ID',
    required: true,
    description: '账号ID',
  })
  @IsString({ message: '账号ID' })
  @Expose()
  readonly accountId: string
}

export class GetRefAccountListDto {
  @ApiProperty({
    title: 'key',
    required: true,
    description: 'key',
  })
  @IsString({ message: 'key' })
  @Expose()
  readonly key: string
}
