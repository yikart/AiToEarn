/*
 * @Author: nevin
 * @Date: 2022-03-17 18:14:52
 * @LastEditors: nevin
 * @LastEditTime: 2024-10-10 15:45:59
 * @Description: 表单数据
 */

import { ApiProperty } from '@nestjs/swagger'
import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const TableDtoSchema = z.object({
  pageNo: z.coerce.number().default(1),
  pageSize: z.coerce.number().default(10),
})
export class TableDto extends createZodDto(TableDtoSchema) {}

export class TableResDto {
  @ApiProperty({ title: '页码', description: '页码' })
  readonly pageNo: number = 1

  @ApiProperty({ title: '页数', description: '页数' })
  readonly pageSize: number = 10

  @ApiProperty({ title: '总数', description: '总数' })
  readonly count: number = 0
}
