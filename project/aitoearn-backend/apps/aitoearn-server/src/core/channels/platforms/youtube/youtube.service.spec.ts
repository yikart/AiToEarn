import { ResponseCode } from '@yikart/common'
import { GaxiosError } from 'gaxios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlatformErrorCategory } from '../platforms.exception'
import { YoutubePrivacyStatus } from './youtube.schema'
import { YoutubeService } from './youtube.service'

const googleMocks = vi.hoisted(() => ({
  getToken: vi.fn(),
  setCredentials: vi.fn(),
  videoCategoriesList: vi.fn(),
  videosInsert: vi.fn(),
  videosList: vi.fn(),
  videosUpdate: vi.fn(),
}))

vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: class OAuth2 {
        generateAuthUrl = vi.fn()
        getToken = googleMocks.getToken
        setCredentials = googleMocks.setCredentials
      },
    },
    youtube: vi.fn(() => ({
      videoCategories: {
        list: googleMocks.videoCategoriesList,
      },
      videos: {
        insert: googleMocks.videosInsert,
        list: googleMocks.videosList,
        update: googleMocks.videosUpdate,
      },
    })),
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

function createGaxiosError(
  data: unknown,
  input: { url: string, method: string, status: number },
): GaxiosError {
  const config = {
    url: input.url,
    method: input.method,
  } as never
  const response = {
    data,
    status: input.status,
    config,
    bodyUsed: true,
  } as never

  return new GaxiosError('Request failed', config, response)
}

function createService(mediaService: unknown = {}): YoutubeService {
  return new YoutubeService({
    clientId: 'client-id',
    clientSecret: 'client-secret',
    redirectUri: 'https://api.example.test/youtube/callback',
  } as never, mediaService as never)
}

describe('youtube service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects OAuth token exchange responses without access_token', async () => {
    const service = createService()
    googleMocks.getToken.mockResolvedValue({
      tokens: {
        refresh_token: 'refresh-token',
      },
    })

    await expect(service.exchangeCode('code-1')).rejects.toMatchObject({
      code: ResponseCode.ChannelAccessTokenFailed,
    })
  })

  it('updates only writable video snippet fields', async () => {
    const service = createService()
    googleMocks.videosList.mockResolvedValue({
      data: {
        items: [{
          id: 'video-1',
          snippet: {
            title: 'old title',
            description: 'old description',
            tags: ['old'],
            categoryId: '22',
            publishedAt: '2026-06-01T00:00:00.000Z',
          },
          status: {
            privacyStatus: 'private',
          },
        }],
      },
    })

    await service.updateVideo('access-token', 'video-1', {
      title: 'new title',
    })

    expect(googleMocks.videosList).toHaveBeenCalledWith({
      part: ['snippet'],
      id: ['video-1'],
    })
    expect(googleMocks.videosUpdate).toHaveBeenCalledWith({
      part: ['snippet'],
      requestBody: {
        id: 'video-1',
        snippet: {
          title: 'new title',
          description: 'old description',
          tags: ['old'],
          categoryId: '22',
        },
      },
    })
  })

  it('updates status only when status fields are provided and preserves writable existing status', async () => {
    const service = createService()
    googleMocks.videosList.mockResolvedValue({
      data: {
        items: [{
          id: 'video-1',
          snippet: {
            title: 'old title',
            description: 'old description',
            categoryId: '22',
          },
          status: {
            privacyStatus: 'private',
            license: 'youtube',
            publicStatsViewable: false,
            selfDeclaredMadeForKids: true,
            uploadStatus: 'processed',
            failureReason: 'codec',
            rejectionReason: 'claim',
            madeForKids: false,
          },
        }],
      },
    })

    await service.updateVideo('access-token', 'video-1', {
      embeddable: false,
      containsSyntheticMedia: true,
    })

    expect(googleMocks.videosList).toHaveBeenCalledWith({
      part: ['snippet', 'status'],
      id: ['video-1'],
    })
    expect(googleMocks.videosUpdate).toHaveBeenCalledWith({
      part: ['snippet', 'status'],
      requestBody: {
        id: 'video-1',
        snippet: {
          title: 'old title',
          description: 'old description',
          tags: undefined,
          categoryId: '22',
        },
        status: {
          privacyStatus: 'private',
          license: 'youtube',
          publicStatsViewable: false,
          selfDeclaredMadeForKids: true,
          embeddable: false,
          containsSyntheticMedia: true,
        },
      },
    })
  })

  it('converts Gaxios video insert errors to YouTube platform exceptions', async () => {
    const service = createService({
      getStream: vi.fn(async () => 'video-stream'),
    })
    const data = {
      error: {
        code: 400,
        message: 'The <code>snippet.categoryId</code> property specifies an invalid category ID.',
        errors: [
          {
            reason: 'invalidCategoryId',
            location: 'body.snippet.categoryId',
            locationType: 'other',
          },
        ],
      },
    }
    googleMocks.videosInsert.mockRejectedValue(createGaxiosError(data, {
      url: 'https://www.googleapis.com/youtube/v3/videos',
      method: 'post',
      status: 400,
    }))

    await expect(service.uploadVideo('access-token', {
      title: 'Video title',
      privacyStatus: YoutubePrivacyStatus.Unlisted,
      videoUrl: 'https://cdn.example.com/video.mp4',
      categoryId: '18',
    })).rejects.toMatchObject({
      category: PlatformErrorCategory.Validation,
      retryable: false,
      platformCause: {
        platformCode: 'invalidCategoryId',
        platformMessage: '该 YouTube 分类不可用于发布，请重新选择分类',
        raw: data,
      },
    })
  })
})
