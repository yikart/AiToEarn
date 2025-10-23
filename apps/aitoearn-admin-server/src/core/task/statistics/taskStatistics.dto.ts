import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsString } from 'class-validator'

export class TaskPostsDto {
  // @ApiProperty({ description: '账号ID' })
  // @IsString({ message: '账号ID必须是字符串' })
  // @Expose()
  // readonly accountId: string

  @ApiProperty({ description: '任务ID' })
  @IsString()
  @Expose()
  readonly taskId: string
}

export class TaskPostPeriodDto {
  // @ApiProperty({ description: '账号ID' })
  // @IsString({ message: '账号ID必须是字符串' })
  // @Expose()
  // readonly accountId: string

  @ApiProperty({ description: '平台', example: 'bilibili' })
  @IsString()
  @Expose()
  readonly platform: string

  @ApiProperty({ description: '作品ID' })
  @IsString()
  @Expose()
  readonly postId: string
}
