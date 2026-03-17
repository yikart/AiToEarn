/**
 * reviews.ts - 评价数据
 * Welcome 页面的 Reviews Section 使用
 */

export interface Review {
  id: string
  name: string
  contentKey: string
  avatar: string
  rating: number
}

// 左列评价
export const reviewsColumnLeft: Review[] = [
  {
    id: 'review-1',
    name: 'Alex Chen',
    contentKey: 'reviews.review1.content',
    avatar: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/680e9284f98fb67f811248df_1_1.jpeg',
    rating: 5,
  },
  {
    id: 'review-2',
    name: 'Maria Rodriguez',
    contentKey: 'reviews.review2.content',
    avatar: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/680e92ad5b46e544921e6560_1_2.jpeg',
    rating: 5,
  },
  {
    id: 'review-3',
    name: 'James Wilson',
    contentKey: 'reviews.review3.content',
    avatar: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/680e92e887495af0921e60c3_1_3.jpeg',
    rating: 5,
  },
]

// 中间列评价
export const reviewsColumnMiddle: Review[] = [
  {
    id: 'review-4',
    name: 'Sophie Liu',
    contentKey: 'reviews.review4.content',
    avatar: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/680e930e2e9b2fdeeb0b7d3f_1_4.jpeg',
    rating: 5,
  },
  {
    id: 'review-5',
    name: 'David Park',
    contentKey: 'reviews.review5.content',
    avatar: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/680e932f3f679ef5a1bdf5f4_1-5.jpeg',
    rating: 5,
  },
  {
    id: 'review-6',
    name: 'Emma Taylor',
    contentKey: 'reviews.review6.content',
    avatar: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/680e9345b164ea49c1c2d5d3_1_6.jpeg',
    rating: 5,
  },
]

// 右列评价
export const reviewsColumnRight: Review[] = [
  {
    id: 'review-7',
    name: 'Jake Anderson',
    contentKey: 'reviews.review7.content',
    avatar: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/680e93f0f98fb67f81131322_1_7.jpeg',
    rating: 5,
  },
  {
    id: 'review-8',
    name: 'Michael Brown',
    contentKey: 'reviews.review8.content',
    avatar: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/680e940d4bbd0d98bed8fc77_1_8.jpeg',
    rating: 5,
  },
  {
    id: 'review-9',
    name: 'Sarah Kim',
    contentKey: 'reviews.review9.content',
    avatar: 'https://cdn.prod.website-files.com/666eec3edcc552b5eecc7fcd/680e942d34808eee310cd3d9_1_9.jpeg',
    rating: 5,
  },
]

// 所有评价的合并数组（用于移动端轮播）
export const allReviews: Review[] = [
  ...reviewsColumnLeft,
  ...reviewsColumnMiddle,
  ...reviewsColumnRight,
]

// 评价平台数据
export interface ReviewPlatform {
  id: string
  name: string
  rating: string
  reviewCount: string
  icon: string
}

export const reviewPlatforms: ReviewPlatform[] = [
  {
    id: 'g2',
    name: 'G2',
    rating: '4.8',
    reviewCount: '560+',
    icon: 'g2',
  },
  {
    id: 'google',
    name: 'Google',
    rating: '4.9',
    reviewCount: '',
    icon: 'google',
  },
  {
    id: 'capterra',
    name: 'Capterra',
    rating: '4.8',
    reviewCount: '',
    icon: 'capterra',
  },
  {
    id: 'trustpilot',
    name: 'Trustpilot',
    rating: '4.7',
    reviewCount: '',
    icon: 'trustpilot',
  },
]

// 徽章数据
export interface ReviewBadge {
  id: string
  icon: 'send' | 'g2'
  textKey: string
}

export const reviewBadges: ReviewBadge[] = [
  { id: 'badge-1', icon: 'send', textKey: 'reviews.badge1' },
  { id: 'badge-2', icon: 'g2', textKey: 'reviews.badge2' },
]
