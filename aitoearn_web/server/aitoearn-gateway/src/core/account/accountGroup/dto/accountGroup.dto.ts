import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
// 创建组 Dto
import { IsArray, IsJSON, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateAccountGroupDto {
  @ApiProperty({ description: '组名称' })
  @IsString()
  @Expose()
  name: string

  @ApiProperty({ description: '组排序，默认为 1' })
  @IsNumber()
  @IsOptional()
  @Expose()
  rank?: number

  @IsString({ message: 'IP' })
  @IsOptional()
  @Expose()
  ip?: string

  @IsString({ message: '地址' })
  @IsOptional()
  @Expose()
  location?: string

  @ApiProperty({ description: '代理IP' })
  @IsString({ message: '代理IP' })
  @IsOptional()
  @Expose()
  proxyIp?: string

  @ApiProperty({ description: '浏览器配置必须为JSON格式' })
  @IsJSON()
  @IsOptional()
  @Expose()
  browserConfig: Record<string, any>
}

export class UpdateAccountGroupDto extends CreateAccountGroupDto {
  @ApiProperty({ description: '更新ID' })
  @IsString()
  @Expose()
  id: string
}

export class DeleteAccountGroupDto {
  @ApiProperty({ description: '要删除的ID' })
  @IsArray()
  @IsString({ each: true })
  @Expose()
  ids: string[]
}
