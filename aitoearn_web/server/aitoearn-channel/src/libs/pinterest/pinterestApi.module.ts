/*
 * @Author: white
 * @Date: 2025-06-20 22:42:27
 * @LastEditors: white
 * @Description: Pinterest
 */
import { Module } from '@nestjs/common'
import { PinterestApiService } from './pinterestApi.service'

@Module({
  imports: [],
  providers: [PinterestApiService],
  exports: [PinterestApiService],
})
export class PinterestApiModule {}
