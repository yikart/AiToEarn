/**
 * owners.ts - 客户案例数据
 * Welcome 页面的 Owners Section 使用
 */

export interface Owner {
  id: string
  firstName: string
  lastName: string
  title: string
  caseStudyUrl: string
  image: string
  imageSrcSet?: string
  headline?: string
  stats?: {
    value: string
    label: string
  }
}

export const owners: Owner[] = [
  {
    id: 'cyclo-noodles',
    firstName: 'Sandy',
    lastName: 'Sei',
    title: 'Owner of Cyclo Noodles',
    caseStudyUrl: '/case-studies/cyclo-noodles',
    image: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e590e21e6d6d30d54c866_cyclo.jpg',
    imageSrcSet: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e590e21e6d6d30d54c866_cyclo-p-500.jpg 500w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e590e21e6d6d30d54c866_cyclo-p-800.jpg 800w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e590e21e6d6d30d54c866_cyclo-p-1080.jpg 1080w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e590e21e6d6d30d54c866_cyclo.jpg 1101w',
    headline: 'How Cyclo Noodles grew direct online sales by 7X by switching to Owner.com',
  },
  {
    id: 'mattengas-pizzeria',
    firstName: 'Hengameh',
    lastName: 'Stanfield',
    title: 'Co-owner of Mattenga\'s Pizzeria',
    caseStudyUrl: '/case-studies/mattengas-pizzeria',
    image: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/6915195db162f5b9391f7003_matt-enga-video.jpg',
    imageSrcSet: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/6915195db162f5b9391f7003_matt-enga-video-p-500.jpg 500w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/6915195db162f5b9391f7003_matt-enga-video-p-800.jpg 800w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/6915195db162f5b9391f7003_matt-enga-video-p-1080.jpg 1080w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/6915195db162f5b9391f7003_matt-enga-video.jpg 1320w',
    headline: 'How Mattenga\'s Pizzeria drove $192,000 in 30 days with Owner.com',
  },
  {
    id: 'saffron',
    firstName: 'Rahul',
    lastName: 'Bhatia',
    title: 'Owner of Saffron Indian Kitchen',
    caseStudyUrl: '/case-studies/saffron',
    image: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/674e14188f2c09047d065fb0_hero-shot-2.jpg',
    stats: {
      value: '+$4,500,000',
      label: 'Online sales',
    },
  },
  {
    id: 'metro-pizza',
    firstName: 'John',
    lastName: '&Sam',
    title: 'Owners at Metro Pizza',
    caseStudyUrl: '/case-studies/metro-pizza',
    image: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e58cc842d3abde9a87dd4_metro-pizza.jpg',
    imageSrcSet: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e58cc842d3abde9a87dd4_metro-pizza-p-500.jpg 500w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e58cc842d3abde9a87dd4_metro-pizza-p-800.jpg 800w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e58cc842d3abde9a87dd4_metro-pizza-p-1080.jpg 1080w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e58cc842d3abde9a87dd4_metro-pizza.jpg 1101w',
    headline: 'How Metro Pizza increased direct online sales by $10,000/m by switching to Owner.com',
  },
  {
    id: 'talkin-tacos',
    firstName: 'Mo',
    lastName: 'and Omar',
    title: 'Owners of Talkin Tacos',
    caseStudyUrl: '/case-studies/talkin-tacos',
    image: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e58dec1014216fd440ce0_talkin-taco.jpg',
    imageSrcSet: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e58dec1014216fd440ce0_talkin-taco-p-500.jpg 500w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e58dec1014216fd440ce0_talkin-taco-p-800.jpg 800w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e58dec1014216fd440ce0_talkin-taco.jpg 1101w',
    stats: {
      value: '+$7,000,000',
      label: 'In direct online sales',
    },
  },
  {
    id: 'sushi-addicts',
    firstName: 'Fernando',
    lastName: 'Izaguirre',
    title: 'Owner of Sushi Addicts',
    caseStudyUrl: '/case-studies/sushi-addicts',
    image: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/674e12d52f8a9ca3c46adc29_hero-shot-2.jpg',
    imageSrcSet: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/674e12d52f8a9ca3c46adc29_hero-shot-2-p-500.jpg 500w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/674e12d52f8a9ca3c46adc29_hero-shot-2-p-800.jpg 800w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/674e12d52f8a9ca3c46adc29_hero-shot-2-p-1080.jpg 1080w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/674e12d52f8a9ca3c46adc29_hero-shot-2.jpg 1300w',
    headline: 'How Sushi Addicts grew online orders to $210,000 per year with Owner',
  },
  {
    id: 'township-line-pizza',
    firstName: 'Sarkis',
    lastName: 'Panossian',
    title: 'Owner of Township Line Pizza',
    caseStudyUrl: '/case-studies/township-line-pizza',
    image: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/6822d4d8b2afafaf7a907dff_sarkis-pizza-c-min.jpg',
    stats: {
      value: '+$300,000',
      label: 'Online sales',
    },
  },
  {
    id: 'gyro-concept',
    firstName: 'Nikitas Bouras',
    lastName: '',
    title: 'Owner of Gyro Concept',
    caseStudyUrl: '/case-studies/gyro-concept',
    image: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/673b3eea9f5ea46db334110b_gyro-main-2.jpg',
    imageSrcSet: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/673b3eea9f5ea46db334110b_gyro-main-2-p-500.jpg 500w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/673b3eea9f5ea46db334110b_gyro-main-2-p-800.jpg 800w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/673b3eea9f5ea46db334110b_gyro-main-2-p-1080.jpg 1080w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/673b3eea9f5ea46db334110b_gyro-main-2-p-1600.jpg 1600w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/673b3eea9f5ea46db334110b_gyro-main-2.jpg 2400w',
    headline: 'How Gyro Concept grew to $194,000 in online sales per year with Owner.com',
  },
  {
    id: 'aburaya',
    firstName: 'Hiroyuki',
    lastName: 'Aidichi',
    title: 'Owner of Aburaya Fried Chicken',
    caseStudyUrl: '/case-studies/aburaya',
    image: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e59186e8ef21f428818dd_aburaya.jpg',
    imageSrcSet: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e59186e8ef21f428818dd_aburaya-p-500.jpg 500w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e59186e8ef21f428818dd_aburaya-p-800.jpg 800w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e59186e8ef21f428818dd_aburaya.jpg 1101w',
    stats: {
      value: '+$300,000',
      label: 'Online sales',
    },
  },
  {
    id: 'samos-oaxaca',
    firstName: 'Yuliana',
    lastName: 'Vasquez',
    title: 'Owner of Samos Oaxaca',
    caseStudyUrl: '/case-studies/samos-oaxaca',
    image: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e59046e8ef21f428812e4_oaxaca.jpg',
    imageSrcSet: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e59046e8ef21f428812e4_oaxaca-p-500.jpg 500w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e59046e8ef21f428812e4_oaxaca-p-800.jpg 800w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e59046e8ef21f428812e4_oaxaca.jpg 1101w',
    headline: 'How Samos Oaxaca increased direct online sales to $10,000/m by using Owner.com',
  },
  {
    id: 'sushi-me-rollin',
    firstName: 'Phillip',
    lastName: 'Hang',
    title: 'Owner of Sushi Me Roll\'n',
    caseStudyUrl: '/case-studies/sushi-me-rollin',
    image: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e58efd50b05c9f54e572d_sushi-me-rolin.jpg',
    imageSrcSet: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e58efd50b05c9f54e572d_sushi-me-rolin-p-500.jpg 500w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e58efd50b05c9f54e572d_sushi-me-rolin-p-800.jpg 800w, https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/668e58efd50b05c9f54e572d_sushi-me-rolin.jpg 1101w',
    headline: 'How Sushi Me Roll\'n increased direct online sales by $50,000 using Owner.com',
  },
]
