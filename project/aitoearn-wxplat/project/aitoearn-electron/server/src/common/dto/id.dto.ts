import { IsNumber } from 'class-validator';

export class IdDto {
  @IsNumber()
  id: number;
}
