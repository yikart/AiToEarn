import supertest from 'supertest';
import { Agent } from '../agent';
import { platform, platform2 } from '../mockData';

describe('HotTopicController (e2e)', () => {
  let agent: supertest.Agent;

  beforeAll(async () => {
    agent = Agent.get();
  });

  describe('findAll', () => {
    it('should return top 10 hot topics for each platform', async () => {
      const result = await agent.get('/hot-topics/all').expect(200);

      expect(Array.isArray(result.body.data)).toBe(true);

      // 验证返回的数据结构
      result.body.data.forEach(group => {
        expect(group).toHaveProperty('platform');
        expect(group).toHaveProperty('topics');
        expect(Array.isArray(group.topics)).toBe(true);
        expect(group.topics.length).toBeLessThanOrEqual(10);

        // 验证每个平台的话题都正确分组
        group.topics.forEach(topic => {
          expect(topic.platformId._id.toString()).toBe(group.platform._id.toString());
        });

        // 验证每个平台内的话题按rank升序排序
        const ranks = group.topics.map(topic => topic.rank);
        expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
      });

      // 验证包含所有有话题的平台
      const platformIds = result.body.data.map(group => group.platform._id.toString());
      expect(platformIds).toContain(platform._id.toString());
      expect(platformIds).toContain(platform2._id.toString());
    });
  });
});
