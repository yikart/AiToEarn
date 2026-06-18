import { Logger } from '@nestjs/common'
import { ResponseCode } from '@yikart/common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ConfigRestartService } from './config-restart.service'

const execFileMock = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', () => ({
  execFile: execFileMock,
}))

describe('configRestartService', () => {
  let originalPmId: string | undefined

  beforeEach(() => {
    originalPmId = process.env['pm_id']
    execFileMock.mockReset()
  })

  afterEach(() => {
    if (originalPmId === undefined)
      delete process.env['pm_id']
    else
      process.env['pm_id'] = originalPmId
  })

  it('没有 PM2 进程 ID 时拒绝重启', () => {
    delete process.env['pm_id']

    expect(() => new ConfigRestartService().restart()).toThrow(expect.objectContaining({
      code: ResponseCode.ConfigEditorPm2Unavailable,
    }))
  })

  it('通过 pm2 重启当前进程', () => {
    process.env['pm_id'] = '7'
    const unref = vi.fn()
    execFileMock.mockReturnValue({ unref })

    new ConfigRestartService().restart()

    expect(execFileMock).toHaveBeenCalledWith('pm2', ['restart', '7'], expect.any(Function))
    expect(unref).toHaveBeenCalled()
  })

  it('记录 pm2 异步重启失败', () => {
    process.env['pm_id'] = '8'
    const unref = vi.fn()
    const errorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)
    execFileMock.mockReturnValue({ unref })

    new ConfigRestartService().restart()
    const callback = execFileMock.mock.calls[0][2] as (error: Error) => void
    callback(new Error('restart failed'))

    expect(errorSpy).toHaveBeenCalledWith(expect.any(Error))
    errorSpy.mockRestore()
  })
})
