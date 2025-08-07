import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '@/auth/auth.guard'
import { GologinService } from './gologin.service'

@ApiTags('指纹浏览器')
@Controller('gologin')
export class GologinController {
  constructor(private readonly gologinService: GologinService) {}

  @Public()
  @Get()
  async toTest() {
    const res = await this.gologinService.doTest()
    return res
  }
}
