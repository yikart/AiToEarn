import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { platform, platform2, ranking, user, hotTopics, viralTitles } from './mockData';
import { Platform } from '../src/db/schema/platform.schema';
import { Ranking } from '../src/db/schema/ranking.schema';
import { INestApplication } from '@nestjs/common';
import { User } from '../src/db/schema/user.schema';
import { HotTopic } from '../src/db/schema/hot-topic.schema';
import { ViralTitle } from '../src/db/schema/viral-title.schema';

export async function setupTestData(app: INestApplication) {
  // 获取模型
  const platformModel = app.get<Model<Platform>>(getModelToken(Platform.name));
  const rankingModel = app.get<Model<Ranking>>(getModelToken(Ranking.name));
  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const hotTopicModel = app.get<Model<HotTopic>>(getModelToken(HotTopic.name));
  const viralTitleModel = app.get<Model<ViralTitle>>(getModelToken(ViralTitle.name));

  // 清理已有数据
  await platformModel.deleteMany({});
  await rankingModel.deleteMany({});
  await userModel.deleteMany({});
  await hotTopicModel.deleteMany({});
  await viralTitleModel.deleteMany({});

  // 创建用户数据
  await userModel.create(user);

  // 创建平台数据
  const [createdPlatform, createdPlatform2] = await Promise.all([
    platformModel.create({
      ...platform,
      _id: platform._id,
    }),
    platformModel.create({
      ...platform2,
      _id: platform2._id,
    }),
  ]);

  // 创建排名数据
  await rankingModel.create(ranking);

  // 创建热门话题数据
  await hotTopicModel.insertMany(hotTopics);

  // 创建爆款标题数据
  await viralTitleModel.insertMany(viralTitles);

  return {
    platform: createdPlatform,
    platform2: createdPlatform2,
  };
}
