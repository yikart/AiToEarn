import { Agent } from '../agent';
import { platform, ranking } from '../mockData';
import supertest from 'supertest';
import { RankingType, RankingStatus } from '../../src/db/schema/ranking.schema';

describe('RankingController (e2e)', () => {
  let agent: supertest.Agent;

  beforeAll(async () => {
    agent = Agent.get();
  });

  describe('getAllRankings', () => {
    it('should return all rankings', async () => {
      const result = await agent.get('/ranking').expect(200);

      expect(Array.isArray(result.body.data)).toBe(true);
      expect(result.body.data[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        type: expect.any(String),
        status: expect.any(Number),
        platform: expect.any(Object),
      });
    });
  });

  describe('getRanking', () => {
    it('should return ranking by id', async () => {
      const result = await agent.get(`/ranking/${ranking._id}`).expect(200);

      expect(result.body.data).toMatchObject({
        id: ranking._id.toString(),
        name: ranking.name,
        type: ranking.type,
        status: ranking.status,
        platform: expect.objectContaining({
          id: platform._id.toString(),
        }),
      });
    });
  });

  describe('createRanking', () => {
    it('should create new ranking', async () => {
      const newRanking = {
        name: 'Test Ranking',
        platformId: platform._id.toString(),
        type: RankingType.DAILY,
        description: 'Test Description',
        updateFrequency: '每日12点',
      };

      const result = await agent.post('/ranking').send(newRanking).expect(201);

      expect(result.body.data).toMatchObject({
        name: newRanking.name,
        type: newRanking.type,
        description: newRanking.description,
        status: RankingStatus.OPEN,
        updateFrequency: newRanking.updateFrequency,
      });
    });
  });

  describe('updateRanking', () => {
    it('should update ranking', async () => {
      const updateData = {
        name: 'Updated Ranking',
        description: 'Updated Description',
        platformId: platform._id.toString(),
      };

      const result = await agent
        .put(`/ranking/${ranking._id}`)
        .send(updateData)
        .expect(200);

      expect(result.body.data).toMatchObject({
        id: ranking._id.toString(),
        name: updateData.name,
        description: updateData.description,
      });
    });
  });

  describe('deleteRanking', () => {
    it('should delete ranking', async () => {
      await agent.delete(`/ranking/${ranking._id}`).expect(200);

      const result = await agent.get(`/ranking/${ranking._id}`).expect(200);
      expect(result.body.data.status).toBe(RankingStatus.DELETE);
    });
  });

  describe('getRankingsByPlatform', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let testRanking;

    beforeEach(async () => {
      // 创建一个测试榜单
      const newRanking = {
        name: 'Test Platform Ranking',
        platformId: platform._id.toString(),
        type: RankingType.DAILY,
        description: 'Test Description',
        status: RankingStatus.OPEN,
      };

      const createResult = await agent
        .post('/ranking')
        .send(newRanking)
        .expect(201);
      testRanking = createResult.body;
    });

    it('should return rankings by platform', async () => {
      const result = await agent
        .get('/ranking/platform')
        .query({
          platformId: platform._id.toString(),
        })
        .expect(200);

      expect(Array.isArray(result.body.data)).toBe(true);
      expect(result.body.data[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        type: expect.any(String),
        status: RankingStatus.OPEN,
        platform: expect.objectContaining({
          id: platform._id.toString(),
        }),
      });
    });

    it('should return rankings by platform with specific status', async () => {
      const result = await agent
        .get('/ranking/platform')
        .query({
          platformId: platform._id.toString(),
          status: RankingStatus.OPEN,
        })
        .expect(200);

      expect(Array.isArray(result.body.data)).toBe(true);
      result.body.data.forEach((ranking) => {
        expect(ranking.status).toBe(RankingStatus.OPEN);
        expect(ranking.platform.id).toBe(platform._id.toString());
      });
    });

    it('should return empty array when no rankings found', async () => {
      const nonExistentPlatformId = '507f1f77bcf86cd799439011';
      const result = await agent
        .get('/ranking/platform')
        .query({
          platformId: nonExistentPlatformId,
        })
        .expect(200);

      expect(result.body.data).toEqual([]);
    });
  });
});
