import { createZodDto, ZodErrorWithInput } from '@yikart/common'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { TwitterListResponseVo, TwitterTimelineResponseVo } from './twitter.vo'

describe('twitterVo schema', () => {
  it('timeline 返回保留 retweet 媒体来源和用户 withheld 字段', () => {
    const result = TwitterTimelineResponseVo.create({
      data: [
        {
          id: '2049359940838732153',
          referencedTweets: [
            {
              type: 'retweeted',
              id: '2048755861917773902',
            },
          ],
          publicMetrics: {
            retweetCount: 611,
            replyCount: 0,
            likeCount: 0,
            quoteCount: 0,
            bookmarkCount: 0,
            impressionCount: 0,
          },
          createdAt: '2026-04-29T05:27:39.000Z',
          attachments: {
            mediaKeys: ['13_2048738895211417600'],
            mediaSourceTweetId: ['2048755861917773902'],
          },
          editHistoryTweetIds: ['2049359940838732153'],
          conversationId: '2049359940838732153',
          text: 'RT @user: text https://t.co/CvvuxSYrj5',
          authorId: '428082154',
        },
      ],
      includes: {
        media: [
          {
            previewImageUrl: 'https://pbs.twimg.com/amplify_video_thumb/2048738895211417600/img/UcstrcATqYPFAkBv.jpg',
            mediaKey: '13_2048738895211417600',
            type: 'video',
            variants: [
              {
                bitRate: 832000,
                contentType: 'video/mp4',
                url: 'https://video.twimg.com/amplify_video/2048738895211417600/vid/avc1/640x360/VyPG3rwYNMvIdGtE.mp4',
              },
            ],
          },
        ],
        users: [
          {
            id: '428082154',
            verified: false,
            profileImageUrl: 'https://pbs.twimg.com/profile_images/1915071673788956672/9Q6sLAwK_normal.jpg',
            withheld: {
              countryCodes: ['ID'],
            },
            username: 'mmderichang',
            name: 'Test User',
          },
        ],
      },
      meta: {
        nextToken: 'next_1',
        resultCount: 1,
        newestId: '2049359940838732153',
        oldestId: '2049359940838732153',
      },
    })

    expect(result.data?.[0].attachments?.mediaSourceTweetId).toEqual(['2048755861917773902'])
    expect(result.includes?.users?.[0].withheld?.countryCodes).toEqual(['ID'])
  })

  it('timeline 返回保留 tweet media metadata 字段', () => {
    const result = TwitterTimelineResponseVo.create({
      data: [
        {
          id: 'tweet_1',
          text: 'post with media metadata',
          mediaMetadata: [
            {
              mediaKey: '3_1',
              type: 'photo',
              altText: 'image alt text',
              url: 'https://pbs.twimg.com/media/3_1.jpg',
              height: 720,
              width: 1280,
            },
          ],
        },
      ],
    })

    expect(result.data?.[0].mediaMetadata?.[0]).toEqual({
      mediaKey: '3_1',
      type: 'photo',
      altText: 'image alt text',
      url: 'https://pbs.twimg.com/media/3_1.jpg',
      height: 720,
      width: 1280,
    })
  })

  it('list response 返回保留列表指标字段', () => {
    const result = TwitterListResponseVo.create({
      data: [
        {
          id: 'list_1',
          name: 'AI Creators',
          description: 'curated list',
          followerCount: 12,
          memberCount: 5,
          ownerId: 'user_1',
          private: false,
          createdAt: '2026-04-30T00:00:00.000Z',
        },
      ],
    })

    expect(result.data?.[0]).toEqual({
      id: 'list_1',
      name: 'AI Creators',
      description: 'curated list',
      followerCount: 12,
      memberCount: 5,
      ownerId: 'user_1',
      private: false,
      createdAt: '2026-04-30T00:00:00.000Z',
    })
  })

  it('createZodDto 校验失败时抛出携带 input 的 ZodErrorWithInput', () => {
    const input = { value: 1 }
    const TestDto = createZodDto(z.object({
      value: z.string(),
    }))

    expect(() => TestDto.create(input as never)).toThrow(ZodErrorWithInput)

    try {
      TestDto.create(input as never)
    }
    catch (error) {
      expect(error).toBeInstanceOf(ZodErrorWithInput)
      expect((error as ZodErrorWithInput).input).toBe(input)
    }
  })
})
