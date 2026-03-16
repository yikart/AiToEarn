/**
 * PromptGallery 静态资源数据
 * 功能：提供视频提示词画廊的封面图片和视频资源路径
 * 注意：提示词内容通过国际化翻译文件加载（promptGallery.json）
 */

/** 提示词画廊静态资源配置 */
export const promptGalleryAssets = [
  {
    title: 'Blacklock Canary Wharf Check-in Vlog',
    cover: '/assets/promptGallery/cover01.png',
    video: '/assets/promptGallery/video01.mp4',
    materials: ['/assets/promptGallery/material01-1.png', '/assets/promptGallery/material01-2.png'],
    prompt: `Create an 8s vertical video (9:16), restaurant check-in vlog style at Blacklock Canary Wharf. Selfie/talking-head format for TikTok/Reels. Use provided images as reference.`,
  },
  {
    title: 'Restaurant Discovery Short Video',
    cover: '/assets/promptGallery/cover02.png',
    video: '/assets/promptGallery/video02.mp4',
    materials: ['/assets/promptGallery/material02.png'],
    prompt: `8s 9:16 vlog. VO: "Just found this place, everyone says it's great. Going in—wish me luck!" Exterior→walk→enter. Useref imgs.`,
  },
  {
    title: 'The Shed British Restaurant Promo',
    cover: '/assets/promptGallery/cover03.png',
    video: '/assets/promptGallery/video03.mp4',
    materials: ['/assets/promptGallery/material03.png'],
    prompt: `8s 9:16 The Shed video. VO: "The Shed blew my mind! Fish & chips perfection. You have to check it out!" Warm tones. Use refs.`,
  },
]
