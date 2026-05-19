const {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
} = process.env

const {
  MONGODB_HOST,
  MONGODB_PORT,
  MONGODB_USERNAME,
  MONGODB_PASSWORD,
} = process.env

const {
  JWT_SECRET,
  INTERNAL_TOKEN,
} = process.env

const {
  FEISHU_WEBHOOK_URL,
  FEISHU_WEBHOOK_SECRET,
} = process.env

const {
  VOLCENGINE_API_KEY,
  VOLCENGINE_ACCESS_KEY_ID,
  VOLCENGINE_SECRET_ACCESS_KEY,
  VOLCENGINE_VOD_SPACE_NAME,
  VOLCENGINE_URL_AUTH_PRIMARY_KEY,
  OPENAI_API_KEY,
  OPENAI_BASE_URL,
  ANTHROPIC_BASE_URL,
  ANTHROPIC_API_KEY,
  GROK_API_KEY,
  GEMINI_API_KEY,
  GEMINI_BASE_URL,
  DASHSCOPE_API_KEY,
  DASHSCOPE_BASE_URL,
} = process.env

const {
  ASSETS_CONFIG,
} = process.env

const {
  GEMINI_KEY_PAIRS,
  GEMINI_LOCATION,
} = process.env

const {
  SERVER_URL,
} = process.env

const GPT_IMAGE_2_SIZES = [
  '1024x1024',
  '1536x1024',
  '1024x1536',
  '1408x1056',
  '1056x1408',
  '1360x1088',
  '1088x1360',
  '1536x864',
  '864x1536',
]

const GPT_IMAGE_2_ASPECT_RATIOS = ['1:1', '3:2', '2:3', '4:3', '3:4', '5:4', '4:5', '16:9', '9:16']

function parseGeminiKeyPairs() {
  if (!GEMINI_KEY_PAIRS) {
    throw new Error('GEMINI_KEY_PAIRS 环境变量必须配置')
  }

  try {
    return JSON.parse(GEMINI_KEY_PAIRS)
  }
  catch (e) {
    console.error('解析 GEMINI_KEY_PAIRS 失败:', e)
    throw new Error('GEMINI_KEY_PAIRS 格式错误')
  }
}

