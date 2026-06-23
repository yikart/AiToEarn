import type { PublishRecord } from '@yikart/mongodb'
import type { PublishRecordWorkLinkUpdateDto } from './publish-record.dto'
import { Injectable, Logger, Optional } from '@nestjs/common'
import { AccountType, AppException, ResponseCode, WorkStatus } from '@yikart/common'
import { AccountRepository, PublishRecordLinkStatus, PublishRecordRepository, PublishRecordSource, PublishStatus, PublishType } from '@yikart/mongodb'
import { parseDouyinDataOption } from '../../platforms/douyin/douyin.interface'
import { RelayAuthException } from '../../relay/relay-auth.exception'
import { RelayClientService } from '../../relay/relay-client.service'
import { WorkService } from '../../works/work.service'

interface WorkLinkInfoData {
  dataId?: string
  uniqueId?: string
  platformWorkId?: string
  resolvedUrl?: string
  originalWorkLink?: string | null
  workStatus?: WorkStatus | null
  type?: string
}

@Injectable()
export class PublishRecordReadService {
  private readonly logger = new Logger(PublishRecordReadService.name)

  constructor(
    private readonly publishRecordRepo: PublishRecordRepository,
    private readonly accountRepository: AccountRepository,
    private readonly workService: WorkService,
    @Optional() private readonly relayClientService?: RelayClientService,
  ) {}

  async listByFlowId(userId: string, flowId: string) {
    const localRecords = await this.publishRecordRepo.listByFlowIdAndUserId(flowId, userId)
    if (localRecords.length > 0) {
      return localRecords
    }
    return this.listRelayRecords(userId, '/v2/channels/publish/records', { flowId })
  }

  async getByFlowId(userId: string, flowId: string) {
    const records = await this.listByFlowId(userId, flowId)
    const record = records[0]
    if (!record) {
      throw new AppException(ResponseCode.PublishRecordNotFound)
    }
    return record
  }

  async listByUserId(userId: string, query?: {
    accountId?: string
    accountType?: AccountType
    flowId?: string
    source?: PublishRecordSource
    status?: PublishStatus
    type?: PublishType
    time?: [Date, Date]
    uid?: string
  }) {
    const localRecords = await this.publishRecordRepo.listByFilter({
      userId,
      ...query,
    })
    const relayRecords = await this.listRelayRecords(userId, '/v2/channels/publish/records', query)
    return [...localRecords, ...relayRecords]
  }

  async getDetail(id: string, userId: string) {
    const localRecord = await this.publishRecordRepo.getByIdAndUserId(id, userId)
    if (localRecord) {
      return localRecord
    }
    const relayRecord = await this.getRelayRecordDetail(id, userId)
    if (relayRecord) {
      return relayRecord
    }
    throw new AppException(ResponseCode.PublishRecordNotFound)
  }

  async getPublicDetail(id: string) {
    const localRecord = await this.publishRecordRepo.getById(id)
    if (localRecord) {
      return localRecord
    }

    if (this.relayClientService?.enabled) {
      throw new RelayAuthException()
    }

    throw new AppException(ResponseCode.PublishRecordNotFound)
  }

  async updateWorkLink(userId: string, id: string, data: PublishRecordWorkLinkUpdateDto) {
    const record = await this.publishRecordRepo.getByIdAndUserId(id, userId)
    if (!record) {
      throw new AppException(ResponseCode.PublishRecordNotFound)
    }
    if (!record.accountType) {
      throw new AppException(ResponseCode.PublishTaskInvalid)
    }

    const linkStatus = data.linkStatus || PublishRecordLinkStatus.READY
    if (linkStatus !== PublishRecordLinkStatus.READY) {
      const $set: Partial<PublishRecord> = {
        linkStatus,
        linkError: data.linkError || '',
      }
      if (data.dataId)
        $set.dataId = data.dataId
      if (data.platformWorkId)
        $set.platformWorkId = data.platformWorkId
      if (data.linkMeta !== undefined)
        $set.linkMeta = data.linkMeta
      const updated = await this.publishRecordRepo.updateById(id, {
        $set,
      })
      if (!updated) {
        throw new AppException(ResponseCode.PublishRecordNotFound)
      }
      return updated
    }

    if (!data.workLink) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }

