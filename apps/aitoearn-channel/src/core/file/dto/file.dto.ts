/*
 * @Author: nevin
 * @Date: 2024-08-19 15:58:47
 * @LastEditTime: 2025-03-17 12:41:12
 * @LastEditors: nevin
 * @Description: 反馈
 */
import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { IsArray, IsNumber, IsString } from 'class-validator'

export class InitMultipartUploadDto {
  @ApiProperty({ title: '文件名称', required: true })
  @IsString({ message: '文件名称' })
  @Expose()
  readonly fileName: string

  @ApiProperty({ title: '存放位置', required: true })
  @IsString({ message: '存放位置' })
  @Expose()
  readonly secondPath: string

  @ApiProperty({ title: '文件大小', required: true })
  @IsNumber({ allowNaN: false }, { message: '文件大小' })
  @Expose()
  readonly fileSize: string

  @ApiProperty({ title: '文件类型', required: true })
  @IsString({ message: '文件类型' })
  @Expose()
  readonly contentType: string
}

export class UploadPartDto {
  @ApiProperty({ title: '文件key', required: true })
  @IsString({ message: '文件key' })
  @Expose()
  readonly fileId: string

  @ApiProperty({ title: '上传ID', required: true })
  @IsString({ message: '上传ID' })
  @Expose()
  readonly uploadId: string

  @ApiProperty({ title: '分片索引', required: true })
  @IsNumber({ allowNaN: false }, { message: '分片索引' })
  @Type(() => Number)
  @Expose()
  readonly partNumber: number
}

export class CompletePartDto {
  @ApiProperty({ title: '文件key', required: true })
  @IsString({ message: '文件key' })
  @Expose()
  readonly fileId: string

  @ApiProperty({ title: '上传ID', required: true })
  @IsString({ message: '上传ID' })
  @Expose()
  readonly uploadId: string

  @ApiProperty({ title: '分片', required: true })
  @IsArray({ message: '分片' })
  @Expose()
  readonly parts: { PartNumber: number, ETag: string }[]
}
