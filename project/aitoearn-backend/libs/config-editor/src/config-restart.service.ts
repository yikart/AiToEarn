import { execFile } from 'node:child_process'
import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'

@Injectable()
export class ConfigRestartService {
  private readonly logger = new Logger(ConfigRestartService.name)

  restart(): void {
    const pm2ProcessId = process.env['pm_id']
    if (!pm2ProcessId) {
      throw new AppException(ResponseCode.ConfigEditorPm2Unavailable)
    }

    try {
      const child = execFile('pm2', ['restart', pm2ProcessId], (error) => {
        if (error)
          this.logger.error(error)
      })
      child.unref()
    }
    catch (error) {
      throw new AppException(
        ResponseCode.ConfigEditorRestartFailed,
        error instanceof Error ? error.message : String(error),
      )
    }
  }
}