module.exports = {
  port: 3010,
  logger: {
    console: {
      enable: true,
      level: 'debug',
      pretty: false,
    },
    ...(FEISHU_WEBHOOK_URL
      ? {
          feishu: {
            enable: true,
            url: FEISHU_WEBHOOK_URL,
            secret: FEISHU_WEBHOOK_SECRET || '',
          },
        }
      : {}),
  },
  redis: {
    host: REDIS_HOST,
    port: Number(REDIS_PORT),
    username: 'default',
    password: REDIS_PASSWORD,
  },
  redlock: {
    redis: {
      host: REDIS_HOST,
      port: Number(REDIS_PORT),
      username: 'default',
      password: REDIS_PASSWORD,
    },
  },
  mongodb: {
    uri: `mongodb://${MONGODB_USERNAME}:${encodeURIComponent(MONGODB_PASSWORD)}@${MONGODB_HOST}:${MONGODB_PORT}/?authSource=admin&directConnection=true`,
    dbName: 'aitoearn',
  },
  auth: {
    secret: JWT_SECRET,
    expiresIn: 7 * 24 * 60 * 60,
    internalToken: INTERNAL_TOKEN,
  },
  serverClient: {
    baseUrl: SERVER_URL,
    token: INTERNAL_TOKEN,
  },
  assets: JSON.parse(ASSETS_CONFIG),
  ai: {
    volcengine: {
      baseUrl: 'https://ark.cn-beijing.volces.com/',
      apiKey: VOLCENGINE_API_KEY,
      accessKeyId: VOLCENGINE_ACCESS_KEY_ID,
      secretAccessKey: VOLCENGINE_SECRET_ACCESS_KEY,
      spaceName: VOLCENGINE_VOD_SPACE_NAME,
      playbackBaseUrl: 'http://vod.assets.aitoearn.ai',
      urlAuthPrimaryKey: VOLCENGINE_URL_AUTH_PRIMARY_KEY || '',
    },
    openai: {
      baseUrl: OPENAI_BASE_URL,
      apiKey: OPENAI_API_KEY,
    },
    grok: {
      baseUrl: 'https://api.x.ai',
      apiKey: GROK_API_KEY,
    },
    anthropic: {
      baseUrl: ANTHROPIC_BASE_URL,
      apiKey: ANTHROPIC_API_KEY,
    },
    gemini: {
      keyPairs: parseGeminiKeyPairs(),
      location: GEMINI_LOCATION || 'us-central1',
      apiKey: GEMINI_API_KEY,
      baseUrl: GEMINI_BASE_URL,
    },
    dashscope: {
      apiKey: DASHSCOPE_API_KEY || '',
      ...(DASHSCOPE_BASE_URL && { baseUrl: DASHSCOPE_BASE_URL }),
    },
    aideo: {
      vCreative: {
        basePrice: 0.1, // AI editing base price (cents/minute, 720P)
      },
      vision: {
        basePrice: 1.5, // Video understanding base price (cents/minute)
      },
      highlight: {
        basePrice: 15, // Highlight smart editing base price (cents/minute)
      },
      aiTranslation: {
        facialTranslation: 100, // Facial translation price (cents/minute) - the only supported translation type
      },
      erase: {
        basePrice: 15, // AI subtitle removal base price (cents/minute)
      },
      videoEdit: {
        basePrice: 0.1, // Video editing base price (cents/minute, 720P)
      },
      dramaRecap: {
        basePrice: 200, // Drama recap base price (cents/minute)
      },
      styleTransfer: {
        basePrice: 750, // Video style transfer base price (cents/minute)
      },
    },
    models: {
      chat: [
        {
          name: 'gemini-3.1-pro-preview',
          description: 'Gemini 3.1 Pro Preview',
          channel: 'gemini',
          scenes: ['web', 'comment', 'draft-generation'],
          inputModalities: ['text', 'image', 'audio', 'video'],
          outputModalities: ['text'],
          pricing: {
            tiers: [
              {
                maxInputTokens: 200000,
                input: { text: '0.2', image: '0.2', video: '0.2', audio: '0.7' },
                output: { text: '1.2' },
              },
              {
                input: { text: '0.4', image: '0.4', video: '0.4', audio: '1.05' },
                output: { text: '1.8' },
              },
            ],
          },
        },
        {
          name: 'gemini-3-flash-preview',
          description: 'Gemini 3 Flash Preview',
          channel: 'gemini',
          scenes: ['web', 'comment', 'draft-generation'],
          inputModalities: ['text', 'image', 'audio', 'video'],
          outputModalities: ['text'],
          pricing: {
            tiers: [
              {
                input: { text: '0.05', image: '0.05', video: '0.05', audio: '0.1' },
                output: { text: '0.3' },
              },
            ],
          },
        },
        {
          name: 'gemini-3.1-flash-image-preview',
          description: 'Nano Banana 2',
          tags: [{ 'en-US': 'Sale', 'zh-CN': '限时' }],
          channel: 'gemini',
          scenes: ['web'],
          inputModalities: ['text', 'image'],
          outputModalities: ['image'],
          fixedImagePricing: [
            { resolution: '1K', price: 4 },
            { resolution: '2K', price: 4 },
            { resolution: '4K', price: 7 },
          ],
          pricing: {
            tiers: [
              {
                input: { text: '0', image: '0' },
                output: { text: '0', image: '6' },
              },
            ],
          },
        },
        {
          name: 'gemini-3-pro-image-preview',
          description: 'Nano Banana Pro',
          channel: 'gemini',
          scenes: ['web'],
          inputModalities: ['text', 'image'],
          outputModalities: ['image'],
          pricing: {
            tiers: [
              {
                input: { text: '0', image: '0' },
                output: { text: '0', image: '12' },
              },
            ],
          },
        },
        {
          name: 'claude-opus-4-6',
          description: 'Claude Opus 4.6',
          channel: 'anthropic',
          scenes: ['web'],
          inputModalities: ['text', 'image'],
          outputModalities: ['text'],
          pricing: {
            tiers: [
              {
                input: { text: '0.5', image: '0.5' },
                output: { text: '2.5' },
              },
            ],
          },
        },
        {
          name: 'claude-sonnet-4-6',
          description: 'Claude Sonnet 4.6',
          channel: 'anthropic',
          scenes: ['web'],
          inputModalities: ['text', 'image'],
          outputModalities: ['text'],
          pricing: {
            tiers: [
              {
                input: { text: '0.3', image: '0.3' },
                output: { text: '1.5' },
              },
            ],
          },
        },
        {
          name: 'gpt-5.4',
          description: 'GPT 5.4',
          channel: 'openai',
          scenes: ['plugin', 'comment'],
          inputModalities: ['text', 'image'],
          outputModalities: ['text'],
          pricing: {
            tiers: [
              {
                input: { text: '0.075' },
                output: { text: '0.45' },
              },
            ],
          },
        },
        {
          name: 'gpt-5.5',
          description: 'GPT 5.5',
          channel: 'openai',
          scenes: ['web', 'plugin', 'comment', 'draft-generation'],
          inputModalities: ['text', 'image'],
          outputModalities: ['text'],
          pricing: {
            tiers: [
              {
                input: { text: '0.075' },
                output: { text: '0.45' },
              },
            ],
          },
        },
        {
          name: 'gemini-2.5-flash',
          description: 'Gemini 2.5 Flash',
          channel: 'gemini',
          scenes: ['web'],
          inputModalities: ['text', 'image', 'audio', 'video'],
          outputModalities: ['text'],
          pricing: {
            tiers: [
              {
                input: { text: '0.03', image: '0.03', video: '0.03', audio: '0.1' },
                output: { text: '0.25' },
              },
            ],
          },
        },
      ],
      image: {
        generation: [
          {
            name: 'gpt-image-2',
            description: 'GPT Image 2',
            tags: [],
            sizes: GPT_IMAGE_2_SIZES,
            qualities: ['auto', 'high', 'medium', 'low'],
            styles: [],
            pricing: '0.1',
          },
          {
            name: 'gpt-image-2-fast',
            description: 'GPT Image 2 Fast',
            runtimeModel: 'gpt-image-2',
            tags: [],
            sizes: GPT_IMAGE_2_SIZES,
            qualities: ['auto', 'high', 'medium', 'low'],
            styles: [],
            pricing: '1',
          },
        ],
        edit: [
          {
            name: 'gpt-image-2',
            description: 'GPT Image 2',
            tags: [],
            sizes: GPT_IMAGE_2_SIZES,
            qualities: ['auto', 'high', 'medium', 'low'],
            styles: [],
            maxInputImages: 16,
            pricing: '0.1',
          },
          {
            name: 'gpt-image-2-fast',
            description: 'GPT Image 2 Fast',
            runtimeModel: 'gpt-image-2',
            tags: [],
            sizes: GPT_IMAGE_2_SIZES,
            qualities: ['auto', 'high', 'medium', 'low'],
            styles: [],
            maxInputImages: 16,
            pricing: '1',
          },
        ],
      },
      video: {
        generation: [
          {
            name: 'happyhorse-1.0',
            description: 'HappyHorse 1.0',
            channel: 'dashscope',
            modes: ['text2video', 'image2video', 'multi-image2video', 'video2video'],
            modeMappings: {
              'text2video': 'happyhorse-1.0-t2v',
              'image2video': 'happyhorse-1.0-i2v',
              'multi-image2video': 'happyhorse-1.0-r2v',
              'video2video': 'happyhorse-1.0-video-edit',
            },
            resolutions: ['720P', '1080P'],
            durations: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
            maxInputImages: 9,
            aspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4'],
            tags: [],
            defaults: {
              resolution: '720P',
              aspectRatio: '9:16',
              duration: 5,
            },
            pricing: [
              { resolution: '720P', duration: 3, price: 39 },
              { resolution: '720P', duration: 4, price: 52 },
              { resolution: '720P', duration: 5, price: 65 },
              { resolution: '720P', duration: 6, price: 78 },
              { resolution: '720P', duration: 7, price: 91 },
              { resolution: '720P', duration: 8, price: 104 },
              { resolution: '720P', duration: 9, price: 117 },
              { resolution: '720P', duration: 10, price: 130 },
              { resolution: '720P', duration: 11, price: 143 },
              { resolution: '720P', duration: 12, price: 156 },
              { resolution: '720P', duration: 13, price: 169 },
              { resolution: '720P', duration: 14, price: 182 },
              { resolution: '720P', duration: 15, price: 195 },
              { resolution: '1080P', duration: 3, price: 69 },
              { resolution: '1080P', duration: 4, price: 92 },
              { resolution: '1080P', duration: 5, price: 115 },
              { resolution: '1080P', duration: 6, price: 138 },
              { resolution: '1080P', duration: 7, price: 161 },
              { resolution: '1080P', duration: 8, price: 184 },
              { resolution: '1080P', duration: 9, price: 207 },
              { resolution: '1080P', duration: 10, price: 230 },
              { resolution: '1080P', duration: 11, price: 253 },
              { resolution: '1080P', duration: 12, price: 276 },
              { resolution: '1080P', duration: 13, price: 299 },
              { resolution: '1080P', duration: 14, price: 322 },
              { resolution: '1080P', duration: 15, price: 345 },

              { mode: 'video2video', resolution: '720P', duration: 3, price: 78 },
              { mode: 'video2video', resolution: '720P', duration: 4, price: 104 },
              { mode: 'video2video', resolution: '720P', duration: 5, price: 130 },
              { mode: 'video2video', resolution: '720P', duration: 6, price: 156 },
              { mode: 'video2video', resolution: '720P', duration: 7, price: 182 },
              { mode: 'video2video', resolution: '720P', duration: 8, price: 208 },
              { mode: 'video2video', resolution: '720P', duration: 9, price: 234 },
              { mode: 'video2video', resolution: '720P', duration: 10, price: 260 },
              { mode: 'video2video', resolution: '720P', duration: 11, price: 286 },
              { mode: 'video2video', resolution: '720P', duration: 12, price: 312 },
              { mode: 'video2video', resolution: '720P', duration: 13, price: 338 },
              { mode: 'video2video', resolution: '720P', duration: 14, price: 364 },
              { mode: 'video2video', resolution: '720P', duration: 15, price: 390 },
              { mode: 'video2video', resolution: '1080P', duration: 3, price: 138 },
              { mode: 'video2video', resolution: '1080P', duration: 4, price: 184 },
              { mode: 'video2video', resolution: '1080P', duration: 5, price: 230 },
              { mode: 'video2video', resolution: '1080P', duration: 6, price: 276 },
              { mode: 'video2video', resolution: '1080P', duration: 7, price: 322 },
              { mode: 'video2video', resolution: '1080P', duration: 8, price: 368 },
              { mode: 'video2video', resolution: '1080P', duration: 9, price: 414 },
              { mode: 'video2video', resolution: '1080P', duration: 10, price: 460 },
              { mode: 'video2video', resolution: '1080P', duration: 11, price: 506 },
              { mode: 'video2video', resolution: '1080P', duration: 12, price: 552 },
              { mode: 'video2video', resolution: '1080P', duration: 13, price: 598 },
              { mode: 'video2video', resolution: '1080P', duration: 14, price: 644 },
              { mode: 'video2video', resolution: '1080P', duration: 15, price: 690 },
            ],
          },
          {
            name: 'doubao-seedance-2-0-260128',
            description: 'Seedance 2.0',
            channel: 'volcengine',
            modes: ['text2video', 'image2video', 'flf2video', 'multi-image2video', 'video2video'],
            resolutions: ['720p'],
            durations: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
            maxInputImages: 9,
            aspectRatios: ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', 'adaptive'],
            tags: [],
            defaults: {
              resolution: '720p',
              aspectRatio: 'adaptive',
              duration: 5,
            },
            pricing: [
              { resolution: '720p', duration: 4, price: 60 },
              { resolution: '720p', duration: 5, price: 75 },
              { resolution: '720p', duration: 6, price: 90 },
              { resolution: '720p', duration: 7, price: 105 },
              { resolution: '720p', duration: 8, price: 120 },
              { resolution: '720p', duration: 9, price: 135 },
              { resolution: '720p', duration: 10, price: 150 },
              { resolution: '720p', duration: 11, price: 165 },
              { resolution: '720p', duration: 12, price: 180 },
              { resolution: '720p', duration: 13, price: 195 },
              { resolution: '720p', duration: 14, price: 210 },
              { resolution: '720p', duration: 15, price: 225 },
            ],
            settlement: {
              withoutVideo: '0.658',
              withVideo: '0.4',
            },
          },
          {
            name: 'doubao-seedance-2-0-fast-260128',
            description: 'Seedance 2.0 Fast',
            channel: 'volcengine',
            modes: ['text2video', 'image2video', 'flf2video', 'multi-image2video', 'video2video'],
            resolutions: ['720p'],
            durations: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
            maxInputImages: 9,
            aspectRatios: ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', 'adaptive'],
            tags: [],
            defaults: {
              resolution: '720p',
              aspectRatio: 'adaptive',
              duration: 5,
            },
            pricing: [
              { resolution: '720p', duration: 4, price: 48 },
              { resolution: '720p', duration: 5, price: 60 },
              { resolution: '720p', duration: 6, price: 72 },
              { resolution: '720p', duration: 7, price: 84 },
              { resolution: '720p', duration: 8, price: 96 },
              { resolution: '720p', duration: 9, price: 108 },
              { resolution: '720p', duration: 10, price: 120 },
              { resolution: '720p', duration: 11, price: 132 },
              { resolution: '720p', duration: 12, price: 144 },
              { resolution: '720p', duration: 13, price: 156 },
              { resolution: '720p', duration: 14, price: 168 },
              { resolution: '720p', duration: 15, price: 180 },
            ],
            settlement: {
              withoutVideo: '0.529',
              withVideo: '0.315',
            },
          },
          {
            name: 'grok-imagine-video',
            description: 'Grok Video',
            channel: 'grok',
            modes: ['text2video', 'image2video', 'multi-image2video', 'video2video'],
            resolutions: ['720p'],
            durations: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
            maxInputImages: 7,
            aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
            defaults: {
              duration: 8,
              aspectRatio: '9:16',
            },
            pricing: [
              { duration: 1, price: 8 },
              { duration: 2, price: 16 },
              { duration: 3, price: 24 },
              { duration: 4, price: 32 },
              { duration: 5, price: 40 },
              { duration: 6, price: 48 },
              { duration: 7, price: 56 },
              { duration: 8, price: 64 },
              { duration: 9, price: 72 },
              { duration: 10, price: 80 },
              { duration: 11, price: 88 },
              { duration: 12, price: 96 },
              { duration: 13, price: 104 },
              { duration: 14, price: 112 },
              { duration: 15, price: 120 },
              { mode: 'video2video', duration: 1, price: 8 },
              { mode: 'video2video', duration: 2, price: 16 },
              { mode: 'video2video', duration: 3, price: 24 },
              { mode: 'video2video', duration: 4, price: 32 },
              { mode: 'video2video', duration: 5, price: 40 },
              { mode: 'video2video', duration: 6, price: 48 },
              { mode: 'video2video', duration: 7, price: 56 },
              { mode: 'video2video', duration: 8, price: 64 },
            ],
          },
        ],
      },
    },
    draftGeneration: {
      planner: {
        defaultModel: 'gpt-5.5',
      },
      queue: {
        lowPriorityMinPriority: 1000,
        lowPriorityConcurrency: 2,
      },
      imageModels: [
        {
          model: 'gpt-image-2',
          displayName: 'GPT Image 2',
          runtimeModel: 'gpt-image-2',
          queuePriority: 1000,
          tags: [],
          supportedAspectRatios: GPT_IMAGE_2_ASPECT_RATIOS,
          maxInputImages: 16,
          pricing: [
            { resolution: '1K', pricePerImage: 0.1, originPrice: 21.1 },
          ],
        },
        {
          model: 'gpt-image-2-fast',
          displayName: 'GPT Image 2 Fast',
          runtimeModel: 'gpt-image-2',
          queuePriority: 1,
          tags: [],
          supportedAspectRatios: GPT_IMAGE_2_ASPECT_RATIOS,
          maxInputImages: 16,
          pricing: [
            { resolution: '1K', pricePerImage: 1, originPrice: 21.1 },
          ],
        },
      ],
    },
  },
  agent: {
    baseUrl: `${OPENAI_BASE_URL}/messages`,
    apiKey: OPENAI_API_KEY,
    analysis: {
      model: 'gemini-3.1-pro-preview',
      apiKey: OPENAI_API_KEY,
      baseUrl: OPENAI_BASE_URL.replace('/v1', ''),
    },
  },
}
