import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class OperatorDto {
  @ApiHideProperty()
  @Exclude()
  createBy: number;

  @ApiHideProperty()
  @Exclude()
  updateBy: number;
}
