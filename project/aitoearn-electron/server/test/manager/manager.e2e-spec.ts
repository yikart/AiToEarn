import { Agent } from '../agent';
import supertest from 'supertest';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Manager, ManagerStatus } from '../../src/db/schema/manager.schema';
import { encryptPassword } from '../../src/util/password.util';
import {
  ErrHttpBack,
  ErrHttpBackMap,
} from '../../src/filters/http-exception.back-code';

describe('ManagerController (e2e)', () => {
  let agent: supertest.Agent;
  let managerModel: Model<Manager>;
  const testAccount = 'testadmin';
  const testPassword = '123456';
  const testName = '测试管理员';
  let managerToken: string;

  beforeAll(async () => {
    agent = Agent.get();
    managerModel = Agent.app().get(getModelToken(Manager.name));
  });

  beforeEach(async () => {
    await managerModel.deleteMany({ account: testAccount });
  });

  describe('管理员认证', () => {
    it('应该能创建管理员账号', async () => {
      // 先创建一个管理员用于创建其他管理员
      const { password, salt } = encryptPassword(
        '123456',
        '$2b$10$8n6z9rAh9rKfxoQkqxVqOe',
      );
      await managerModel.create({
        account: 'admin',
        password: password,
        salt: salt,
        name: '超级管理员',
        status: ManagerStatus.OPEN,
      });

      // 登录获取token
      const { body } = await agent.post('/manager/login').send({
        account: 'admin',
        password: '123456',
      });

      managerToken = body.data.token;

      // 创建新管理员
      const createRes = await agent
        .post('/manager')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          account: testAccount,
          password: testPassword,
          name: testName,
        });

      expect(createRes.body.data).toMatchObject({
        account: testAccount,
        name: testName,
        status: ManagerStatus.OPEN,
      });

      // 清理测试数据
      await managerModel.deleteMany({ account: 'admin' });
    });

    it('应该能登录管理员账号', async () => {
      // 先创建管理员
      const { password, salt } = encryptPassword(
        testPassword,
        '$2b$10$8n6z9rAh9rKfxoQkqxVqOe',
      );
      await managerModel.create({
        account: testAccount,
        password: password,
        salt: salt,
        name: testName,
        status: ManagerStatus.OPEN,
      });

      const { body } = await agent.post('/manager/login').send({
        account: testAccount,
        password: testPassword,
      });

      expect(body.data).toMatchObject({
        token: expect.any(String),
        managerInfo: expect.objectContaining({
          account: testAccount,
          name: testName,
          status: ManagerStatus.OPEN,
        }),
      });

      managerToken = body.data.token;
    });

    it('密码错误时不能登录', async () => {
      const { password, salt } = encryptPassword(
        testPassword,
        '$2b$10$8n6z9rAh9rKfxoQkqxVqOe',
      );
      await managerModel.create({
        account: testAccount,
        password: password,
        salt: salt,
        name: testName,
        status: ManagerStatus.OPEN,
      });
      const { body } = await agent
        .post('/manager/login')
        .send({
          account: testAccount,
          password: 'wrongpassword',
        })
        .expect(200);

      expect(body.code).toBe(
        ErrHttpBackMap.get(ErrHttpBack.err_no_power_login).errCode,
      );
    });
  });

  describe('管理员信息管理', () => {
    beforeEach(async () => {
      const { password, salt } = encryptPassword(
        testPassword,
        '$2b$10$8n6z9rAh9rKfxoQkqxVqOe',
      );
      // 创建测试管理员并登录
      await managerModel.create({
        account: testAccount,
        password: password,
        salt: salt,
        name: testName,
        status: ManagerStatus.OPEN,
      });

      const { body } = await agent.post('/manager/login').send({
        account: testAccount,
        password: testPassword,
      });

      managerToken = body.data.token;
    });

    it('应该能获取管理员信息', async () => {
      const { body } = await agent
        .get('/manager/info')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(body.data).toMatchObject({
        account: testAccount,
        name: testName,
        status: ManagerStatus.OPEN,
      });
    });

    it('应该能更新管理员信息', async () => {
      const newName = '新名字';
      const { body } = await agent
        .put('/manager')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: newName })
        .expect(200);

      expect(body.data).toMatchObject({
        account: testAccount,
        name: newName,
        status: ManagerStatus.OPEN,
      });
    });

    it('应该能删除管理员', async () => {
      await agent
        .delete('/manager')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      const manager = await managerModel.findOne({ account: testAccount });
      expect(manager.status).toBe(ManagerStatus.DELETE);
    });
  });

  afterEach(async () => {
    await managerModel.deleteMany({ account: testAccount });
  });
});
