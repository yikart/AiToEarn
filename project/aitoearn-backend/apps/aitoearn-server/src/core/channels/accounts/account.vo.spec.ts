import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { ChannelAccountVo } from './account.vo'

vi.mock('@yikart/mongodb', () => ({
  AccountStatus: {
    NORMAL: 1,
    ABNORMAL: 0,
  },
  ClientType: {
    WEB: 'web',
    APP: 'app',
  },
}))

describe('channel account vo', () => {
  it('returns safe account table fields and strips credentials', () => {
    const vo = ChannelAccountVo.create({
      id: 'account-1',
      userId: 'user-1',
      type: AccountType.WeChatChannels,
      uid: 'finder-1',
      account: 'finder_account',
      avatar: 'https://assets.example.test/avatar.jpg',
      nickname: 'Finder',
      groupId: 'group-1',
      status: 1,
      fansCount: 100,
      followingCount: 5,
      readCount: 1000,
      likeCount: 20,
      collectCount: 3,
      forwardCount: 2,
      commentCount: 1,
      workCount: 6,
      income: 0,
      relayAccountRef: null,
      loginCookie: 'secret-cookie',
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      token: 'token',
    })

    expect(vo).toMatchObject({
      id: 'account-1',
      userId: 'user-1',
      fansCount: 100,
      followingCount: 5,
      forwardCount: 2,
      relayAccountRef: null,
    })
    expect(vo).not.toHaveProperty('loginCookie')
    expect(vo).not.toHaveProperty('access_token')
    expect(vo).not.toHaveProperty('refresh_token')
    expect(vo).not.toHaveProperty('token')
  })
})
