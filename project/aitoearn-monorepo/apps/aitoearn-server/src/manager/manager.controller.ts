import {
  Body,
  Controller,
  Post,
} from '@nestjs/common'
import { Internal } from '@yikart/aitoearn-auth'
import { GetUserTokenDto } from './dto/manager.dto'
import { ManagerService } from './manager.service'

@Internal()
@Controller()
export class ManagerController {
  constructor(private readonly managerService: ManagerService) { }

  @Post('internal/manager/getUserToken')
  async getUserToken(
    @Body() body: GetUserTokenDto,
  ) {
    const res = await this.managerService.getUserToken(body.userId)
    return res
  }
}
