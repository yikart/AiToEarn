import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { config } from '@/config'
import { AliOSSModule } from '@/libs/ali-oss/ali-oss.module'
import { FileService } from './file.service'
import { FileToolsService } from './fileTools.service'

@Global()
@Module({
  imports: [
    HttpModule,
    AliOSSModule.forRootAsync({
      useFactory: () => {
        return config.oss.options
      },
    }),
  ],
  providers: [FileService, FileToolsService],
  exports: [FileService, FileToolsService],
})
export class FileModule {}
