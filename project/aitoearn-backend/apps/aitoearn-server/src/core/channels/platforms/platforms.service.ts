import type { AccountType } from '@yikart/common'
import type { Request, Response } from 'express'
import type {
  PublishOptionCreateResult,
  PublishOptionFilters,
  PublishOptionJsonSchemaView,
  PublishOptionSource,
  PublishOptionValuesResult,
} from './platforms.interface'
import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode, zodToJsonSchemaOptions } from '@yikart/common'
import { AccountRepository } from '@yikart/mongodb'
import { z } from 'zod'
import { RelayAccountException } from '../../relay/relay-account.exception'
import { AuthService } from '../auth/auth.service'
import { ChannelPlatformException, PlatformErrorCategory, PlatformErrorCauseType } from './platforms.exception'
import { PlatformIntegrationRegistry } from './platforms.registry'

@Injectable()
export class PlatformsService {
  private readonly logger = new Logger(PlatformsService.name)

  constructor(
    private readonly registry: PlatformIntegrationRegistry,
    private readonly authService: AuthService,
    private readonly accountRepository: AccountRepository,
  ) {}

  listSources(platform: AccountType) {
    const provider = this.registry.getPublishOptions(platform)
    return (provider?.listSources() ?? []).map(source => this.toSourceView(source))
  }

  async getAccountValues(
    userId: string,
    accountId: string,
    field: string,
    filters?: object,
  ): Promise<PublishOptionValuesResult> {
    const { account, provider, source } = await this.getAccountOptionContext(userId, accountId, field)

    const parsedFilters = source.filterSchema
      ? source.filterSchema.parse(filters ?? {}) as PublishOptionFilters
      : filters as PublishOptionFilters | undefined
    const credential = await this.authService.getValidCredential(accountId, userId)
    return this.callAccountProvider(accountId, () => provider.getValues({
      userId,
      accountId,
      field,
      filters: parsedFilters,
      credential: {
        accessToken: credential.accessToken,
        refreshToken: credential.refreshToken,
        platformUid: account.uid,
        account: account.account,
      },
    }))
  }

  async createAccountValue(
    userId: string,
    accountId: string,
    field: string,
    data?: object,
  ): Promise<PublishOptionCreateResult> {
    const { account, provider, source } = await this.getAccountOptionContext(userId, accountId, field)
    if (!provider.createValue || !source.createSchema) {
      throw new AppException(ResponseCode.ChannelPlatformOperationNotSupported, {
        platform: account.type,
        field,
      })
    }

    const parsedData = source.createSchema.parse(data ?? {}) as Record<string, unknown>
    const credential = await this.authService.getValidCredential(accountId, userId)
    return this.callAccountProvider(accountId, () => provider.createValue!({
      userId,
      accountId,
      field,
      data: parsedData,
      credential: {
        accessToken: credential.accessToken,
        refreshToken: credential.refreshToken,
        platformUid: account.uid,
        account: account.account,
      },
    }))
  }

  async dispatchWebhook(platform: AccountType, request: Request, response: Response): Promise<void> {
    const handler = this.registry.getWebhook(platform)
    if (!handler) {
      this.logger.warn({
        platform,
        method: request.method,
        url: request.originalUrl,
      }, 'Webhook is not supported by platform')
      throw new AppException(ResponseCode.ChannelWebhookNotSupported, { platform })
    }

    this.logger.log({
      platform,
      method: request.method,
      url: request.originalUrl,
    }, 'Dispatching platform webhook')
    await handler.handle(request, response, { platform })
    if (!response.headersSent) {
      const exception = new ChannelPlatformException({
        code: ResponseCode.ChannelWebhookPublishFailed,
        platform,
        category: PlatformErrorCategory.WebhookInvalid,
        context: {
          method: request.method,
          endpoint: request.originalUrl,
        },
        cause: {
          type: PlatformErrorCauseType.Unknown,
          platformMessage: 'Platform webhook handler completed without response',
        },
      })
      try {
        response.status(204).send()
        this.logger.fatal(exception, 'Platform webhook fallback response sent')
      }
      catch (err) {
        this.logger.fatal(err, 'Failed to send platform webhook fallback response')
        throw err
      }
    }
  }

  private toSourceView(source: PublishOptionSource) {
    return {
      field: source.field,
      label: source.label,
      description: source.description,
      valueType: source.valueType,
      requiresAccount: source.requiresAccount,
      filterSchema: source.filterSchema
        ? z.toJSONSchema(source.filterSchema, { ...zodToJsonSchemaOptions, io: 'input' }) as PublishOptionJsonSchemaView
        : undefined,
      createSchema: source.createSchema
        ? z.toJSONSchema(source.createSchema, { ...zodToJsonSchemaOptions, io: 'input' }) as PublishOptionJsonSchemaView
        : undefined,
    }
  }

  private async getAccountOptionContext(userId: string, accountId: string, field: string) {
    const account = await this.accountRepository.getByIdAndUserId(accountId, userId)
    if (!account) {
      throw new AppException(ResponseCode.AccountNotFound)
    }
    if (account.relayAccountRef) {
      throw new RelayAccountException(account.relayAccountRef, accountId)
    }

    const provider = this.registry.getPublishOptions(account.type)
    if (!provider) {
      throw new AppException(ResponseCode.ChannelPlatformOperationNotSupported, {
        platform: account.type,
        field,
      })
    }

    const source = provider.listSources().find(item => item.field === field)
    if (!source) {
      throw new AppException(ResponseCode.ChannelPlatformOperationNotSupported, {
        platform: account.type,
        field,
      })
    }

    return { account, provider, source }
  }

  private async callAccountProvider<T>(accountId: string, action: () => Promise<T>): Promise<T> {
    try {
      return await action()
    }
    catch (error) {
      await this.authService.markAccountOfflineForCredentialFailure(accountId, error, 'platform_auth_failed')
      throw error
    }
  }
}
