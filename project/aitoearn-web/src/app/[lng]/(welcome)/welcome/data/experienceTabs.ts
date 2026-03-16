/**
 * experienceTabs.ts - 体验标签页数据
 * Welcome 页面的 Experience Tabs Section 使用
 */

export interface ExperienceTab {
  id: string
  number: number
  titleKey: string
  subtitleKey: string
  descriptionKey: string
  video: {
    url: string
    poster: string
  }
  isVertical?: boolean
}

export const experienceTabs: ExperienceTab[] = [
  {
    id: 'publish',
    number: 1,
    titleKey: 'experience.tab2.title',
    subtitleKey: 'experience.tab2.subtitle',
    descriptionKey: 'experience.tab2.description',
    video: {
      url: '/assets/welcome/publish.mp4',
      poster: '/assets/welcome/publish-cover.png',
    },
  },
  {
    id: 'video_create',
    number: 2,
    titleKey: 'experience.tab3.title',
    subtitleKey: 'experience.tab3.subtitle',
    descriptionKey: 'experience.tab3.description',
    video: {
      url: '/assets/welcome/video_create.mp4',
      poster: '/assets/welcome/video_create-cover.png',
    },
  },
  {
    id: 'promotion',
    number: 3,
    titleKey: 'experience.tab1.title',
    subtitleKey: 'experience.tab1.subtitle',
    descriptionKey: 'experience.tab1.description',
    video: {
      url: '/assets/welcome/promotion.mp4',
      poster: '/assets/welcome/interaction-cover.png',
    },
    isVertical: true,
  },
  {
    id: 'interaction',
    number: 4,
    titleKey: 'experience.tab4.title',
    subtitleKey: 'experience.tab4.subtitle',
    descriptionKey: 'experience.tab4.description',
    video: {
      url: '/assets/welcome/interaction.mp4',
      poster: '/assets/welcome/interaction-cover.png',
    },
  },
]
