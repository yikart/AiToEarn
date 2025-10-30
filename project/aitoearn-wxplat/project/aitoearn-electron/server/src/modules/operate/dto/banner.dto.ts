/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-03-03 19:00:31
 * @LastEditors: nevin
 * @Description:
 */
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Banner, BannerTag } from 'src/db/schema/banner.schema';
import { ONOFF } from 'src/global/enum/all.enum';

export class ActionBannerDto implements Partial<Banner> {
  @ApiProperty({ required: false })
  @IsString({ message: '数据ID' })
  @IsOptional()
  @Expose()
  readonly dataId?: string;

  @ApiProperty({ required: false })
  @IsString({ message: '描述' })
  @IsOptional()
  @Expose()
  readonly desc?: string;

  @ApiProperty({ required: false })
  @IsString({ message: '链接' })
  @IsOptional()
  @Expose()
  readonly url?: string;

  @ApiProperty({ title: '图片链接', required: true })
  @IsString({ message: '图片链接' })
  @Expose()
  readonly imgUrl: string;

  @ApiProperty({ title: '标识', required: true })
  @IsEnum(BannerTag, { message: '标识' })
  @Expose()
  readonly tag: BannerTag;
}

export class BannerIdDto {
  @ApiProperty({ title: 'ID', required: true })
  @IsString({ message: 'ID' })
  @Expose()
  id: string;
}

export class GetBannerListDto {
  @ApiProperty({ title: 'ID', required: false })
  @IsString({ message: 'ID' })
  @IsOptional()
  @Expose()
  readonly id?: string;
}

export class AppGetBannerListDto {
  @ApiProperty({ title: 'tag', required: false })
  @IsEnum(BannerTag, { message: 'tag' })
  @IsOptional()
  @Expose()
  readonly tag?: BannerTag;
}

export class UpdateBannerPublishDto {
  @ApiProperty({ title: '是否发布', required: true })
  @IsEnum(ONOFF, { message: '是否发布' })
  @Type(() => Number)
  @Expose()
  readonly isPublish: ONOFF;
}
