import supertest from 'supertest';
import { Agent } from '../agent';
import { platform, platform2 } from '../mockData';

describe('ViralTitleController (e2e)', () => {
  let agent: supertest.Agent;

  beforeAll(async () => {
    agent = Agent.get();
  });

  describe('findPlatformsWithData', () => {
    it('should return platforms that have viral title data', async () => {
      const result = await agent.get('/viral-titles/platforms').expect(200);

      expect(Array.isArray(result.body.data)).toBe(true);
      result.body.data.forEach(platform => {
        expect(platform).toHaveProperty('_id');
        expect(platform).toHaveProperty('name');
        expect(platform).toHaveProperty('description');
        expect(platform).toHaveProperty('type');
        expect(platform).toHaveProperty('status');
      });
    });
  });

  describe('findCategoriesByPlatform', () => {
    it('should return categories for a specific platform', async () => {
      const result = await agent
        .get(`/viral-titles/platforms/${platform._id}/categories`)
        .expect(200);

      expect(Array.isArray(result.body.data)).toBe(true);
      result.body.data.forEach(category => {
        expect(typeof category).toBe('string');
      });
    });

    it('should return empty array for platform without data', async () => {
      const result = await agent
        .get(`/viral-titles/platforms/${platform2._id}/categories`)
        .expect(200);

      expect(Array.isArray(result.body.data)).toBe(true);
      expect(result.body.data.length).toBe(0);
    });
  });

  describe('findTopByPlatformAndCategories', () => {
    it('should return top 5 titles for each category in platform', async () => {
      const result = await agent
        .get(`/viral-titles/platforms/${platform._id}/top-by-categories`)
        .expect(200);

      expect(Array.isArray(result.body.data)).toBe(true);
      result.body.data.forEach(categoryGroup => {
        expect(categoryGroup).toHaveProperty('category');
        expect(categoryGroup).toHaveProperty('titles');
        expect(Array.isArray(categoryGroup.titles)).toBe(true);
        expect(categoryGroup.titles.length).toBeLessThanOrEqual(5);

        // Verify each title has required properties
        categoryGroup.titles.forEach(title => {
          expect(title).toHaveProperty('platformId');
          expect(title).toHaveProperty('category');
          expect(title).toHaveProperty('title');
          expect(title).toHaveProperty('url');
          expect(title).toHaveProperty('rank');
          expect(title).toHaveProperty('engagement');
          expect(title).toHaveProperty('publishTime');

          // Verify titles belong to correct category and platform
          expect(title.category).toBe(categoryGroup.category);
          expect(title.platformId.toString()).toBe(platform._id.toString());
        });

        // Verify titles are sorted by engagement
        const engagements = categoryGroup.titles.map(title => title.engagement);
        expect(engagements).toEqual([...engagements].sort((a, b) => b - a));
      });
    });
  });

  describe('findByPlatformAndCategory', () => {
    it('should return paginated titles for platform and category', async () => {
      const result = await agent
        .get(`/viral-titles/platforms/${platform._id}`)
        .query({
          category: '美食',
          page: 1,
          pageSize: 10
        })
        .expect(200);

      expect(result.body.data).toHaveProperty('items');
      expect(result.body.data).toHaveProperty('meta');
      
      const { items, meta } = result.body.data;
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeLessThanOrEqual(10);

      // Verify pagination meta
      expect(meta).toHaveProperty('currentPage');
      expect(meta).toHaveProperty('itemCount');
      expect(meta).toHaveProperty('itemsPerPage');
      expect(meta).toHaveProperty('totalItems');
      expect(meta).toHaveProperty('totalPages');

      // Verify each title has required properties
      items.forEach(title => {
        expect(title).toHaveProperty('platformId');
        expect(title).toHaveProperty('category');
        expect(title).toHaveProperty('title');
        expect(title).toHaveProperty('url');
        expect(title).toHaveProperty('rank');
        expect(title).toHaveProperty('engagement');
        expect(title).toHaveProperty('publishTime');

        // Verify titles belong to correct category and platform
        expect(title.category).toBe('美食');
        expect(title.platformId.toString()).toBe(platform._id.toString());
      });

      // Verify titles are sorted by engagement and rank
      const engagements = items.map(title => title.engagement);
      expect(engagements).toEqual([...engagements].sort((a, b) => b - a));
    });

    it('should filter by date range', async () => {
      const startTime = new Date('2025-02-15T00:00:00Z');
      const endTime = new Date('2025-02-15T23:59:59Z');

      const result = await agent
        .get(`/viral-titles/platforms/${platform._id}`)
        .query({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          page: 1,
          pageSize: 10
        })
        .expect(200);

      const { items } = result.body.data;
      items.forEach(title => {
        const publishTime = new Date(title.publishTime);
        expect(publishTime.getTime()).toBeGreaterThanOrEqual(startTime.getTime());
        expect(publishTime.getTime()).toBeLessThanOrEqual(endTime.getTime());
      });
    });
  });
});
