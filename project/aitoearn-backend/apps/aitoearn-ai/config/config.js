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
  VOLCENGINE_API_KEY,
  VOLCENGINE_ACCESS_KEY_ID,
  VOLCENGINE_SECRET_ACCESS_KEY,
  VOLCENGINE_VOD_SPACE_NAME,
  OPENAI_API_KEY,
  OPENAI_BASE_URL,
  ANTHROPIC_BASE_URL,
  ANTHROPIC_API_KEY,
  GROK_API_KEY,
  GEMINI_API_KEY,
  GEMINI_BASE_URL,
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
      urlAuthPrimaryKey: 'd8eea018341d4e9687ead69bea628271',
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
    aideo: {
      vCreative: {
        basePrice: 0,
      },
      vision: {
        basePrice: 0,
      },
      highlight: {
        basePrice: 0,
      },
      aiTranslation: {
        facialTranslation: 0,
      },
      erase: {
        basePrice: 0,
      },
      videoEdit: {
        basePrice: 0,
      },
      dramaRecap: {
        basePrice: 0,
      },
      styleTransfer: {
        basePrice: 0,
      },
    },
    models: {
      chat: [
        {
          name: 'gemini-3.1-pro-preview',
          description: 'Gemini 3.1 Pro Preview',
          inputModalities: ['text', 'image', 'audio', 'video'],
          outputModalities: ['text'],
          pricing: {
            tiers: [
              {
                maxInputTokens: 200000,
                input: { text: '0', image: '0', video: '0', audio: '0' },
                output: { text: '0' },
              },
              {
                input: { text: '0', image: '0', video: '0', audio: '0' },
                output: { text: '0' },
              },
            ],
          },
        },
        {
          name: 'gemini-3-flash-preview',
          description: 'Gemini 3 Flash Preview',
          inputModalities: ['text', 'image', 'audio', 'video'],
          outputModalities: ['text'],
          pricing: {
            tiers: [
              {
                input: { text: '0', image: '0', video: '0', audio: '0' },
                output: { text: '0' },
              },
            ],
          },
        },
        {
          name: 'gpt-5',
          description: 'GPT 5',
          inputModalities: ['text', 'image'],
          outputModalities: ['text'],
          pricing: {
            tiers: [
              {
                input: { text: '0', image: '0' },
                output: { text: '0' },
              },
            ],
          },
        },
        {
          name: 'gemini-3.1-flash-image-preview',
          description: 'Nano Banana 2',
          inputModalities: ['text', 'image'],
          outputModalities: ['image'],
          pricing: {
            tiers: [
              {
                input: { text: '0', image: '0' },
                output: { text: '0', image: '0' },
              },
            ],
          },
        },
        {
          name: 'gemini-3-pro-image-preview',
          description: 'Nano Banana Pro',
          inputModalities: ['text', 'image'],
          outputModalities: ['image'],
          pricing: {
            tiers: [
              {
                input: { text: '0', image: '0' },
                output: { text: '0', image: '0' },
              },
            ],
          },
        },
        {
          name: 'claude-opus-4-5-20251101',
          description: 'Claude Opus 4.5',
          inputModalities: ['text', 'image'],
          outputModalities: ['text'],
          pricing: {
            tiers: [
              {
                input: { text: '0', image: '0' },
                output: { text: '0' },
              },
            ],
          },
        },
        {
          name: 'claude-opus-4-6',
          description: 'Claude Opus 4.6',
          inputModalities: ['text', 'image'],
          outputModalities: ['text'],
          pricing: {
            tiers: [
              {
                input: { text: '0', image: '0' },
                output: { text: '0' },
              },
            ],
          },
        },
        {
          name: 'claude-sonnet-4-5-20250929',
          description: 'Claude Sonnet 4.5',
          inputModalities: ['text', 'image'],
          outputModalities: ['text'],
          pricing: {
            tiers: [
              {
                input: { text: '0', image: '0' },
                output: { text: '0' },
              },
            ],
          },
        },
      ],
      image: {
        generation: [
          {
            name: 'gpt-image-1.5',
            description: 'gpt-image-1.5',
            sizes: ['1024x1024', '1536x1024', '1024x1536', 'auto'],
            qualities: ['high', 'medium', 'low'],
            styles: [],
            pricing: '0',
          },
        ],
        edit: [
          {
            name: 'gpt-image-1.5',
            description: 'gpt-image-1.5',
            sizes: ['1024x1024', '1536x1024', '1024x1536', 'auto'],
            qualities: ['high', 'medium', 'low'],
            styles: [],
            pricing: '0',
            maxInputImages: 16,
          },
        ],
      },
      video: {
        generation: [
          {
            name: 'grok-imagine-video',
            description: 'Grok Video',
            channel: 'grok',
            modes: ['text2video', 'image2video', 'video2video'],
            resolutions: ['720p'],
            durations: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
            maxInputImages: 1,
            aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
            defaults: {
              duration: 8,
              aspectRatio: '9:16',
            },
            pricing: [
              { duration: 1, price: 0 },
              { duration: 2, price: 0 },
              { duration: 3, price: 0 },
              { duration: 4, price: 0 },
              { duration: 5, price: 0 },
              { duration: 6, price: 0 },
              { duration: 7, price: 0 },
              { duration: 8, price: 0 },
              { duration: 9, price: 0 },
              { duration: 10, price: 0 },
              { duration: 11, price: 0 },
              { duration: 12, price: 0 },
              { duration: 13, price: 0 },
              { duration: 14, price: 0 },
              { duration: 15, price: 0 },
              { mode: 'video2video', duration: 1, price: 0 },
              { mode: 'video2video', duration: 2, price: 0 },
              { mode: 'video2video', duration: 3, price: 0 },
              { mode: 'video2video', duration: 4, price: 0 },
              { mode: 'video2video', duration: 5, price: 0 },
              { mode: 'video2video', duration: 6, price: 0 },
              { mode: 'video2video', duration: 7, price: 0 },
              { mode: 'video2video', duration: 8, price: 0 },
            ],
          },
        ],
      },
    },
    draftGeneration: {
      imageModels: [
        {
          model: 'gemini-3.1-flash-image-preview',
          displayName: 'NanoBanana 2',
          supportedAspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9'],
          maxInputImages: 14,
          pricing: [
            { resolution: '1K', pricePerImage: 0 },
            { resolution: '2K', pricePerImage: 0 },
            { resolution: '4K', pricePerImage: 0 },
          ],
        },
        {
          model: 'gemini-3-pro-image-preview',
          displayName: 'NanoBanana Pro',
          supportedAspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9'],
          maxInputImages: 14,
          pricing: [
            { resolution: '1K', pricePerImage: 0 },
            { resolution: '2K', pricePerImage: 0 },
            { resolution: '4K', pricePerImage: 0 },
          ],
        },
      ],
    },
  },
  agent: {
    baseUrl: `${OPENAI_BASE_URL}/messages`,
    apiKey: OPENAI_API_KEY,
  },
}
