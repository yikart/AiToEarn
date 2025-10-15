import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('数据统计')
@Controller('statistics')
export class StatisticsController {
}
