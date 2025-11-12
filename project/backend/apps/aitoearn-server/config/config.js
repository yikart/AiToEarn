const os = require('node:os')

const {
  REDIS_HOST,
  REDIS_PORT,
} = process.env

const {
  MONGODB_HOST,
  MONGODB_PORT,
  MONGODB_USERNAME,
  MONGODB_PASSWORD,
} = process.env

const {
  STATISTICS_DB_HOST,
  STATISTICS_DB_PORT,
  STATISTICS_DB_USERNAME,
  STATISTICS_DB_PASSWORD,
} = process.env

const {
  CHANNEL_URL,
  TASK_URL,
  PAYMENT_URL,
} = process.env

const {
  JWT_SECRET,
} = process.env

const {
  APP_ENV,
  APP_NAME,
  NODE_ENV,
} = process.env

const {
  FEISHU_WEBHOOK_URL,
  FEISHU_WEBHOOK_SECRET,
} = process.env

const {
  MAIL_USER,
  MAIL_PASS,
} = process.env

const {
  KLING_ACCESS_KEY,
  KLING_BASE_URL,
  VOLCENGINE_API_KEY,
  OPENAI_API_KEY,
  OPENAI_BASE_URL,
  DASHSCOPE_API_KEY,
  DASHSCOPE_BASE_URL,
  SORA2_API_KEY,
  SORA2_BASE_URL,
  MD2CARD_API_KEY,
} = process.env

const {
  ALI_GREEN_ACCESS_KEY_ID,
  ALI_GREEN_ACCESS_KEY_SECRET,
} = process.env

const {
  INTERNAL_TOKEN,
} = process.env

