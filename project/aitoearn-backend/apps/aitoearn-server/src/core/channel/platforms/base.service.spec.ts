import { AccountType, ResponseCode } from '@yikart/common'

import { describe, expect, it, vi } from 'vitest'
import { RelayAccountException } from '../../../core/relay/relay-account.exception'
import { PlatformBaseService } from './base.service'

vi.mock('@yikart/channel-db', () => ({
  OAuth2CredentialRepository: class {},
}))

vi.mock('@yikart/mongodb', () => ({
  AccountRepository: class {},
}))

class TestPlatformService extends PlatformBaseService {
  async getAccessTokenStatus(): Promise<number> {
    return 1
  }

  async getWorkLinkInfo() {
    return {
      dataId: 'data_1',
      uniqueId: `${AccountType.YOUTUBE}_data_1`,
      type: 'video',
    }
  }

  exposeGetLocalAccount(userId: string, accountId: string) {
    return this.getLocalAccount(userId, accountId)
  }

  exposeGetLocalAccountById(accountId: string) {
    return this.getLocalAccountById(accountId)
  }
}

function createService(account: any) {
  const service = new TestPlatformService()
  const mutableService = service as any
  mutableService.accountRepository = {
    getById: vi.fn().mockResolvedValue(account),
  }
  return service
}

describe('platformBaseService account guard', () => {
  it('返回属于当前用户的本地账号', async () => {
    const account = { id: 'account_1', userId: 'user_1' }
    const service = createService(account)

    await expect(service.exposeGetLocalAccount('user_1', 'account_1')).resolves.toBe(account)
  })

  it('账号不存在或不属于当前用户时按不存在处理', async () => {
    await expect(createService(null).exposeGetLocalAccount('user_1', 'account_1')).rejects.toMatchObject({
      code: ResponseCode.AccountNotFound,
    })

    await expect(createService({ id: 'account_1', userId: 'user_2' }).exposeGetLocalAccount('user_1', 'account_1')).rejects.toMatchObject({
      code: ResponseCode.AccountNotFound,
    })
  })

  it('中继账号仍抛 RelayAccountException', async () => {
    const service = createService({
      id: 'account_1',
      userId: 'user_1',
      relayAccountRef: 'relay_account_1',
    })

    await expect(service.exposeGetLocalAccount('user_1', 'account_1')).rejects.toBeInstanceOf(RelayAccountException)
    await expect(service.exposeGetLocalAccountById('account_1')).rejects.toBeInstanceOf(RelayAccountException)
  })
})
