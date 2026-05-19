import { describe, expect, it, vi } from 'vitest'

enum MockPublishType {
  VIDEO = 'video',
  ARTICLE = 'article',
}

enum MockPublishStatus {
  FAILED = -1,
  WaitingForPublish = 0,
  PUBLISHED = 1,
  PUBLISHING = 2,
  WAITING_FOR_UPDATE = 3,
  UPDATING = 4,
  UPDATED_FAILED = 5,
}

enum MockPublishRecordLinkStatus {
  PENDING = 'pending',
  READY = 'ready',
  FAILED = 'failed',
}

enum MockPublishRecordSource {
  PUBLISH = 'publish',
}

vi.doMock('@yikart/mongodb', () => ({
  PublishType: MockPublishType,
  PublishStatus: MockPublishStatus,
  PublishRecordLinkStatus: MockPublishRecordLinkStatus,
  PublishRecordSource: MockPublishRecordSource,
}))

const { createPublishRecordSchema } = await import('./publish.dto')

describe('createPublishRecordSchema', () => {
  it('allows native published XHS records without platform option', () => {
    const result = createPublishRecordSchema.safeParse({
      flowId: 'ba762632-f2ad-4415-845c-4b20d15adc66',
      type: 'article',
      title: '虞书欣同款ubras吊带，好穿到想焊',
      desc: '救命！欣欣子代言ubras之后的每一套我都好心动！',
      accountId: 'xhs_6496f186000000002a03781b_web',
      accountType: 'xhs',
      coverUrl: 'https://assets.example.com/69a5882a0ae8abf6b443675f/ai/images/ai/images/gemini-3-pro-image-preview/202604/QeLlE8zOCvGGgoAgru9MV.jpg',
      imgUrlList: [
        'https://assets.example.com/69a5882a0ae8abf6b443675f/ai/images/ai/images/gemini-3-pro-image-preview/202604/QeLlE8zOCvGGgoAgru9MV.jpg',
        'https://assets.example.com/69a5882a0ae8abf6b443675f/ai/images/ai/images/gemini-3-pro-image-preview/202604/N7GVScq4nIzjoGddMvNzf.jpg',
      ],
      topics: ['ubras代言人虞书欣', '同款', '搭搭bra', 'OOTD', '夏日穿搭'],
      status: 1,
      dataId: '69fb0a57000000002202516a',
      workLink: 'https://www.xiaohongshu.com/explore/69fb0a57000000002202516a?xsec_token=YBIpq_Ml4NBIpStguWTXncg8Z6PkTzuEUQASvd31BdPsM=&xsec_source=pc_creatormng',
      uid: '6496f186000000002a03781b',
      publishTime: '2026-05-06T09:31:03Z',
    })

    expect(result.success).toBe(true)
  })
})
