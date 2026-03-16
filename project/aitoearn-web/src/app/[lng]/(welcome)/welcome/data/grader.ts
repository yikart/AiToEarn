import graderScreen from '../assets/graderScreen.png'

/**
 * grader.ts - AI 打分工具配置
 * 包含打分工具区块的资源配置（文案改用 i18n）
 */

export const graderVideos = {
  desktop: {
    poster:
      'https://cdn.prod.website-files.com/66643a14df53b71d1ed72d08%2F69405ae4b58e9fb47abcc140_grader-blur_poster.0000000.jpg',
    mp4: 'https://cdn.prod.website-files.com/66643a14df53b71d1ed72d08%2F69405ae4b58e9fb47abcc140_grader-blur_mp4.mp4',
    webm: 'https://cdn.prod.website-files.com/66643a14df53b71d1ed72d08%2F69405ae4b58e9fb47abcc140_grader-blur_webm.webm',
  },
  mobile: {
    poster:
      'https://cdn.prod.website-files.com/66643a14df53b71d1ed72d08%2F6941b0a12bb3ba06e35dcbbe_grader-blur-respo_poster.0000000.jpg',
    mp4: 'https://cdn.prod.website-files.com/66643a14df53b71d1ed72d08%2F6941b0a12bb3ba06e35dcbbe_grader-blur-respo_mp4.mp4',
    webm: 'https://cdn.prod.website-files.com/66643a14df53b71d1ed72d08%2F6941b0a12bb3ba06e35dcbbe_grader-blur-respo_webm.webm',
  },
}

export const graderPhone = {
  mockup:
    'https://cdn.prod.website-files.com/66643a14df53b71d1ed72d08/6809881c139b1b218ef1ed59_phone-ui.avif',
  screen: graderScreen.src,
  status:
    'https://cdn.prod.website-files.com/66643a14df53b71d1ed72d08/680989a6a598aea4688dc28b_phone-status.svg',
  shadow:
    'https://cdn.prod.website-files.com/66643a14df53b71d1ed72d08/680987a35774edc612fc8db5_phone-shadow-back.avif',
  tags: [
    { textKey: 'hero.tags.aiVideo', position: 'cc-1' },
    { textKey: 'hero.tags.socialMedia', position: 'cc-2' },
  ],
}
