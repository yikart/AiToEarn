import { Injectable } from '@nestjs/common'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import {
  PublishOptionCreateInput,
  PublishOptionCreateResult,
  PublishOptionSourceProvider,
  PublishOptionValuesInput,
  PublishOptionValuesResult,
  PublishOptionValueType,
} from '../platforms.interface'
import { PinterestBoardCreateSchema } from './pinterest.schema'
import { PinterestService } from './pinterest.service'

@Injectable()
export class PinterestPublishOptionsProvider implements PublishOptionSourceProvider {
  constructor(private readonly pinterestService: PinterestService) {}

  listSources() {
    return [{
      field: 'boardId',
      label: 'Board',
      description: 'Pinterest board used as the Pin publish target',
      valueType: PublishOptionValueType.List,
      requiresAccount: true,
      createSchema: PinterestBoardCreateSchema,
    }]
  }

  async getValues(input: PublishOptionValuesInput): Promise<PublishOptionValuesResult> {
    if (input.field !== 'boardId') {
      throw new AppException(ResponseCode.ChannelPlatformOperationNotSupported, {
        platform: AccountType.Pinterest,
        field: input.field,
      })
    }

    const boards = await this.pinterestService.listBoards(input.credential.accessToken)

    return {
      field: 'boardId',
      valueType: PublishOptionValueType.List,
      items: boards
        .filter(board => Boolean(board.id))
        .map(board => this.toItem(board)),
    }
  }

  async createValue(input: PublishOptionCreateInput): Promise<PublishOptionCreateResult> {
    if (input.field !== 'boardId') {
      throw new AppException(ResponseCode.ChannelPlatformOperationNotSupported, {
        platform: AccountType.Pinterest,
        field: input.field,
      })
    }

    const data = PinterestBoardCreateSchema.parse(input.data ?? {})
    const board = await this.pinterestService.createBoard(input.credential.accessToken, data)

    return {
      field: 'boardId',
      valueType: PublishOptionValueType.List,
      item: this.toItem(board),
    }
  }

  private toItem(board: { id: string, name: string, description?: string, privacy?: string }) {
    return {
      value: board.id,
      label: board.name,
      description: board.description,
      extra: { privacy: board.privacy },
    }
  }
}
