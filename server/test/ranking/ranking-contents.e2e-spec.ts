import { Agent } from '../agent';
import { platform, ranking } from '../mockData';
import { ContentStatus, ContentType } from '../../src/db/schema/content.schema';
import { ObjectId } from 'mongodb';
import { getModelToken } from '@nestjs/mongoose';
import { Content } from '../../src/db/schema/content.schema';
import { Model } from 'mongoose';
import supertest from 'supertest';

describe('RankingContents (e2e)', () => {
  let agent: supertest.Agent;
  let contentModel: Model<Content>;

  beforeAll(async () => {
    agent = Agent.get();
    contentModel = Agent.app().get(getModelToken(Content.name));
  });

  beforeEach(async () => {
    await contentModel.deleteMany({});

    // 创建测试内容数据
    await contentModel.create([
      {
        title: '内容1',
        platformId: platform._id,
        rankingId: ranking._id,
        originalId: '1',
        type: ContentType.ARTICLE,
        category: '分类1',
        url: 'http://test1.com',
        status: ContentStatus.OPEN,
        rankingPosition: 1,
      },
      {
        title: '内容2',
        platformId: platform._id,
        rankingId: ranking._id,
        originalId: '2',
        type: ContentType.ARTICLE,
        category: '分类1',
        url: 'http://test2.com',
        status: ContentStatus.OPEN,
        rankingPosition: 2,
      },
    ]);
  });

  describe('GET /ranking/:id/contents', () => {
    it('应该返回榜单内容列表', async () => {
      const { body } = await agent
        .get(`/ranking/${ranking._id}/contents`)
        .expect(200);

      expect(Array.isArray(body.data.items)).toBe(true);
      expect(body.data.items.length).toBe(2);
      expect(body.data.items[0]).toMatchObject({
        title: '内容1',
        originalId: '1',
        rankingPosition: 1,
      });
      expect(body.data.items[1]).toMatchObject({
        title: '内容2',
        originalId: '2',
        rankingPosition: 2,
      });
      expect(body.data.meta).toMatchObject({
        itemCount: 2,
        itemsPerPage: 20,
        currentPage: 1,
      });
    });

    it('使用分页参数应该正确返回数据', async () => {
      const { body } = await agent
        .get(`/ranking/${ranking._id}/contents`)
        .query({ page: 1, pageSize: 1 })
        .expect(200);

      expect(Array.isArray(body.data.items)).toBe(true);
      expect(body.data.items.length).toBe(1);
      expect(body.data.items[0]).toMatchObject({
        title: expect.any(String),
        originalId: expect.any(String),
      });
    });

    it('无效的ObjectId应该返回400错误', async () => {
      await agent.get('/ranking/invalid-id/contents').expect(400);
    });

    it('不存在的榜单ID应该返回空数组', async () => {
      const nonExistentId = new ObjectId().toString();
      const { body } = await agent
        .get(`/ranking/${nonExistentId}/contents`)
        .expect(200);

      expect(Array.isArray(body.data.items)).toBe(true);
      expect(body.data.items.length).toBe(0);
      expect(body.data.meta).toMatchObject({
        itemCount: 0,
        itemsPerPage: 20,
        currentPage: 1,
      });
    });
  });

  describe('GET /ranking/:id/categories', () => {
    beforeEach(async () => {
      await contentModel.deleteMany({});

      // 创建测试内容数据
      await contentModel.create([
        {
          title: '内容1',
          platformId: platform._id,
          rankingId: ranking._id,
          originalId: '1',
          type: ContentType.ARTICLE,
          category: '分类1',
          url: 'http://test1.com',
          status: ContentStatus.OPEN,
        },
        {
          title: '内容2',
          platformId: platform._id,
          rankingId: ranking._id,
          originalId: '2',
          type: ContentType.ARTICLE,
          category: '分类2',
          url: 'http://test2.com',
          status: ContentStatus.OPEN,
        },
        {
          title: '内容3',
          platformId: platform._id,
          rankingId: ranking._id,
          originalId: '3',
          type: ContentType.ARTICLE,
          category: '分类1', // 重复的分类
          url: 'http://test3.com',
          status: ContentStatus.STOP, // 停用状态
        },
        {
          title: '内容4',
          platformId: new ObjectId(), // 不同平台
          rankingId: ranking._id,
          originalId: '4',
          type: ContentType.ARTICLE,
          category: '分类3',
          url: 'http://test4.com',
          status: ContentStatus.OPEN,
        },
      ]);
    });

    it('应该返回榜单内容的唯一分类列表', async () => {
      const { body } = await agent
        .get(`/ranking/${ranking._id}/categories`)
        .expect(200);

      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.data).toContain('分类1');
      expect(body.data).toContain('分类2');
      // 不应该包含停用状态的内容分类和其他平台的分类
      expect(body.data).not.toContain('分类3');
    });

    it('无效的ObjectId应该返回400错误', async () => {
      await agent.get('/ranking/invalid-id/categories').expect(400);
    });

    it('不存在的榜单ID应该返回空数组', async () => {
      const nonExistentId = new ObjectId().toString();
      const { body } = await agent
        .get(`/ranking/${nonExistentId}/categories`)
        .expect(200);

      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(0);
    });
  });
});
