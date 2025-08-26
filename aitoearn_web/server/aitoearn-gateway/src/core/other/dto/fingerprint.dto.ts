import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsOptional, IsString } from 'class-validator'

export class GenerateFingerprintDto {
  @ApiProperty({
    title: '指定要使用的操作系统的字符串 "windows" | "macos" | "linux" | "android" | "ios"',
  })
  @IsOptional()
  @IsString()
  @Expose()
  operatingSystems?: 'windows' | 'macos' | 'linux' | 'android' | 'ios'
}
