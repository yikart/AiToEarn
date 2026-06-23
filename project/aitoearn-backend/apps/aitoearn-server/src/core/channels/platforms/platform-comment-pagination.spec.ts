import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { FacebookEngagementProvider } from './facebook/facebook-engagement.provider'
import { InstagramEngagementProvider } from './instagram/instagram-engagement.provider'
import { LinkedInEngagementProvider } from './linkedin/linkedin-engagement.provider'
import { ChannelPaginationDirection, ChannelPaginationMode } from './platforms.interface'
import { ThreadsEngagementProvider } from './threads/threads-engagement.provider'

vi.mock('@yikart/mongodb', () => ({
  AssetType: {
    AiImage: 'aiImage',
    AiVideo: 'aiVideo',
    AiCard: 'aiCard',
    AiChatImage: 'aiChatImage',
    AideoOutput: 'aideoOutput',
    VideoEdit: 'videoEdit',
    DramaRecap: 'dramaRecap',
    StyleTransfer: 'styleTransfer',
    ImageEdit: 'imageEdit',
    Subtitle: 'subtitle',
    UserMedia: 'userMedia',
    UserFile: 'userFile',
    PublishMedia: 'publishMedia',
    Avatar: 'avatar',
    AgentSession: 'agentSession',
    VideoThumbnail: 'videoThumbnail',
    GooglePlace: 'googlePlace',
    Temp: 'temp',
  },
}))

vi.mock('./facebook/facebook.service', () => ({
  FacebookService: class FacebookService {},
}))

vi.mock('./instagram/instagram.service', () => ({
  InstagramService: class InstagramService {},
}))

vi.mock('./linkedin/linkedin.service', () => ({
  LinkedInService: class LinkedInService {},
}))

vi.mock('./threads/threads.service', () => ({
  ThreadsService: class ThreadsService {},
}))

const input = {
  accountId: 'account-1',
  platform: AccountType.Facebook,
  platformWorkId: 'work-1',
  credential: { accessToken: 'access-token' },
  pagination: {
    cursor: 'cursor-1',
    limit: 25,
    direction: ChannelPaginationDirection.Previous,
  },
}

describe('comment pagination providers', () => {
  it('passes previous Facebook comment cursor as before', async () => {
    const facebookService = {
      listComments: vi.fn(async () => ({
        data: [],
        paging: { cursors: { before: 'cursor-0' }, previous: 'previous-url' },
      })),
    }
    const provider = new FacebookEngagementProvider(facebookService as never)

    await provider.listComments(input)

    expect(facebookService.listComments).toHaveBeenCalledWith(
      'access-token',
      'work-1',
      { before: 'cursor-1', limit: 25 },
    )
  })

  it('passes next Facebook comment cursor as after', async () => {
    const facebookService = {
      listComments: vi.fn(async () => ({
        data: [],
        paging: { cursors: { after: 'cursor-2' }, next: 'next-url' },
      })),
    }
    const provider = new FacebookEngagementProvider(facebookService as never)

    await provider.listComments({
      ...input,
      pagination: {
        ...input.pagination,
        direction: ChannelPaginationDirection.Next,
      },
    })

    expect(facebookService.listComments).toHaveBeenCalledWith(
      'access-token',
      'work-1',
      { after: 'cursor-1', limit: 25 },
    )
  })

  it('passes previous Instagram comment cursor as before', async () => {
    const instagramService = {
      listComments: vi.fn(async () => ({
        data: [],
        paging: { cursors: { before: 'cursor-0' }, previous: 'previous-url' },
      })),
    }
    const provider = new InstagramEngagementProvider(instagramService as never)

    await provider.listComments({
      ...input,
      platform: AccountType.Instagram,
    })

    expect(instagramService.listComments).toHaveBeenCalledWith(
      'access-token',
      'work-1',
      { before: 'cursor-1', limit: 25 },
    )
  })

  it('passes next Instagram comment cursor as after', async () => {
    const instagramService = {
      listComments: vi.fn(async () => ({
        data: [],
        paging: { cursors: { after: 'cursor-2' }, next: 'next-url' },
      })),
    }
    const provider = new InstagramEngagementProvider(instagramService as never)

    await provider.listComments({
      ...input,
      platform: AccountType.Instagram,
      pagination: {
        ...input.pagination,
        direction: ChannelPaginationDirection.Next,
      },
    })

    expect(instagramService.listComments).toHaveBeenCalledWith(
      'access-token',
      'work-1',
      { after: 'cursor-1', limit: 25 },
    )
  })

  it('passes previous Threads reply cursor as before', async () => {
    const threadsService = {
      listReplies: vi.fn(async () => ({
        data: [],
        paging: { cursors: { before: 'cursor-0' }, previous: 'previous-url' },
      })),
    }
    const provider = new ThreadsEngagementProvider(threadsService as never)

    await provider.listComments({
      ...input,
      platform: AccountType.Threads,
    })

    expect(threadsService.listReplies).toHaveBeenCalledWith(
      'work-1',
      'access-token',
      { before: 'cursor-1', limit: 25 },
    )
  })

  it('passes next Threads reply cursor as after', async () => {
    const threadsService = {
      listReplies: vi.fn(async () => ({
        data: [],
        paging: { cursors: { after: 'cursor-2' }, next: 'next-url' },
      })),
    }
    const provider = new ThreadsEngagementProvider(threadsService as never)

    await provider.listComments({
      ...input,
      platform: AccountType.Threads,
      pagination: {
        ...input.pagination,
        direction: ChannelPaginationDirection.Next,
      },
    })

    expect(threadsService.listReplies).toHaveBeenCalledWith(
      'work-1',
      'access-token',
      { after: 'cursor-1', limit: 25 },
    )
  })

  it('passes LinkedIn page pagination as start and count', async () => {
    const linkedinService = {
      listComments: vi.fn(async () => ({
        elements: [{ id: 'comment-1', message: { text: 'hello' } }],
        paging: { total: 25 },
      })),
    }
    const provider = new LinkedInEngagementProvider(linkedinService as never)

    await expect(provider.listComments({
      ...input,
      platform: AccountType.LinkedIn,
      pagination: {
        page: 3,
        pageSize: 10,
      },
    })).resolves.toMatchObject({
      pagination: {
        mode: ChannelPaginationMode.Page,
        page: 3,
        pageSize: 10,
        total: 25,
        hasNext: false,
        hasPrevious: true,
      },
    })

    expect(linkedinService.listComments).toHaveBeenCalledWith(
      'access-token',
      'work-1',
      { start: 20, count: 10 },
    )
  })
})
