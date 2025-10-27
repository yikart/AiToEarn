import { ObjectId } from 'mongodb';
import { PlatformAccountGroupStatus } from '../src/db/schema/platform-account-group.schema';
import { PlatformStatus, PlatformType } from '../src/db/schema/platform.schema';
import { RankingStatus, RankingType } from '../src/db/schema/ranking.schema';
import { TaskType } from '../src/db/schema/task.schema';

export const user = {
  _id: new ObjectId('6788f154c40f87952b9ed3bf'),
  name: '测试用户',
  phone: '13800138000',
  status: 1,
  createTime: new Date(),
  updateTime: new Date(),
};

export const platform = {
  _id: new ObjectId(),
  name: 'Mock Platform',
  type: PlatformType.DOUYIN,
  description: 'Mock Platform Description',
  status: PlatformStatus.OPEN,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const platform2 = {
  _id: new ObjectId(),
  name: 'Mock Platform 2',
  type: PlatformType.WECHAT,
  description: 'Mock Platform 2 Description',
  status: PlatformStatus.OPEN,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const hotTopics = [
  {
    _id: new ObjectId(),
    platformId: platform._id,
    platform: PlatformType.DOUYIN,
    title: 'Hot Topic 1',
    hotValue: 100,
    rank: 1,
    url: 'http://example.com/1',
    rankChange: 0,
    isRising: true,
    hotValueHistory: [],
    fetchTime: new Date(),
  },
  {
    _id: new ObjectId(),
    platformId: platform._id,
    platform: PlatformType.DOUYIN,
    title: 'Hot Topic 2',
    hotValue: 90,
    rank: 2,
    url: 'http://example.com/2',
    rankChange: 1,
    isRising: true,
    hotValueHistory: [],
    fetchTime: new Date(),
  },
  {
    _id: new ObjectId(),
    platformId: platform2._id,
    platform: PlatformType.WECHAT,
    title: 'Hot Topic 3',
    hotValue: 95,
    rank: 1,
    url: 'http://example.com/3',
    rankChange: 0,
    isRising: false,
    hotValueHistory: [],
    fetchTime: new Date(),
  },
];

export const ranking = {
  _id: new ObjectId(),
  name: 'Mock Ranking',
  platformId: platform._id,
  type: RankingType.DAILY,
  description: 'Mock Ranking Description',
  status: RankingStatus.OPEN,
  updateFrequency: '每日12点',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const platformAccountGroup = {
  _id: new ObjectId(),
  name: '自有账号',
  description: '自有账号分组',
  status: PlatformAccountGroupStatus.OPEN,
  sort: 1,
  createTime: new Date(),
  updateTime: new Date(),
};

export const viralTitles = [
  {
    _id: new ObjectId(),
    platformId: platform._id,
    category: '美食',
    title: '这家藏在巷子里的面馆，凌晨三点都在排队',
    url: 'https://example.com/title1',
    rank: 1,
    engagement: 156800,
    publishTime: new Date('2025-02-15T06:30:00Z'),
  },
  {
    _id: new ObjectId(),
    platformId: platform._id,
    category: '美食',
    title: '自制冰淇淋只需要这3种材料，简单到哭',
    url: 'https://example.com/title2',
    rank: 2,
    engagement: 143200,
    publishTime: new Date('2025-02-15T07:00:00Z'),
  },
  {
    _id: new ObjectId(),
    platformId: platform._id,
    category: '旅游',
    title: '云南这个小众景点太惊艳了，门票只要10块',
    url: 'https://example.com/title3',
    rank: 1,
    engagement: 198000,
    publishTime: new Date('2025-02-15T05:45:00Z'),
  },
  {
    _id: new ObjectId(),
    platformId: platform._id,
    category: '生活',
    title: '一个人住也要好好生活，这些家居好物推荐给你',
    url: 'https://example.com/title4',
    rank: 1,
    engagement: 134500,
    publishTime: new Date('2025-02-15T07:45:00Z'),
  },
];
export const task = {
  title: '测试任务',
  type: TaskType.PRODUCT,
  price: 100,
  commission: 10,
  maxRecruits: 5,
  currentRecruits: 0,
  deadline: new Date('2025-12-31'),
  firstTimeBonus: 50,
  reward: 1000,
  requiresShoppingCart: true,
  description: '这是一个测试任务',
  cooperationRequirements: {
    batchMaterialPublishing: true,
    requiresShoppingCart: true,
  },
};
