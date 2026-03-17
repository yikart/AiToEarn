/**
 * testimonials.ts - 推荐语数据
 * Welcome 页面的 Testimonials Section 使用
 */

export interface TestimonialStat {
  value: string
  label: string
}

export interface Testimonial {
  id: string
  restaurantName: string
  firstName: string
  lastName: string
  title: string
  quote: string
  stats: TestimonialStat[]
  video: {
    thumbnailUrl: string
    thumbnailSrcSet?: string
    vimeoUrl: string
  }
}

export const testimonials: Testimonial[] = [
  {
    id: 'metro-pizza',
    restaurantName: 'Metro Pizza',
    firstName: 'John',
    lastName: '&Sam',
    title: 'Owners at Metro Pizza',
    quote: '"Owner is a must-have for succeeding online as an independent restaurant today."',
    stats: [
      { value: '+54%', label: 'Sales growth after switching to Owner' },
      { value: '11,000', label: 'Installs of their new mobile app, created with Owner' },
    ],
    video: {
      thumbnailUrl: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e34a28bbef917ac47ed99_metro-pizza.jpg',
      thumbnailSrcSet: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e34a28bbef917ac47ed99_metro-pizza-p-500.jpg 500w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e34a28bbef917ac47ed99_metro-pizza-p-800.jpg 800w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e34a28bbef917ac47ed99_metro-pizza-p-1080.jpg 1080w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e34a28bbef917ac47ed99_metro-pizza.jpg 1410w',
      vimeoUrl: 'https://player.vimeo.com/progressive_redirect/playback/856612612/rendition/1080p/file.mp4?loc=external&signature=58132f9a67b9bb449a424c47d2cf44c8a22c0b979de6b6f264c3a2279219e59e',
    },
  },
  {
    id: 'cyclo-noodles',
    restaurantName: 'Cyclo Noodles',
    firstName: 'Sandy',
    lastName: 'Sei',
    title: 'Owner of Cyclo Noodles',
    quote: '"I would recommend to check Owner.com out. Don\'t take my word for it, read the reviews, see their videos, and just give them a call, because it can save you a lot of money."',
    stats: [
      { value: '+$104,500', label: 'Online sales' },
      { value: '$31,000', label: 'Savings in third-party fees' },
    ],
    video: {
      thumbnailUrl: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e34bb9714cd24bc6ff2a0_cyclo-noodle.jpg',
      thumbnailSrcSet: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e34bb9714cd24bc6ff2a0_cyclo-noodle-p-500.jpg 500w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e34bb9714cd24bc6ff2a0_cyclo-noodle.jpg 664w',
      vimeoUrl: 'https://player.vimeo.com/progressive_redirect/playback/917960671/rendition/1080p/file.mp4?loc=external&signature=ce4dd4d64e663d4af8e339cebd8a9f519dff7c2b1fdd0a926185a1c65437317a',
    },
  },
  {
    id: 'doo-dah-diner',
    restaurantName: 'Doo-Dah Diner',
    firstName: 'Timirie',
    lastName: 'Shibley',
    title: 'Owner of Doo-Dah Diner',
    quote: '"We\'ve more than doubled our direct online sales since starting. I didn\'t think having our own app would work, but our regulars love it and use it constantly."',
    stats: [
      { value: '+$72,000', label: 'Online sales' },
      { value: '$19,000', label: 'Savings in third-party fees' },
    ],
    video: {
      thumbnailUrl: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e8b9729dc9ea397f5555d_imirieshibley-headshot2023_1500xx4054-4054-0-0%201.08.10.jpg',
      thumbnailSrcSet: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e8b9729dc9ea397f5555d_imirieshibley-headshot2023_1500xx4054-4054-0-0%201.08.10-p-500.jpg 500w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e8b9729dc9ea397f5555d_imirieshibley-headshot2023_1500xx4054-4054-0-0%201.08.10-p-800.jpg 800w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e8b9729dc9ea397f5555d_imirieshibley-headshot2023_1500xx4054-4054-0-0%201.08.10-p-1080.jpg 1080w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e8b9729dc9ea397f5555d_imirieshibley-headshot2023_1500xx4054-4054-0-0%201.08.10.jpg 2000w',
      vimeoUrl: 'https://player.vimeo.com/progressive_redirect/playback/839310097/rendition/1080p/file.mp4?loc=external&signature=c6df88d4ab963620b9993e58371a92c6f92b883b68c374e5d02ab6db59b1ad3d',
    },
  },
  {
    id: 'karv-greek-kouzina',
    restaurantName: 'Karv Greek Kouzina',
    firstName: 'Alex',
    lastName: 'Lambroulis',
    title: 'Owner of Karv Greek Kouzina',
    quote: '"That\'s what Owner does. They take care of all the stuff you don\'t wanna do. It\'s like an army of experts. The online website and all that, it just runs on autopilot. Everything I read about Owner has been true. Owner is actually giving me business rather than just taking it."',
    stats: [
      { value: '+$40,000/m', label: 'Online sales' },
      { value: '+300%', label: 'Growth in online orders' },
    ],
    video: {
      thumbnailUrl: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/697bd44f28dabfeb08c6a431_karv-card.jpg',
      thumbnailSrcSet: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/697bd44f28dabfeb08c6a431_karv-card-p-500.jpg 500w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/697bd44f28dabfeb08c6a431_karv-card-p-800.jpg 800w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/697bd44f28dabfeb08c6a431_karv-card-p-1080.jpg 1080w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/697bd44f28dabfeb08c6a431_karv-card.jpg 1320w',
      vimeoUrl: 'https://player.vimeo.com/progressive_redirect/playback/1159392401/rendition/1080p/file.mp4%20%281080p%29.mp4?loc=external&signature=65c68427f87dd4b5f871c8aa2eddc7d561bc9828c26e3309ca8c233eeb075fdb',
    },
  },
]
