import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('OpenSource/Me/Ai')
@Controller('ai')
export class ModelsConfigController {
  constructor(
  ) {}
}
