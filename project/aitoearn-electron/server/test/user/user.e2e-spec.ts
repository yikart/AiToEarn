import { Agent } from '../agent';
import supertest from 'supertest';
import { UserStatus } from '../../src/db/schema/user.schema';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../src/db/schema/user.schema';
import { mockSmsService } from '../mocks/sms.mock';

describe('UserController (e2e)', () => {
  let agent: supertest.Agent;
  let userModel: Model<User>;
  const testPhone = '13800138001';
  const testPassword = '123456';
  let smsServiceMock;

  beforeAll(async () => {
    agent = Agent.get();
    userModel = Agent.app().get(getModelToken(User.name));
    smsServiceMock = mockSmsService();
  });

  beforeEach(async () => {
    await userModel.deleteMany({ phone: testPhone });
  });

  describe('用户注册登录', () => {
    it('应该能发送验证码', async () => {
      const { body } = await agent
        .post('/user/code')
        .send({ phone: testPhone })
        .expect(201);

      expect(body.data).toBe(true);
    });

    it('应该能注册新用户', async () => {
      const { body } = await agent.post('/user/add').send({
        phone: testPhone,
        password: testPassword,
        code: '123456',
      });
      expect(body.data).toMatchObject({
        token: expect.any(String),
        userInfo: expect.objectContaining({
          phone: testPhone,
          status: UserStatus.OPEN,
        }),
      });
    });

    it('应该能通过密码登录', async () => {
      // 先创建用户
      await agent.post('/user/add').send({
        phone: testPhone,
        password: testPassword,
        code: '123456',
      });

      const { body } = await agent.post('/user/login/password').send({
        phone: testPhone,
        password: testPassword,
      });

      expect(body.data).toMatchObject({
        token: expect.any(String),
        userInfo: expect.objectContaining({
          phone: testPhone,
          status: UserStatus.OPEN,
        }),
      });
    });

    it('应该能通过验证码登录', async () => {
      // 先发送验证码
      await agent.post('/user/code').send({ phone: testPhone });

      const { body } = await agent
        .post('/user/login/code/phone')
        .send({
          phone: testPhone,
          code: '123456', // 测试环境验证码固定为123456
        })
        .expect(201);

      expect(body.data).toMatchObject({
        token: expect.any(String),
        exp: expect.any(Number),
        userInfo: expect.objectContaining({
          phone: testPhone,
          status: UserStatus.OPEN,
        }),
      });
    });
  });

  describe('用户信息管理', () => {
    let token: string;

    beforeEach(async () => {
      // 创建测试用户并登录
      const { body } = await agent.post('/user/add').send({
        phone: testPhone,
        password: testPassword,
        code: '123456',
      });
      token = body.data.token;
      agent.set('Authorization', `Bearer ${token}`);
    });

    it('应该能获取用户信息', async () => {
      const { body } = await agent.get('/user/mine').expect(200);

      expect(body.data).toMatchObject({
        phone: testPhone,
        status: UserStatus.OPEN,
      });
    });

    it('应该能更新用户信息', async () => {
      const newName = '测试用户';
      const { body } = await agent
        .put('/user/info/update')
        .send({ name: newName })
        .expect(200);

      expect(body.data).toMatchObject({
        name: newName,
        phone: testPhone,
      });
    });

    it('应该能修改密码', async () => {
      const newPassword = '654321';
      await agent
        .post('/user/password/change')
        .send({ password: newPassword })
        .expect(201);

      // 验证新密码是否生效
      const { body } = await agent
        .post('/user/login/password')
        .send({
          phone: testPhone,
          password: newPassword,
        })
        .expect(201);

      expect(body.data.userInfo).toMatchObject({
        phone: testPhone,
        status: UserStatus.OPEN,
      });
    });

    it('应该能刷新token', async () => {
      const { body } = await agent.post('/user/token/refresh').expect(201);

      expect(body.data).toMatchObject({
        token: expect.any(String),
      });
    });

    it('应该能注销账号', async () => {
      await agent.delete('/user/del');

      // 验证用户状态是否更新
      const userInfo = await userModel.findOne({ phone: testPhone });

      expect(userInfo.status).toBe(UserStatus.DELETE);
    });
  });

  afterAll(async () => {
    await userModel.deleteMany({ phone: testPhone });
    smsServiceMock.restore();
  });
});
