import { ResponseCode } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { PublishOptionValueType } from '../platforms.interface'
import { PinterestPublishOptionsProvider } from './pinterest-publish-options.provider'
import { PinterestBoardCreateSchema, PinterestBoardPrivacy } from './pinterest.schema'

describe('pinterest publish options provider', () => {
  it('returns account boards as boardId values', async () => {
    const pinterestService = {
      listBoards: vi.fn().mockResolvedValue([
        {
          id: 'board-id',
          name: 'Launch Ideas',
          description: 'Campaign board',
          privacy: 'PUBLIC',
        },
      ]),
    }
    const provider = new PinterestPublishOptionsProvider(pinterestService as never)

    const result = await provider.getValues({
      userId: 'user-id',
      accountId: 'account-id',
      field: 'boardId',
      credential: { accessToken: 'access-token' },
    })

    expect(pinterestService.listBoards).toHaveBeenCalledWith('access-token')
    expect(result).toEqual({
      field: 'boardId',
      valueType: PublishOptionValueType.List,
      items: [{
        value: 'board-id',
        label: 'Launch Ideas',
        description: 'Campaign board',
        extra: { privacy: 'PUBLIC' },
      }],
    })
  })

  it('exposes board creation schema for boardId', () => {
    const provider = new PinterestPublishOptionsProvider({} as never)

    expect(provider.listSources()).toEqual([{
      field: 'boardId',
      label: 'Board',
      description: 'Pinterest board used as the Pin publish target',
      valueType: PublishOptionValueType.List,
      requiresAccount: true,
      createSchema: PinterestBoardCreateSchema,
    }])
  })

  it('creates a board as a boardId value', async () => {
    const pinterestService = {
      createBoard: vi.fn().mockResolvedValue({
        id: 'new-board-id',
        name: 'Launch Board',
        description: 'Campaign board',
        privacy: PinterestBoardPrivacy.Secret,
      }),
    }
    const provider = new PinterestPublishOptionsProvider(pinterestService as never)

    const result = await provider.createValue({
      userId: 'user-id',
      accountId: 'account-id',
      field: 'boardId',
      data: {
        name: 'Launch Board',
        description: 'Campaign board',
        privacy: PinterestBoardPrivacy.Secret,
      },
      credential: { accessToken: 'access-token' },
    })

    expect(pinterestService.createBoard).toHaveBeenCalledWith('access-token', {
      name: 'Launch Board',
      description: 'Campaign board',
      privacy: PinterestBoardPrivacy.Secret,
    })
    expect(result).toEqual({
      field: 'boardId',
      valueType: PublishOptionValueType.List,
      item: {
        value: 'new-board-id',
        label: 'Launch Board',
        description: 'Campaign board',
        extra: { privacy: PinterestBoardPrivacy.Secret },
      },
    })
  })

  it('rejects unsupported fields when creating option values', async () => {
    const provider = new PinterestPublishOptionsProvider({} as never)

    await expect(provider.createValue({
      userId: 'user-id',
      accountId: 'account-id',
      field: 'unknown',
      data: { name: 'Launch Board' },
      credential: { accessToken: 'access-token' },
    })).rejects.toMatchObject({ code: ResponseCode.ChannelPlatformOperationNotSupported })
  })
})
