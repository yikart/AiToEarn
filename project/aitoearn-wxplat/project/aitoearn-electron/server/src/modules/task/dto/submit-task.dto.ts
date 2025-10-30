import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class SubmitTaskDto {
  @ApiProperty({ description: '任务完成截图', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  screenshotUrls?: string[];

  @ApiProperty({ description: '二维码扫描结果', required: false })
  @IsString()
  @IsOptional()
  qrCodeScanResult?: string;

  @ApiProperty({ description: '提交的URL', required: false })
  @IsString()
  @IsOptional()
  submissionUrl?: string;
}
