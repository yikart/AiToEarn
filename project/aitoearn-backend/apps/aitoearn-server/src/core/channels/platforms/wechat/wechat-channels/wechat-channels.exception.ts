import type { PlatformSpecificExceptionInput, PlatformValidationExceptionInput } from '../../platforms.exception'
import { AccountType } from '@yikart/common'
import { ChannelPlatformException, PlatformErrorCauseType } from '../../platforms.exception'

export class WeChatChannelsPlatformException extends ChannelPlatformException {
  constructor(input: PlatformSpecificExceptionInput) {
    super({ ...input, platform: AccountType.WeChatChannels })
  }

  static validation(input: PlatformValidationExceptionInput): WeChatChannelsPlatformException {
    return new WeChatChannelsPlatformException({
      ...input,
      cause: { type: PlatformErrorCauseType.Validation, ...input.cause },
    })
  }
}
