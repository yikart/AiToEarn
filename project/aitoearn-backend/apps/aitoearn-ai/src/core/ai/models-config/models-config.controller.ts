import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('Me/Ai')
@Controller('ai')
export class ModelsConfigController {
  constructor(
  ) {}
}
