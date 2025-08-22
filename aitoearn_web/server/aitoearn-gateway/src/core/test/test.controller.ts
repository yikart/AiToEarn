/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 测试
 */
import { Controller, Get, HttpException } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from 'src/auth/auth.guard'
import { TestService } from './test.service'

@ApiTags('测试')
@Controller('test')
export class TestController {
  constructor(
    private readonly testService: TestService,
  ) {}

  @Public()
  @Get('test')
  addDefaultContent() {
    return this.testService.addDefaultContent()
    // throw new Error('测试异常')
  }
}