    const workResult = await this.workService.getLinkInfo(
      userId,
      record.accountType,
      data.workLink,
      record.accountId,
      data.platformWorkId || data.dataId,
    )
    const workLinkInfo = this.toWorkLinkInfoData(workResult, data.platformWorkId || data.dataId)
    if (!workLinkInfo.dataId || !workLinkInfo.uniqueId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }

    const $set: Partial<PublishRecord> = {
      workLink: workLinkInfo.resolvedUrl || data.workLink,
      dataId: workLinkInfo.dataId,
      uniqueId: workLinkInfo.uniqueId,
      linkStatus,
      linkError: data.linkError || '',
    }
    if (data.platformWorkId)
      $set.platformWorkId = data.platformWorkId
    if (data.linkMeta !== undefined)
      $set.linkMeta = data.linkMeta
    if (Object.values(PublishType).includes(workLinkInfo.type as PublishType))
      $set.type = workLinkInfo.type as PublishType
    const $unset: Record<string, 1> = {}
    if (workLinkInfo.originalWorkLink)
      $set.originalWorkLink = workLinkInfo.originalWorkLink
    else
      $unset['originalWorkLink'] = 1
    if (workLinkInfo.workStatus)
      $set.workStatus = workLinkInfo.workStatus
    else
      $unset['workStatus'] = 1

