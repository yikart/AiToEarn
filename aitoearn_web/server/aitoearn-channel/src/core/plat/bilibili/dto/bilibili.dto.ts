import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: nevin
 * @Description: b站
 */
import { TableDto } from '@/common/global/dto/table.dto'
import { AddArchiveData, ArchiveStatus } from '@/libs/bilibili/comment'

export class AccountIdDto {
  @IsString({ message: '账号ID' })
  @Expose()
  readonly accountId: string
}
export class UserIdDto {
  @IsString({ message: '用户ID' })
  @Expose()
  readonly userId: string
}

export class GetAuthUrlDto extends UserIdDto {
  @IsString({ message: '类型 pc h5' })
  @Expose()
  readonly type: 'h5' | 'pc'

  @IsString({ message: '前缀' })
  @IsOptional()
  @Expose()
  readonly prefix?: string
}

export class GetAuthInfoDto {
  @IsString({ message: '任务ID' })
  @Expose()
  readonly taskId: string
}

export class GetHeaderDto extends AccountIdDto {
  @IsObject({ message: '数据' })
  @Expose()
  readonly body: { [key: string]: any }

  @IsBoolean({ message: '是否是表单提交' })
  @Expose()
  readonly isForm: boolean
}

export class VideoInitDto extends AccountIdDto {
  @IsNumber(
    { allowNaN: false },
    {
      message:
        '上传类型：0，1。0-多分片，1-单个小文件（不超过100M）。默认值为0',
    },
  )
  @Type(() => Number)
  @Expose()
  readonly utype: number // 0 1

  @IsString({ message: '文件名称' })
  @Expose()
  readonly name: string
}

export class UploadLitVideoDto extends AccountIdDto {
  @IsString({ message: '文件流 base64编码' })
  @Expose()
  readonly file: string

  @IsString({ message: '上传token' })
  @Expose()
  readonly uploadToken: string
}

export class UploadVideoPartDto extends UploadLitVideoDto {
  @IsNumber(
    { allowNaN: false },
    {
      message: '分片索引',
    },
  )
  @Type(() => Number)
  @Expose()
  readonly partNumber: number
}

export class VideoCompleteDto extends AccountIdDto {
  @IsString({ message: '上传token' })
  @Expose()
  readonly uploadToken: string
}

export class CoverUploadDto extends AccountIdDto {
  @IsString({ message: '文件流 base64编码' })
  @Expose()
  readonly file: string
}

export class AddArchiveDataDto implements AddArchiveData {
  @IsString({ message: '标题' })
  @Expose()
  readonly title: string

  @IsString({ message: '封面' })
  @IsOptional()
  @Expose()
  readonly cover?: string

  @IsNumber({ allowNaN: false }, { message: '分区ID' })
  @Expose()
  readonly tid: number

  @IsNumber({ allowNaN: false }, { message: '是否允许转载' })
  @IsOptional()
  @Expose()
  readonly no_reprint?: 0 | 1

  @IsString({ message: '描述' })
  @IsOptional()
  @Expose()
  readonly desc?: string

  @IsString({ message: '标签' })
  @Expose()
  readonly tag: string

  @IsNumber({ allowNaN: false }, { message: '1-原创，2-转载' })
  @Expose()
  readonly copyright: 1 | 2

  @IsString({ message: '转载来源' })
  @IsOptional()
  @Expose()
  readonly source?: string
}
export class AddArchiveDto extends AccountIdDto {
  @ValidateNested()
  @Type(() => AddArchiveDataDto)
  @Expose()
  readonly data: AddArchiveDataDto

  @IsString({ message: '上传token' })
  @Expose()
  readonly uploadToken: string
}

export class CreateAccountAndSetAccessTokenDto {
  @IsString({ message: '任务ID' })
  @Expose()
  readonly taskId: string

  @IsString({ message: '授权码' })
  @Expose()
  readonly code: string

  @IsString({ message: '状态' })
  @Expose()
  readonly state: string
}

export class ArchiveListFilterDto {
  @ApiProperty({
    description: '任务状态',
    enum: ArchiveStatus,
    required: false,
  })
  @IsEnum(ArchiveStatus, { message: '任务状态' })
  @IsOptional()
  status?: ArchiveStatus
}

export class ArchiveListDto extends AccountIdDto {
  @ValidateNested()
  @Type(() => ArchiveListFilterDto)
  @Expose()
  readonly filter: ArchiveListFilterDto

  @ValidateNested()
  @Type(() => TableDto)
  @Expose()
  readonly page: TableDto
}

export class GetArcStatDto extends AccountIdDto {
  @IsString({ message: '稿件ID' })
  @Expose()
  readonly resourceId: string
}
