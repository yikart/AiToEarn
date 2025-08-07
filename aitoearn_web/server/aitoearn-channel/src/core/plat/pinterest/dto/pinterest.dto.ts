import { Expose } from 'class-transformer'
import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator'
/*
 * @Author: white
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: white
 * @Description: 用户
 */
import { Country, Currency, SourceType } from '@/libs/pinterest/comment'

export class CreateAccountBodyDto {
  @IsString({ message: '国家' })
  @IsOptional()
  @Expose()
  readonly country: Country

  @IsString({ message: '货币' })
  @IsOptional()
  @Expose()
  readonly currency: Currency

  @IsString({ message: '名称' })
  @IsOptional()
  @Expose()
  readonly name: string

  @IsString({ message: '所属用户' })
  @IsOptional()
  @Expose()
  readonly owner_user_id: string
}

export class CreateBoardBodyDto {
  @IsString({ message: '名称' })
  @Expose()
  readonly name: string

  @IsString({ message: '用户id' })
  @Expose()
  @IsOptional()
  readonly accountId?: string
}

export class MediaSource {
  @IsString({ message: '媒体类型' })
  @Expose()
  readonly source_type: SourceType
}

export class CreatePinBodyItemDto {
  @IsString({ message: '地址' })
  @Expose()
  @IsOptional()
  readonly url: string

  @IsString({ message: '标题' })
  @Expose()
  @IsOptional()
  readonly title: string

  @IsString({ message: '描述' })
  @Expose()
  @IsOptional()
  readonly description: string

  @IsString({ message: '链接' })
  @Expose()
  @IsOptional()
  readonly link: string
}

export class CreatePinBodyDto {
  @IsString({ message: '此 Pin 所属的板块。' })
  @Expose()
  readonly board_id: string

  @IsString({ message: '用户id' })
  @Expose()
  @IsOptional()
  readonly accountId?: string

  @IsString({ message: '点击连接' })
  @IsOptional()
  @Expose()
  readonly link: string

  @IsString({ message: '标题' })
  @IsOptional()
  @Expose()
  readonly title: string

  @IsString({ message: '描述' })
  @Expose()
  readonly description: string

  @IsString({ message: 'RGB表示的颜色 主引脚颜色。十六进制数，例如“#6E7874"' })
  @Expose()
  readonly dominant_color: string

  @IsString({ message: '描述' })
  @Expose()
  readonly alt_text: string

  @IsObject({ message: '媒体来源' })
  @Expose()
  @IsOptional()
  readonly media_source: MediaSource

  @IsString({ message: '地址' })
  @Expose()
  @IsOptional()
  readonly url: string

  @IsArray({ message: '媒体来源' })
  @Expose()
  @IsOptional()
  readonly items: CreatePinBodyItemDto[]
}

export class WebhookDto {
  @IsString({ message: 'code' })
  @Expose()
  @IsOptional()
  readonly code: string

  @IsString({ message: 'state' })
  @Expose()
  @IsOptional()
  readonly state: string
}