    const update: { $set: Partial<PublishRecord>, $unset?: Record<string, 1> } = { $set }
    if (Object.keys($unset).length)
      update.$unset = $unset
    const updated = await this.publishRecordRepo.updateById(id, update)
    if (!updated) {
      throw new AppException(ResponseCode.PublishRecordNotFound)
    }
    return updated
  }

  async getUserAction(userId: string, id: string) {
    const record = await this.publishRecordRepo.getByIdAndUserId(id, userId)
    if (!record) {
      throw new AppException(ResponseCode.PublishRecordNotFound)
    }
    if (record.accountType !== AccountType.Douyin) {
      throw new AppException(ResponseCode.ChannelPublishPlatformNotSupported, { platform: record.accountType })
    }
    if (record.status !== PublishStatus.WaitingForUserAction) {
      throw new AppException(ResponseCode.PublishTaskStatusInvalid)
    }

    const dataOption = parseDouyinDataOption(record.dataOption)
    if (!dataOption?.shareId || !dataOption.schema || !dataOption.shortLink) {
      throw new AppException(ResponseCode.ChannelPlatformResponseInvalid, { platform: AccountType.Douyin })
    }

    return {
      recordId: record.id,
      platform: AccountType.Douyin,
      shareId: dataOption.shareId,
      schemeUrl: dataOption.schema,
      shortLink: dataOption.shortLink,
      expiresAt: dataOption.expiresAt ? new Date(dataOption.expiresAt) : undefined,
    }
  }

  private toWorkLinkInfoData(
    result: Awaited<ReturnType<WorkService['getLinkInfo']>>,
    fallbackDataId?: string,
  ): WorkLinkInfoData {
    const extra = result.extra as WorkLinkInfoData | undefined
    const dataId = extra?.dataId ?? extra?.platformWorkId ?? result.work?.id ?? fallbackDataId
    const rawWorkStatus = extra?.workStatus ?? result.work?.status
    const workStatus = Object.values(WorkStatus).includes(rawWorkStatus as WorkStatus)
      ? rawWorkStatus as WorkStatus
      : null
    return {
      dataId,
      uniqueId: extra?.uniqueId ?? (dataId ? `${result.platform}_${dataId}` : undefined),
      platformWorkId: extra?.platformWorkId,
      resolvedUrl: extra?.resolvedUrl ?? result.work?.url,
      originalWorkLink: extra?.originalWorkLink,
      workStatus,
      type: extra?.type ?? (result.work?.mediaType === 'video' ? PublishType.VIDEO : undefined),
    }
  }

  async deleteById(userId: string, id: string): Promise<void> {
    const record = await this.publishRecordRepo.getByIdAndUserId(id, userId)
    if (!record) {
      throw new AppException(ResponseCode.PublishRecordNotFound)
    }
    if (![
      PublishStatus.Published,
      PublishStatus.Failed,
      PublishStatus.Canceled,
      PublishStatus.UpdatedFailed,
    ].includes(record.status)) {
      throw new AppException(ResponseCode.PublishTaskStatusInvalid)
    }
    const deleted = await this.publishRecordRepo.deleteByIdAndUserId(id, userId)
    if (!deleted) {
      throw new AppException(ResponseCode.PublishRecordNotFound)
    }
  }

  async getByTaskId(userId: string, taskId: string) {
    const localRecord = await this.publishRecordRepo.getPublishRecordByTaskId(taskId, userId)
    if (localRecord) {
      return localRecord
    }
    const relayRecords = await this.listRelayRecords(userId, '/v2/channels/publish/records', { taskId })
    return relayRecords[0] ?? null
  }

  async listQueued(userId: string, query?: { accountId?: string, accountType?: AccountType, time?: [Date, Date] }) {
    const localRecords = await this.publishRecordRepo.listQueuedByFilter({ userId, ...query })
    const relayRecords = await this.listRelayRecords(userId, '/v2/channels/publish/records/queued', query)
    return [...localRecords, ...relayRecords]
  }

  async listPublished(userId: string, query?: { accountId?: string, accountType?: AccountType, time?: [Date, Date] }) {
    const localRecords = await this.publishRecordRepo.listPublishedByFilter({ userId, ...query })
    const relayRecords = await this.listRelayRecords(userId, '/v2/channels/publish/records/published', query)
    return [...localRecords, ...relayRecords]
  }

  private async listRelayRecords(
    userId: string,
    path: string,
    query?: {
      accountId?: string
      accountType?: AccountType
      flowId?: string
      source?: PublishRecordSource
      status?: PublishStatus
      type?: PublishType
      time?: [Date, Date]
      uid?: string
      taskId?: string
    },
  ): Promise<PublishRecord[]> {
    if (!this.relayClientService?.enabled) {
      return []
    }

    const relayAccounts = await this.getRelayAccountsForQuery(userId, query)
    if (relayAccounts.length === 0) {
      return []
    }

    const records: PublishRecord[] = []
    for (const account of relayAccounts) {
      if (!account.relayAccountRef) {
        continue
      }
      try {
        const relayRecords = await this.relayClientService.get<PublishRecord[]>(path, {
          ...query,
          accountId: account.relayAccountRef,
        })
        records.push(...relayRecords.map(record => this.withLocalRelayAccountId(record, account.id)))
      }
      catch (error) {
        this.logger.error(error, 'Fetch relay publish records failed')
      }
    }

    return records
  }

  private async getRelayRecordDetail(id: string, userId: string): Promise<PublishRecord | null> {
    if (!this.relayClientService?.enabled) {
      return null
    }

    try {
      const record = await this.relayClientService.get<PublishRecord | null>(`/v2/channels/publish/records/${id}`)
      if (!record?.accountId) {
        return null
      }
      const relayAccounts = await this.accountRepository.listRelayAccountsByUserId(userId)
      const account = relayAccounts.find(item => item.relayAccountRef === record.accountId)
      return account ? this.withLocalRelayAccountId(record, account.id) : null
    }
    catch (error) {
      this.logger.error(error, 'Fetch relay publish record detail failed')
      return null
    }
  }

  private async getRelayAccountsForQuery(
    userId: string,
    query?: { accountId?: string, accountType?: AccountType },
  ) {
    if (query?.accountId) {
      const account = await this.accountRepository.getByIdAndUserId(query.accountId, userId)
      return account?.relayAccountRef ? [account] : []
    }

    const accounts = await this.accountRepository.listRelayAccountsByUserId(userId)
    return query?.accountType
      ? accounts.filter(account => account.type === query.accountType)
      : accounts
  }

  private withLocalRelayAccountId(record: PublishRecord, localAccountId: string): PublishRecord {
    return {
      ...record,
      accountId: localAccountId,
    }
  }
}
