import { Agent } from '../agent';
import supertest from 'supertest';
import { UserStatus } from '../../src/db/schema/user.schema';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../src/db/schema/user.schema';
import { Manager, ManagerStatus } from '../../src/db/schema/manager.schema';
import { encryptPassword } from '../../src/util/password.util';

describe('UserAdminController (e2e)', () => {
  let agent: supertest.Agent;
  let userModel: Model<User>;
  let managerModel: Model<Manager>;
  let managerToken: string;

  const testManager = {
    account: 'testadmin',
    password: '123456',
    name: '测试管理员',
  };

  const testUsers = [
    { phone: '13800138001', name: '测试用户1', status: UserStatus.OPEN },
    { phone: '13800138002', name: '测试用户2', status: UserStatus.OPEN },
    { phone: '13800138003', name: '测试用户3', status: UserStatus.STOP },
  ];

  beforeAll(async () => {
    agent = Agent.get();
    userModel = Agent.app().get(getModelToken(User.name));
    managerModel = Agent.app().get(getModelToken(Manager.name));
  });

  beforeEach(async () => {
    // 清理测试数据
    await userModel.deleteMany({
      phone: { $in: testUsers.map((u) => u.phone) },
    });
    await managerModel.deleteMany({ account: testManager.account });

    // 创建测试用户
    await userModel.create(testUsers);

    // 创建并登录测试管理员
    const { password, salt } = encryptPassword(
      testManager.password,
      '$2b$10$8n6z9rAh9rKfxoQkqxVqOe',
    );
    await managerModel.create({
      account: testManager.account,
      password,
      salt,
      name: testManager.name,
      status: ManagerStatus.OPEN,
    });

    const { body } = await agent.post('/manager/login').send({
      account: testManager.account,
      password: testManager.password,
    });

    managerToken = body.data.token;
  });

  describe('用户管理接口', () => {
    it('应该能获取用户列表', async () => {
      const { body } = await agent
        .get('/admin/user/list')
        .set('Authorization', `Bearer ${managerToken}`)
        .query({
          page: 1,
          pageSize: 10,
        })
        .expect(200);

      expect(body.data).toMatchObject({
        items: expect.arrayContaining([
          expect.objectContaining({
            phone: testUsers[0].phone,
            name: testUsers[0].name,
          }),
        ]),
        meta: {
          currentPage: 1,
          itemsPerPage: 10,
          totalItems: expect.any(Number),
          totalPages: expect.any(Number),
          itemCount: expect.any(Number),
        },
      });
    });

    it('应该能按条件搜索用户', async () => {
      const { body } = await agent
        .get('/admin/user/list')
        .set('Authorization', `Bearer ${managerToken}`)
        .query({
          phone: testUsers[0].phone,
          status: 1,
        })
        .expect(200);

      expect(body.data.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            phone: testUsers[0].phone,
            status: UserStatus.OPEN,
          }),
        ]),
      );
    });

    it('应该能获取用户详情', async () => {
      const user = await userModel.findOne({ phone: testUsers[0].phone });

      const { body } = await agent
        .get(`/admin/user/${user.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(body.data).toMatchObject({
        phone: testUsers[0].phone,
        name: testUsers[0].name,
        status: UserStatus.OPEN,
      });
    });

    it('应该能更新用户状态', async () => {
      const user = await userModel.findOne({ phone: testUsers[0].phone });

      const { body } = await agent
        .put(`/admin/user/${user.id}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 0 })
        .expect(200);

      const updatedUser = await userModel.findById(user.id);
      expect(updatedUser.status).toBe(UserStatus.STOP);
    });

    it('应该能删除用户', async () => {
      const user = await userModel.findOne({ phone: testUsers[0].phone });

      await agent
        .delete(`/admin/user/${user.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      const deletedUser = await userModel.findById(user.id);
      expect(deletedUser.status).toBe(UserStatus.DELETE);
    });

    it('未登录时不能访问管理接口', async () => {
      const { body } = await agent.get('/admin/user/list').expect(401);

      expect(body.code).not.toBe(0);
    });

    it('应该能正确处理不存在的用户ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const { body: getBody } = await agent
        .get(`/admin/user/${fakeId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      if (getBody.data === null) {
        expect(getBody.data).toBeNull();
      } else {
        expect(getBody.code).not.toBe(0);
      }

      const { body: updateBody } = await agent
        .put(`/admin/user/${fakeId}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 0 })
        .expect(200);

      expect(updateBody.code).not.toBe(0);

      const { body: deleteBody } = await agent
        .delete(`/admin/user/${fakeId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(deleteBody.code).not.toBe(0);
    });
  });

  afterAll(async () => {
    // 清理测试数据
    await userModel.deleteMany({
      phone: { $in: testUsers.map((u) => u.phone) },
    });
    await managerModel.deleteMany({ account: testManager.account });
  });
});
