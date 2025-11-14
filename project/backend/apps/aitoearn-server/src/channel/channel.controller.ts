import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ChannelService } from './channel.service'

@ApiTags('OpenSource/Channel/Channel')
@Controller('channel')
export class ChannelController {
  constructor(private readonly taskService: ChannelService) { }
}
