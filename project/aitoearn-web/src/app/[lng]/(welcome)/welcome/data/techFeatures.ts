/**
 * techFeatures.ts - AI 视频展示数据
 * 用于 TechFeaturesSection 展示 AI 生成的探店视频
 */

export interface AIVideoItem {
  id: string
  titleKey: string
  cover: string
  video: string
}

export const aiVideoShowcase: AIVideoItem[] = [
  {
    id: 'blacklock',
    titleKey: 'tech.video1.title',
    cover: '/assets/promptGallery/cover01.png',
    video: '/assets/promptGallery/video01.mp4',
  },
  {
    id: 'restaurant-discovery',
    titleKey: 'tech.video2.title',
    cover: '/assets/promptGallery/cover02.png',
    video: '/assets/promptGallery/video02.mp4',
  },
  {
    id: 'the-shed',
    titleKey: 'tech.video3.title',
    cover: '/assets/promptGallery/cover03.png',
    video: '/assets/promptGallery/video03.mp4',
  },
]