module.exports = {
  port: 3002,
  environment: NODE_ENV,
  logger: {
    console: {
      enable: false,
      level: 'debug',
    },
    cloudWatch: {
      enable: true,
      region: 'ap-southeast-1',
      group: `aitoearn-apps/${APP_ENV}/${APP_NAME}`,
      stream: `${os.hostname()}`,
    },
    feishu: {
      enable: true,
      url: FEISHU_WEBHOOK_URL,
      secret: FEISHU_WEBHOOK_SECRET,
    },
  },
  enableBadRequestDetails: true,
  redis: {
    host: REDIS_HOST,
    port: Number(REDIS_PORT),
    db: 1,
  },
  mail: {
    transport: {
      host: 'smtp.feishu.cn',
      port: 587,
      secure: false,
      auth: {
        user: MAIL_USER,
        pass: MAIL_PASS,
      },
    },
    defaults: {
      from: 'hello@aiearn.ai',
    },
  },
  redlock: {
    redis: {
      host: REDIS_HOST,
      port: Number(REDIS_PORT),
      db: 1,
    },
  },
  mongodb: {
    uri: `mongodb://${MONGODB_USERNAME}:${encodeURIComponent(MONGODB_PASSWORD)}@${MONGODB_HOST}:${MONGODB_PORT}/?tls=true&tlsCAFile=global-bundle.pem&retryWrites=false`,
    dbName: 'aitoearn',
  },
  ai: {
    fireflycard: {
      apiUrl: 'https://fireflycard-api.302ai.cn/api/saveImg',
    },
    md2card: {
      baseUrl: 'https://md2card.cn',
      apiKey: MD2CARD_API_KEY,
    },
    kling: {
      baseUrl: KLING_BASE_URL,
      accessKey: KLING_ACCESS_KEY,
    },
    volcengine: {
      baseUrl: 'https://ark.cn-beijing.volces.com/',
      apiKey: VOLCENGINE_API_KEY,
    },
    openai: {
      baseUrl: OPENAI_BASE_URL,
      apiKey: OPENAI_API_KEY,
    },
    dashscope: {
      baseUrl: DASHSCOPE_BASE_URL,
      apiKey: DASHSCOPE_API_KEY,
    },
    sora2: {
      baseUrl: SORA2_BASE_URL,
      apiKey: SORA2_API_KEY,
    },
    models: {
      chat: [
        {
          name: 'gpt-5',
          description: 'GPT 5',
          inputModalities: ['text', 'image'],
          outputModalities: ['text'],
          pricing: {
            prompt: '0.083',
            completion: '0.666',
          },
        },
        {
          name: 'gpt-5-mini',
          description: 'GPT 5 Mini',
          inputModalities: ['text', 'image'],
          outputModalities: ['text'],
          pricing: {
            prompt: '0.016',
            completion: '0.133',
          },
        },
        {
          name: 'gpt-5-nano',
          description: 'GPT 5 Nano',
          inputModalities: ['text', 'image'],
          outputModalities: ['text'],
          pricing: {
            prompt: '0.003',
            completion: '0.026',
          },
        },
        {
          name: 'chatgpt-4o-latest',
          description: 'ChatGPT 4o',
          inputModalities: ['text', 'image'],
          outputModalities: ['text'],
          pricing: {
            prompt: '0.333',
            completion: '1',
          },
        },
        // {
        //   name: 'gemini-3.0-pro',
        //   description: 'Gemini 3.0 Pro',
        //   inputModalities: ['text', 'image', 'audio', 'video'],
        //   outputModalities: ['text'],
        //   pricing: {
        //     prompt: '0.083',
        //     completion: '0.666',
        //   },
        // },
        {
          name: 'gemini-2.5-pro',
          description: 'Gemini 2.5 Pro',
          inputModalities: ['text', 'image', 'audio', 'video'],
          outputModalities: ['text'],
          pricing: {
            prompt: '0.083',
            completion: '0.666',
          },
        },
        {
          name: 'gemini-2.5-flash',
          description: 'Gemini 2.5 Flash',
          inputModalities: ['text', 'image', 'audio', 'video'],
          outputModalities: ['text'],
          pricing: {
            prompt: '0.020',
            completion: '0.166',
          },
        },
        {
          name: 'gemini-2.5-flash-image',
          description: 'Nano Banana',
          tags: ['VIP Free'],
          inputModalities: ['text', 'image'],
          outputModalities: ['image'],
          pricing: {
            price: '2',
          },
          freeForVip: true,
        },
        {
          name: 'qwen-vl-max',
          description: 'Qwen-VL-Max',
          inputModalities: ['text', 'image', 'video'],
          outputModalities: ['text'],
          pricing: {
            prompt: '0.035',
            completion: '0.04',
          },
        },
      ],
      image: {
        generation: [
          {
            name: 'gpt-image-1',
            description: 'gpt-image-1',
            sizes: ['1024x1024', '1536x1024', '1024x1536', 'auto'],
            qualities: ['high', 'medium', 'low'],
            styles: [],
            pricing: '9',
          },
          {
            name: 'doubao-seedream-3-0-t2i-250415',
            description: 'Doubao SeedDream 3.0',
            sizes: ['1024x1024', '864x1152', '1152x864', '1280x720', '720x1280', '832x1248', '1248x832', '1512x648'],
            qualities: [],
            styles: [],
            pricing: '3',
          },
          {
            name: 'doubao-seedream-4-0-250828',
            description: 'Doubao SeedDream 4.0',
            sizes: ['1K', '2K', '3K', '2048x2048', '2304x1728', '1728x2304', '2560x1440', '1440x2560', '2496x1664', '1664x2496', '3024x1296'],
            qualities: [],
            styles: [],
            pricing: '1.5',
          },
          {
            name: 'flux-kontext-max',
            description: ' FLUX.1 Kontext [max]',
            sizes: ['1024x1024'],
            qualities: [],
            styles: [],
            pricing: '5',
          },
          {
            name: 'flux-kontext-pro',
            description: ' FLUX.1 Kontext [max]',
            sizes: ['1024x1024'],
            qualities: [],
            styles: [],
            pricing: '2.5',
          },
        ],
        edit: [
          {
            name: 'gpt-image-1',
            description: 'gpt-image-1',
            sizes: ['1024x1024', '1536x1024', '1024x1536', 'auto'],
            qualities: ['high', 'medium', 'low'],
            styles: [],
            pricing: '9',
            maxInputImages: 16,
          },
          {
            name: 'doubao-seededit-3-0-i2i-250628',
            description: 'Doubao SeedEdit 3.0',
            sizes: ['adaptive'],
            pricing: '3',
            maxInputImages: 1,
          },
          {
            name: 'doubao-seedream-4-0-250828',
            description: 'Doubao SeedDream 4.0',
            sizes: ['1K', '2K', '3K', '2048x2048', '2304x1728', '1728x2304', '2560x1440', '1440x2560', '2496x1664', '1664x2496', '3024x1296'],
            qualities: [],
            styles: [],
            pricing: '1.5',
            maxInputImages: 10,
          },
          {
            name: 'flux-kontext-max',
            description: ' FLUX.1 Kontext [max]',
            sizes: ['1024x1024'],
            qualities: [],
            styles: [],
            pricing: '5',
            maxInputImages: 1,
          },
          {
            name: 'flux-kontext-pro',
            description: ' FLUX.1 Kontext [max]',
            sizes: ['1024x1024'],
            qualities: [],
            styles: [],
            pricing: '2.5',
            maxInputImages: 1,
          },
        ],
      },
      video: {
        generation: [
          {
            name: 'veo3.1-fast',
            description: 'Veo 3.1 Fast',
            tags: ['VIP Free'],
            channel: 'sora2',
            modes: ['text2video', 'multi-image2video'],
            resolutions: ['1280*720', '720*1280'],
            durations: [8],
            supportedParameters: ['image'],
            defaults: {
              resolution: '1280*720',
              duration: 8,
            },
            pricing: [
              {
                resolution: '1280*720',
                duration: 8,
                price: 63,
              },
              {
                resolution: '720*1280',
                duration: 8,
                price: 63,
              },
            ],
            freeForVip: true,
          },
          {
            name: 'veo3.1',
            description: 'Veo 3.1',
            channel: 'sora2',
            modes: ['text2video', 'multi-image2video'],
            resolutions: ['1280*720', '720*1280'],
            durations: [8],
            supportedParameters: ['image'],
            defaults: {
              resolution: '720*1280',
              duration: 8,
            },
            pricing: [
              {
                resolution: '1280*720',
                duration: 8,
                price: 168,
              },
              {
                resolution: '720*1280',
                duration: 8,
                price: 168,
              },
            ],
          },
          {
            name: 'sora-2',
            description: 'Sora2',
            tags: ['VIP Free'],
            channel: 'sora2',
            modes: ['text2video', 'multi-image2video'],
            resolutions: ['1280*720', '720*1280'],
            durations: [10],
            supportedParameters: ['image'],
            defaults: {
              resolution: '720*1280',
              duration: 10,
            },
            pricing: [
              {
                resolution: '720*1280',
                duration: 10,
                price: 52,
              },
              {
                resolution: '1280*720',
                duration: 10,
                price: 52,
              },
            ],
            freeForVip: true,
          },
          {
            name: 'sora-2-pro',
            description: 'Sora2 Pro',
            channel: 'sora2',
            modes: ['text2video', 'multi-image2video'],
            resolutions: ['1920*1080', '1080*1920'],
            durations: [10],
            supportedParameters: ['image'],
            defaults: {
              resolution: '1080*1920',
              duration: 10,
            },
            pricing: [
              {
                resolution: '1080*1920',
                duration: 10,
                price: 263,
              },
              {
                resolution: '1920*1080',
                duration: 10,
                price: 263,
              },
            ],
          },
          {
            name: 'doubao-seedance-1-0-pro-250528',
            description: 'Doubao-Seedance-Pro',
            channel: 'volcengine',
            modes: ['text2video', 'image2video'],
            resolutions: ['480p', '720p', '1080p'],
            durations: [5, 10],
            supportedParameters: ['image'],
            defaults: {
              resolution: '1080p',
              duration: 5,
            },
            pricing: [
              {
                resolution: '1080p',
                duration: 5,
                price: 36.7,
              },
              {
                resolution: '1080p',
                duration: 10,
                price: 73.4,
              },
              {
                resolution: '480p',
                duration: 5,
                price: 7.2,
              },
              {
                resolution: '480p',
                duration: 10,
                price: 14.4,
              },
              {
                resolution: '720p',
                duration: 5,
                price: 16.4,
              },
              {
                resolution: '720p',
                duration: 10,
                price: 32.8,
              },
            ],
          },
          {
            name: 'doubao-seedance-1-0-lite-i2v-250428',
            description: 'Doubao-Seedance-Lite',
            channel: 'volcengine',
            modes: ['image2video'],
            resolutions: ['480p', '720p', '1080p'],
            durations: [5, 10],
            supportedParameters: ['image', 'image_tail'],
            defaults: {
              resolution: '720p',
              duration: 5,
              aspectRatio: '16:9',
            },
            pricing: [
              {
                resolution: '1080p',
                duration: 5,
                price: 25,
              },
              {
                resolution: '1080p',
                duration: 10,
                price: 50,
              },
              {
                resolution: '480p',
                duration: 5,
                price: 5,
              },
              {
                resolution: '480p',
                duration: 10,
                price: 10,
              },
              {
                resolution: '720p',
                duration: 5,
                price: 11,
              },
              {
                resolution: '720p',
                duration: 10,
                price: 22,
              },
            ],
          },
          {
            name: 'doubao-seedance-1-0-lite-t2v-250428',
            description: 'Doubao-Seedance-Lite',
            channel: 'volcengine',
            modes: ['text2video'],
            resolutions: ['480p', '720p', '1080p'],
            durations: [5, 10],
            supportedParameters: [],
            defaults: {
              resolution: '720p',
              duration: 5,
              aspectRatio: '16:9',
            },
            pricing: [
              {
                resolution: '1080p',
                duration: 5,
                price: 25,
              },
              {
                resolution: '1080p',
                duration: 10,
                price: 50,
              },
              {
                resolution: '480p',
                duration: 5,
                price: 5,
              },
              {
                resolution: '480p',
                duration: 10,
                price: 10,
              },
              {
                resolution: '720p',
                duration: 5,
                price: 11,
              },
              {
                resolution: '720p',
                duration: 10,
                price: 22,
              },
            ],
          },
          {
            name: 'wanx2.1-t2v-turbo',
            description: 'Wan2.1 Turbo',
            channel: 'dashscope',
            modes: ['text2video'],
            resolutions: ['832*480', '480*832', '624*624', '1280*720', '720*1280', '960*960', '1088*832', '832*1088'],
            durations: [5],
            supportedParameters: [],
            defaults: {
              resolution: '1280*720',
              duration: 5,
            },
            pricing: [
              {
                resolution: '832*480',
                duration: 5,
                price: 12,
              },
              {
                resolution: '480*832',
                duration: 5,
                price: 12,
              },
              {
                resolution: '624*624',
                duration: 5,
                price: 12,
              },
              {
                resolution: '1280*720',
                duration: 5,
                price: 12,
              },
              {
                resolution: '720*1280',
                duration: 5,
                price: 12,
              },
              {
                resolution: '960*960',
                duration: 5,
                price: 12,
              },
              {
                resolution: '1088*832',
                duration: 5,
                price: 12,
              },
              {
                resolution: '832*1088',
                duration: 5,
                price: 12,
              },
            ],
          },
          {
            name: 'wanx2.1-i2v-turbo',
            description: 'Wan2.1 Turbo',
            channel: 'dashscope',
            modes: ['image2video'],
            resolutions: ['480P', '720P'],
            durations: [3, 4, 5],
            supportedParameters: ['image'],
            defaults: {
              resolution: '720P',
              duration: 5,
            },
            pricing: [
              {
                resolution: '480P',
                duration: 3,
                price: 12,
              },
              {
                resolution: '720P',
                duration: 3,
                price: 12,
              },
              {
                resolution: '480P',
                duration: 4,
                price: 12,
              },
              {
                resolution: '720P',
                duration: 4,
                price: 12,
              },
              {
                resolution: '480P',
                duration: 5,
                price: 12,
              },
              {
                resolution: '720P',
                duration: 5,
                price: 12,
              },
            ],
          },
          {
            name: 'wanx2.1-t2v-plus',
            description: 'Wan2.1 Plus',
            channel: 'dashscope',
            modes: ['text2video'],
            resolutions: ['1280*720', '720*1280', '960*960', '1088*832', '832*1088'],
            durations: [5],
            supportedParameters: [],
            defaults: {
              resolution: '1280*720',
              duration: 5,
            },
            pricing: [
              {
                resolution: '1280*720',
                duration: 5,
                price: 35,
              },
              {
                resolution: '720*1280',
                duration: 5,
                price: 35,
              },
              {
                resolution: '960*960',
                duration: 5,
                price: 35,
              },
              {
                resolution: '1088*832',
                duration: 5,
                price: 35,
              },
              {
                resolution: '832*1088',
                duration: 5,
                price: 35,
              },
            ],
          },
          {
            name: 'wanx2.1-i2v-plus',
            description: 'Wan2.1 Plus',
            channel: 'dashscope',
            modes: ['image2video'],
            resolutions: ['720P'],
            durations: [5],
            supportedParameters: ['image'],
            defaults: {
              resolution: '720P',
              duration: 5,
            },
            pricing: [
              {
                resolution: '720P',
                duration: 5,
                price: 35,
              },
            ],
          },
          {
            name: 'wanx2.1-kf2v-plus',
            description: 'Wan2.1 Plus',
            channel: 'dashscope',
            modes: ['flf2video'],
            resolutions: ['720P'],
            durations: [5],
            supportedParameters: ['image', 'image_tail'],
            defaults: {
              resolution: '720P',
              duration: 5,
            },
            pricing: [
              {
                resolution: '720P',
                duration: 5,
                price: 35,
              },
            ],
          },
          {
            name: 'wan2.2-t2v-plus',
            description: 'Wan2.2 Plus',
            channel: 'dashscope',
            modes: ['text2video'],
            resolutions: ['832*480', '480*832', '624*624', '1920*1080', '1080*1920', '1440*1440', '1632*1248', '1248*1632'],
            durations: [5],
            supportedParameters: [],
            defaults: {
              resolution: '1920*1080',
              duration: 5,
            },
            pricing: [
              {
                resolution: '832*480',
                duration: 5,
                price: 7,
              },
              {
                resolution: '480*832',
                duration: 5,
                price: 7,
              },
              {
                resolution: '624*624',
                duration: 5,
                price: 7,
              },
              {
                resolution: '1920*1080',
                duration: 5,
                price: 35,
              },
              {
                resolution: '1080*1920',
                duration: 5,
                price: 35,
              },
              {
                resolution: '1440*1440',
                duration: 5,
                price: 35,
              },
              {
                resolution: '1632*1248',
                duration: 5,
                price: 35,
              },
              {
                resolution: '1248*1632',
                duration: 5,
                price: 35,
              },
            ],
          },
          {
            name: 'wan2.2-i2v-plus',
            description: 'Wan2.2 Plus',
            channel: 'dashscope',
            modes: ['image2video'],
            resolutions: ['480P', '1080P'],
            durations: [5],
            supportedParameters: ['image'],
            defaults: {
              resolution: '1080P',
              duration: 5,
            },
            pricing: [
              {
                resolution: '480P',
                duration: 5,
                price: 7,
              },
              {
                resolution: '1080P',
                duration: 5,
                price: 35,
              },
            ],
          },
          {
            name: 'kling-v1-5',
            description: 'Kling v1.5',
            channel: 'kling',
            modes: ['image2video', 'flf2video', 'lf2video'],
            resolutions: [],
            durations: [5, 10],
            supportedParameters: ['image', 'image_tail'],
            defaults: {
              duration: 5,
              mode: 'std',
            },
            pricing: [
              {
                duration: 5,
                mode: 'std',
                price: 20,
              },
              {
                duration: 10,
                mode: 'std',
                price: 40,
              },
              {
                duration: 5,
                mode: 'pro',
                price: 35,
              },
              {
                duration: 10,
                mode: 'pro',
                price: 70,
              },
            ],
          },
          {
            name: 'kling-v1-6',
            description: 'Kling v1.6',
            channel: 'kling',
            modes: ['text2video', 'image2video', 'flf2video', 'lf2video'],
            resolutions: [],
            durations: [5, 10],
            supportedParameters: ['image', 'image_tail'],
            defaults: {
              duration: 5,
              mode: 'std',
            },
            pricing: [
              {
                duration: 5,
                mode: 'std',
                price: 20,
              },
              {
                duration: 10,
                mode: 'std',
                price: 40,
              },
              {
                duration: 5,
                mode: 'pro',
                price: 35,
              },
              {
                duration: 10,
                mode: 'pro',
                price: 70,
              },
            ],
          },
          {
            name: 'kling-v2-1',
            description: 'Kling v2.1',
            channel: 'kling',
            modes: ['image2video', 'flf2video'],
            resolutions: [],
            durations: [5, 10],
            supportedParameters: ['image', 'image_tail'],
            defaults: {
              duration: 5,
              mode: 'std',
            },
            pricing: [
              {
                duration: 5,
                mode: 'std',
                price: 20,
              },
              {
                duration: 10,
                mode: 'std',
                price: 40,
              },
              {
                duration: 5,
                mode: 'pro',
                price: 35,
              },
              {
                duration: 10,
                mode: 'pro',
                price: 70,
              },
            ],
          },
          {
            name: 'kling-v2-1-master',
            description: 'Kling v2.1 Master',
            channel: 'kling',
            modes: ['text2video', 'image2video'],
            resolutions: [],
            durations: [5, 10],
            supportedParameters: ['image'],
            defaults: {
              duration: 5,
              mode: 'std',
            },
            pricing: [
              {
                duration: 5,
                mode: 'std',
                price: 100,
              },
              {
                duration: 10,
                mode: 'std',
                price: 200,
              },
            ],
          },
        ],
      },
    },
  },
  aliGreen: {
    accessKeyId: ALI_GREEN_ACCESS_KEY_ID,
    accessKeySecret: ALI_GREEN_ACCESS_KEY_SECRET,
    endpoint: `green-cip.cn-beijing.aliyuncs.com`,
  },
  awsS3: {
    region: 'ap-southeast-1',
    bucketName: 'aitoearn',
    endpoint: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com',
  },
  mailBackHost: 'https://dev.aitoearn.ai',
  channelApi: {
    baseUrl: CHANNEL_URL,
  },
  paymentApi: {
    baseUrl: PAYMENT_URL,
  },
  moreApi: {
    platApiUri: 'https://platapi.yikart.cn',
    xhsCreatorUri: 'http://39.106.41.190:7008',
  },
  statisticsDb: {
    uri: `mongodb://${STATISTICS_DB_USERNAME}:${encodeURIComponent(STATISTICS_DB_PASSWORD)}@${STATISTICS_DB_HOST}:${STATISTICS_DB_PORT}/?authSource=admin&directConnection=true`,
    dbName: 'aitoearn_datas',
  },
  auth: {
    secret: JWT_SECRET,
    internalToken: INTERNAL_TOKEN,
  },
}
