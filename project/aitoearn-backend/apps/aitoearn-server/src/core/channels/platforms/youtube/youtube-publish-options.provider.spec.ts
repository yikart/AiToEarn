import { describe, expect, it, vi } from 'vitest'
import { PublishOptionValueType } from '../platforms.interface'
import { YoutubePublishOptionsProvider } from './youtube-publish-options.provider'

vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: vi.fn(),
    },
    youtube: vi.fn(),
  },
}))

vi.mock('@yikart/assets', () => ({
  AssetsService: class AssetsService {},
  VideoMetadataService: class VideoMetadataService {},
}))

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

describe('youtube publish options provider', () => {
  it('returns only categories assignable to videos', async () => {
    const youtubeService = {
      listVideoCategories: vi.fn().mockResolvedValue([
        {
          id: '18',
          snippet: {
            title: 'Short Movies',
            assignable: false,
          },
        },
        {
          id: '22',
          snippet: {
            title: 'People & Blogs',
            assignable: true,
            channelId: 'channel-1',
          },
        },
        {
          snippet: {
            title: 'Missing id',
            assignable: true,
          },
        },
      ]),
    }
    const provider = new YoutubePublishOptionsProvider(youtubeService as never)

    const result = await provider.getValues({
      userId: 'user-id',
      accountId: 'account-id',
      field: 'categoryId',
      filters: { regionCode: 'US' },
      credential: { accessToken: 'access-token' },
    })

    expect(youtubeService.listVideoCategories).toHaveBeenCalledWith('access-token', { regionCode: 'US' })
    expect(result).toEqual({
      field: 'categoryId',
      valueType: PublishOptionValueType.List,
      items: [{
        value: '22',
        label: 'People & Blogs',
        extra: {
          assignable: true,
          channelId: 'channel-1',
        },
      }],
    })
  })
})
