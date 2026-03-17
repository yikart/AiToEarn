import { Module } from '@nestjs/common'
import { MaterialGroupHelperService } from './material-group-helper.service'

@Module({
  imports: [],
  providers: [MaterialGroupHelperService],
  exports: [MaterialGroupHelperService],
})
export class MaterialGroupHelperModule {}
