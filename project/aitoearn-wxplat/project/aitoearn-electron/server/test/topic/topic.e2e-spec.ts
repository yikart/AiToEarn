import { Agent } from '../agent';
import supertest from 'supertest';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { platform } from '../mockData';
import { Topic } from '../../src/db/schema/topic.schema';

describe('TopicController (e2e)', () => {
  let agent: supertest.Agent;
  let topicModel: Model<Topic>;

  const mockTopics = [
    {
      platformId: platform._id,
      title: 'Test Topic 1',
      description: 'Test Description 1',
      category: 'Entertainment',
      subCategory: 'Movies',
      url: 'http://example.com/topic1',
      author: 'Author 1',
      topics: ['movie', 'entertainment'],
      rank: 1,
      createTime: new Date(),
      updateTime: new Date(),
    },
    {
      platformId: platform._id,
      title: 'Test Topic 2',
      description: 'Test Description 2',
      category: 'Technology',
      subCategory: 'AI',
      url: 'http://example.com/topic2',
      author: 'Author 2',
      topics: ['ai', 'tech'],
      rank: 2,
      createTime: new Date(),
      updateTime: new Date(),
    },
  ];

  beforeAll(async () => {
    agent = Agent.get();
    topicModel = Agent.app().get(getModelToken(Topic.name));
    await topicModel.insertMany(mockTopics);
  });

  afterAll(async () => {
    await topicModel.deleteMany({});
  });

  describe('/topics (GET)', () => {
    it('should return all topics', () => {
      return agent
        .get('/topics')
        .expect(200)
        .expect((res) => {
          expect(res.body.code).toBe(0);
          expect(res.body.data.items).toHaveLength(2);
          expect(res.body.data.items[0]).toHaveProperty('title');
          expect(res.body.data.items[0]).toHaveProperty('category');
          expect(res.body.data.meta).toMatchObject({
            currentPage: 1,
            itemsPerPage: 20,
            totalItems: 2,
            totalPages: 1
          });
        });
    });

    it('should filter topics by category', () => {
      return agent
        .get('/topics?category=Technology')
        .expect(200)
        .expect((res) => {
          expect(res.body.code).toBe(0);
          expect(res.body.data.items).toHaveLength(1);
          expect(res.body.data.items[0].category).toBe('Technology');
          expect(res.body.data.meta).toMatchObject({
            currentPage: 1,
            itemsPerPage: 20,
            totalItems: 1,
            totalPages: 1
          });
        });
    });
  });

  describe('/topics/categories (GET)', () => {
    it('should return all categories', () => {
      return agent
        .get('/topics/categories')
        .expect(200)
        .expect((res) => {
          expect(res.body.code).toBe(0);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data).toContain('Entertainment');
          expect(res.body.data).toContain('Technology');
        });
    });
  });

  describe('/topics/sub-categories (GET)', () => {
    it('should return all sub-categories for a category', () => {
      return agent
        .get('/topics/sub-categories?category=Technology')
        .expect(200)
        .expect((res) => {
          expect(res.body.code).toBe(0);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data).toContain('AI');
        });
    });
  });

  describe('/topics/topics (GET)', () => {
    it('should return all topic tags', () => {
      return agent
        .get('/topics/topics')
        .expect(200)
        .expect((res) => {
          expect(res.body.code).toBe(0);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data).toContain('movie');
          expect(res.body.data).toContain('ai');
        });
    });
  });
});
