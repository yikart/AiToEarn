import { ApiProperty } from '@nestjs/swagger'
import { AccountType } from '@transports/account/comment'
import { PublishStatus } from '@transports/plat/publish.natsApi'

export class PublishRecordItemDto {
  @ApiProperty({ description: '数据ID' })
  dataId: string

  @ApiProperty({ description: '记录ID' })
  id: string

  @ApiProperty({ example: 'flow001', description: '流程ID' })
  flowId: string

  @ApiProperty({
    example: 'video',
    description: '发布类型（如 video, article）',
  })
  type: string

  @ApiProperty({ example: '标题示例', description: '发布标题' })
  title: string

  @ApiProperty({ example: '这是一个描述', description: '发布描述' })
  desc: string

  @ApiProperty({ example: 'ACCOUNT-001', description: '账号ID' })
  accountId: string

  @ApiProperty({ enum: AccountType, description: '账号类型' })
  accountType: AccountType

  @ApiProperty({ example: 'USER-001', description: '用户UID' })
  uid: string

  @ApiProperty({
    example: 'https://example.com/video.mp4',
    description: '视频地址',
    required: false,
  })
  videoUrl?: string

  @ApiProperty({
    example: 'https://example.com/cover.jpg',
    description: '封面图地址',
    required: false,
  })
  coverUrl?: string

  @ApiProperty({
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    description: '图片列表',
  })
  imgUrlList: string[]

  @ApiProperty({ example: '2025-04-27T18:00:18Z', description: '发布时间' })
  publishTime: Date

  @ApiProperty({ enum: PublishStatus, description: '发布状态' })
  status: PublishStatus

  @ApiProperty({
    example: '错误信息（可为空）',
    description: '错误信息',
    nullable: true,
  })
  errorMsg: string
}
