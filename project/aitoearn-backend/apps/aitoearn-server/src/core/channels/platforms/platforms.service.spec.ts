import type { Request, Response } from 'express'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { ChannelPlatformException, PlatformErrorCategory, PlatformErrorCauseType } from './platforms.exception'
import { PublishOptionValueType } from './platforms.interface'
import { PlatformsService } from './platforms.service'

vi.mock('@yikart/mongodb', () => ({
  AccountRepository: class AccountRepository {},
}))

vi.mock('../auth/auth.service', () => ({
  AuthService: class AuthService {},
}))

function createResponse(): Response {
  const response = {
    headersSent: false,
    status: vi.fn().mockReturnThis(),
    send: vi.fn(() => {
      response.headersSent = true
      return response
    }),
  }
  return response as unknown as Response
}

function createRequest(): Request {
  return {
    method: 'POST',
    originalUrl: '/v2/channels/platforms/tiktok/webhooks',
  } as Request
}

function createService() {
  const handler = {
    handle: vi.fn(async (_request: Request, response: Response) => {
      response.status(200).send('ok')
    }),
  }
  const registry = {
    getWebhook: vi.fn(() => handler),
  }

  return {
    service: new PlatformsService(registry as never, {} as never, {} as never),
    handler,
    registry,
  }
}

function createOptionService() {
  const provider = {
    listSources: vi.fn(() => [{
      field: 'boardId',
      label: 'Board',
      valueType: PublishOptionValueType.List,
      requiresAccount: true,
      createSchema: z.object({
        name: z.string().min(1).describe('名称'),
      }),
    }]),
    getValues: vi.fn(),
    createValue: vi.fn(),
  }
  provider.createValue.mockImplementation(function (this: unknown) {
    expect(this).toBe(provider)
    return Promise.resolve({
      field: 'boardId',
      valueType: PublishOptionValueType.List,
      item: {
        value: 'board-id',
        label: 'Launch Board',
      },
    })
  })
  const registry = {
    getPublishOptions: vi.fn(() => provider),
  }
  const authService = {
    getValidCredential: vi.fn(async () => ({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    })),
    markAccountOfflineForCredentialFailure: vi.fn(async () => true),
  }
  const accountRepository = {
    getByIdAndUserId: vi.fn(async () => ({
      id: 'account-id',
      type: AccountType.Pinterest,
      uid: 'pinterest-user-id',
      account: 'pinterest_user',
    })),
  }

  return {
    service: new PlatformsService(registry as never, authService as never, accountRepository as never),
    provider,
    registry,
    authService,
    accountRepository,
  }
}

describe('platform webhook service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('dispatches raw request and response to platform handler', async () => {
    const { service, handler } = createService()
    const request = createRequest()
    const response = createResponse()

    await service.dispatchWebhook(AccountType.TikTok, request, response)

    expect(handler.handle).toHaveBeenCalledWith(request, response, { platform: AccountType.TikTok })
  })

  it('throws multilingual business error when platform webhook is not registered', async () => {
    const { service, registry } = createService()
    registry.getWebhook.mockReturnValue(undefined)

    await expect(service.dispatchWebhook(AccountType.Twitter, createRequest(), createResponse()))
      .rejects
      .toMatchObject<AppException>({ code: ResponseCode.ChannelWebhookNotSupported })
  })
})

describe('platform publish option service', () => {
  it('exposes publish option creation schemas in source metadata', () => {
    const { service } = createOptionService()

    const result = service.listSources(AccountType.Pinterest)

    expect(result[0]).toEqual(expect.objectContaining({
      field: 'boardId',
      createSchema: expect.objectContaining({
        type: 'object',
        properties: expect.objectContaining({
          name: expect.objectContaining({
            type: 'string',
          }),
        }),
      }),
    }))
  })

  it('creates account publish option values through the registered provider', async () => {
    const { service, provider, registry, authService, accountRepository } = createOptionService()

    const result = await service.createAccountValue('user-id', 'account-id', 'boardId', {
      name: 'Launch Board',
    })

    expect(accountRepository.getByIdAndUserId).toHaveBeenCalledWith('account-id', 'user-id')
    expect(registry.getPublishOptions).toHaveBeenCalledWith(AccountType.Pinterest)
    expect(authService.getValidCredential).toHaveBeenCalledWith('account-id', 'user-id')
    expect(provider.createValue).toHaveBeenCalledWith({
      userId: 'user-id',
      accountId: 'account-id',
      field: 'boardId',
      data: { name: 'Launch Board' },
      credential: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        platformUid: 'pinterest-user-id',
        account: 'pinterest_user',
      },
    })
    expect(result).toEqual({
      field: 'boardId',
      valueType: PublishOptionValueType.List,
      item: {
        value: 'board-id',
        label: 'Launch Board',
      },
    })
  })

  it('rejects unsupported publish option creation before loading credentials', async () => {
    const { service, provider, authService } = createOptionService()
    delete (provider as { createValue?: unknown }).createValue

    await expect(service.createAccountValue('user-id', 'account-id', 'boardId', {
      name: 'Launch Board',
    })).rejects.toMatchObject<AppException>({
      code: ResponseCode.ChannelPlatformOperationNotSupported,
    })

    expect(authService.getValidCredential).not.toHaveBeenCalled()
  })

  it('marks the account offline when publish option provider returns an auth failure', async () => {
    const { service, provider, authService } = createOptionService()
    const platformError = new ChannelPlatformException({
      code: ResponseCode.ChannelAccessTokenFailed,
      platform: AccountType.Pinterest,
      category: PlatformErrorCategory.Auth,
      retryable: false,
      cause: {
        type: PlatformErrorCauseType.Http,
        httpStatus: 401,
      },
    })
    provider.getValues.mockRejectedValue(platformError)

    await expect(service.getAccountValues('user-id', 'account-id', 'boardId'))
      .rejects
      .toBe(platformError)

    expect(authService.markAccountOfflineForCredentialFailure).toHaveBeenCalledWith(
      'account-id',
      platformError,
      'platform_auth_failed',
    )
  })
})
