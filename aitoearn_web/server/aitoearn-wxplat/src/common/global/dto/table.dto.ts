/*
 * @Author: nevin
 * @Date: 2022-03-17 18:14:52
 * @LastEditors: nevin
 * @LastEditTime: 2024-10-10 15:45:59
 * @Description: 表单数据
 */

import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const tableSchema = z.object({
  pageNo: z.number().int({ message: '页码必须是数值' }).optional().default(1),
  pageSize: z
    .number()
    .int({ message: '每页个数必须是数值' })
    .optional()
    .default(10),
});

export class TableDto extends createZodDto(tableSchema) {}

export class TableResDto {
  @ApiProperty({ title: '页码', description: '页码' })
  readonly pageNo: number = 1;

  @ApiProperty({ title: '页数', description: '页数' })
  readonly pageSize: number = 10;

  @ApiProperty({ title: '总数', description: '总数' })
  readonly count: number = 0;
}
