/**
 * videoTestimonials.ts - 视频推荐数据
 * 包含客户视频推荐信息
 */

export interface VideoTestimonial {
  id: string
  videoUrl: string
  thumbnail: string
  thumbnailSrcSet?: string
  firstName: string
  lastName: string
  businessTitle: string
  quote: string
  stats: Array<{
    value: string
    label: string
  }>
  caseStudyUrl: string
}

export const videoTestimonials: VideoTestimonial[] = [
  {
    id: 'samos-oaxaca',
    videoUrl:
      'https://player.vimeo.com/progressive_redirect/playback/794723134/rendition/1080p/file.mp4?loc=external&signature=9c18dceb1831335c62e2b0fa77a192fd9b78659a9cf459518a69598dfeeb7cd2',
    thumbnail:
      'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e8cfd3d16a1d049a31003_oaxaca.jpg',
    thumbnailSrcSet:
      'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e8cfd3d16a1d049a31003_oaxaca-p-500.jpg 500w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e8cfd3d16a1d049a31003_oaxaca-p-800.jpg 800w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e8cfd3d16a1d049a31003_oaxaca-p-1080.jpg 1080w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e8cfd3d16a1d049a31003_oaxaca.jpg 1101w',
    firstName: 'Yuliana',
    lastName: 'Vasquez',
    businessTitle: 'Owner of Samos Oaxaca',
    quote:
      '"Owner.com is the secret to our online success. It makes online marketing so easy, and our guests love using our new ordering system and app."',
    stats: [
      { value: '+$150,000', label: 'Online sales' },
      { value: '+377%', label: 'Growth' },
    ],
    caseStudyUrl: '/case-studies/samos-oaxaca',
  },
  {
    id: 'saffron',
    videoUrl:
      'https://player.vimeo.com/progressive_redirect/playback/1022312278/rendition/1080p/file.mp4%20%281080p%29.mp4?loc=external&signature=c2e6f817c290227c74f523a093fe229ae19452abd967dfdfa24d5e2f573720e8',
    thumbnail:
      'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/674e14188f2c09047d065fb0_hero-shot-2.jpg',
    firstName: 'Rahul',
    lastName: 'Bhatia',
    businessTitle: 'Owner of Saffron Indian Kitchen',
    quote:
      '"The platform has been like a superpower for restaurants that increases sales and drives new customers consistently."',
    stats: [
      { value: '+$4,500,000', label: 'Online sales' },
      { value: '+4', label: 'Locations' },
    ],
    caseStudyUrl: '/case-studies/saffron',
  },
  {
    id: 'aburaya',
    videoUrl:
      'https://player.vimeo.com/progressive_redirect/playback/932909598/rendition/1080p/file.mp4%20%281080p%29.mp4?loc=external&signature=29e3f8ba99ef88df8c24e2bf24cc23019dcfa7c6375c029ea9d5d1c1a1d65268',
    thumbnail:
      'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e8d53453d0329f6c20a21_aburaya.jpg',
    thumbnailSrcSet:
      'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e8d53453d0329f6c20a21_aburaya-p-500.jpg 500w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e8d53453d0329f6c20a21_aburaya-p-800.jpg 800w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e8d53453d0329f6c20a21_aburaya-p-1080.jpg 1080w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e8d53453d0329f6c20a21_aburaya.jpg 1101w',
    firstName: 'Hiroyuki',
    lastName: 'Aidichi',
    businessTitle: 'Owner of Aburaya Fried Chicken',
    quote:
      '"The best part is your customer service. It\'s so quick and friendly; it just made my life easier. If somebody asks me, I recommend Owner."',
    stats: [
      { value: '+$300,000', label: 'Online sales' },
      { value: '$100,000', label: 'Delivery fees saved' },
    ],
    caseStudyUrl: '/case-studies/aburaya',
  },
  {
    id: 'hillcrust',
    videoUrl:
      'https://player.vimeo.com/progressive_redirect/playback/1061387330/rendition/1080p/file.mp4%20%281080p%29.mp4?loc=external&signature=0cb198b3e96302bd5adeb8bcc45ec42d7e7d91ed60c02e8c359235732b52e296',
    thumbnail:
      'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/67c2468d224cef63e84e8415_Screenshot%202025-02-28%20at%206.27.53%E2%80%AFPM.png',
    thumbnailSrcSet:
      'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/67c2468d224cef63e84e8415_Screenshot%202025-02-28%20at%206.27.53%E2%80%AFPM-p-500.png 500w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/67c2468d224cef63e84e8415_Screenshot%202025-02-28%20at%206.27.53%E2%80%AFPM-p-800.png 800w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/67c2468d224cef63e84e8415_Screenshot%202025-02-28%20at%206.27.53%E2%80%AFPM-p-1080.png 1080w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/67c2468d224cef63e84e8415_Screenshot%202025-02-28%20at%206.27.53%E2%80%AFPM.png 1150w',
    firstName: 'Jay',
    lastName: 'Saadat',
    businessTitle: 'Co-owner of HillCrust Pizza',
    quote:
      '"You guys got the website out pretty quick, man. I think it was up within, honestly, like a few days. Customers say the website is super user-friendly."',
    stats: [
      { value: '25%', label: 'increase in online orders' },
      { value: '5-figure', label: 'savings in third-party fees' },
    ],
    caseStudyUrl: '/case-studies/hillcrust-pizza',
  },
  {
    id: 'kabob-shack',
    videoUrl:
      'https://player.vimeo.com/progressive_redirect/playback/1062138717/rendition/1080p/file.mp4?loc=external&signature=58a3672757ee459859c055f0b890486b16a94b949515b6aa987671507ae22e80&user_id=220984361',
    thumbnail:
      'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/67c24cd9c675df3d7d4c7594_Screenshot%202025-02-28%20at%206.54.58%E2%80%AFPM.png',
    thumbnailSrcSet:
      'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/67c24cd9c675df3d7d4c7594_Screenshot%202025-02-28%20at%206.54.58%E2%80%AFPM-p-500.png 500w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/67c24cd9c675df3d7d4c7594_Screenshot%202025-02-28%20at%206.54.58%E2%80%AFPM-p-800.png 800w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/67c24cd9c675df3d7d4c7594_Screenshot%202025-02-28%20at%206.54.58%E2%80%AFPM-p-1080.png 1080w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/67c24cd9c675df3d7d4c7594_Screenshot%202025-02-28%20at%206.54.58%E2%80%AFPM.png 1438w',
    firstName: 'Said',
    lastName: 'Hofiani',
    businessTitle: 'Owner of San Diego Kabob Shack',
    quote:
      '"Ever since signing up, we saw bigger returns. This product is so damn good, man. It just pays for itself."',
    stats: [
      { value: '$9k', label: 'sales in first month' },
      { value: '60%', label: 'growth year-over-year' },
    ],
    caseStudyUrl: '/case-studies/san-diego-kabob-shack',
  },
]
