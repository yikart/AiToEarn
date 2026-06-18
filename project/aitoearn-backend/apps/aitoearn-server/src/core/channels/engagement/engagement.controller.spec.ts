import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { ChannelEngagementActionType, ChannelEngagementFunctionName, ChannelEngagementTargetType, ChannelPaginationMode } from '../platforms/platforms.interface'
import { EngagementController } from './engagement.controller'

vi.mock('@yikart/mongodb', () => ({
  AccountRepository: class AccountRepository {},
}))

vi.mock('@yikart/channel-db', () => ({
  ChannelWorkDataSnapshotRepository: class ChannelWorkDataSnapshotRepository {},
}))

vi.mock('@yikart/aitoearn-auth', () => ({
  GetToken: () => () => undefined,
  TokenInfo: class TokenInfo {},
}))

vi.mock('./engagement.service', () => ({
  EngagementService: class EngagementService {},
}))

function createController() {
  const actionResult = {
    platform: AccountType.Twitter,
    actionType: ChannelEngagementActionType.Like,
    targetType: ChannelEngagementTargetType.Work,
    targetId: 'work-1',
    success: true,
  }
  const service = {
    listComments: vi.fn(async () => ({
      platform: AccountType.Twitter,
      items: [],
      pagination: { mode: ChannelPaginationMode.None },
    })),
    createComment: vi.fn(async () => actionResult),
    callFunction: vi.fn(async () => actionResult),
  }
  return {
    controller: new EngagementController(service as never),
    service,
  }
}

describe('engagementController', () => {
  it('keeps the REST comments list endpoint wired to engagement service', async () => {
    const { controller, service } = createController()

    await expect(controller.listComments(
      { id: 'user-1' } as never,
      {
        accountId: 'account-1',
        platform: AccountType.Twitter,
        platformWorkId: 'work-1',
        pagination: {},
      },
    )).resolves.toEqual({
      platform: AccountType.Twitter,
      items: [],
      pagination: { mode: ChannelPaginationMode.None },
    })

    expect(service.listComments).toHaveBeenCalledWith(
      'user-1',
      AccountType.Twitter,
      'work-1',
      'account-1',
      {},
    )
  })

  it('uses query accountId when creating comments', async () => {
    const { controller, service } = createController()
    const token = { id: 'user-1' } as never

    await controller.createComment(
      token,
      { accountId: 'account-1' },
      {
        platform: AccountType.Twitter,
        platformWorkId: 'work-1',
        content: 'hello',
        parentCommentId: 'comment-1',
      },
    )

    expect(service.createComment).toHaveBeenCalledWith(
      'user-1',
      'account-1',
      AccountType.Twitter,
      'work-1',
      'hello',
      'comment-1',
    )
  })

  it('routes engagement functions through the generic function endpoint', async () => {
    const { controller, service } = createController()
    const token = { id: 'user-1' } as never

    await controller.callFunction(
      token,
      { accountId: 'account-1' },
      {
        platform: AccountType.Twitter,
        name: ChannelEngagementFunctionName.Like,
        data: { platformWorkId: 'work-1' },
      },
    )

    expect(service.callFunction).toHaveBeenCalledWith(
      'user-1',
      'account-1',
      {
        platform: AccountType.Twitter,
        name: ChannelEngagementFunctionName.Like,
        data: { platformWorkId: 'work-1' },
      },
    )
  })
})
