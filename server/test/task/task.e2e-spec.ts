import { Agent } from '../agent';
import supertest from 'supertest';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Task, TaskType } from '../../src/db/schema/task.schema';
import { UserTask, UserTaskStatus } from '../../src/db/schema/user-task.schema';
import { task, user } from '../mockData';

describe('TaskController (e2e)', () => {
  let agent: supertest.Agent;
  let taskModel: Model<Task>;
  let userTaskModel: Model<UserTask>;

  beforeAll(async () => {
    agent = Agent.get();

    taskModel = Agent.app().get(getModelToken(Task.name));
    userTaskModel = Agent.app().get(getModelToken(UserTask.name));
  });

  beforeEach(async () => {
    // 清理测试数据
    await taskModel.deleteMany({});
    await userTaskModel.deleteMany({});
  });

  describe('任务相关接口', () => {
    it('应该能获取任务列表', async () => {
      // 创建两个测试任务
      await taskModel.create([task, { ...task, title: '测试任务2' }]);

      const response = await agent
        .get('/tasks/list')
        .query({ page: 1, pageSize: 10 })
        .expect(200);

      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.meta.totalItems).toBe(2);
      expect(response.body.data.meta.currentPage).toBe(1);
      expect(response.body.data.meta.itemsPerPage).toBe(10);
    });

    it('应该能按条件筛选任务列表', async () => {
      // 创建两个测试任务，一个满足条件，一个不满足
      await taskModel.create([
        task,
        {
          ...task,
          type: TaskType.ARTICLE,
          requiresShoppingCart: false,
        },
      ]);

      const response = await agent
        .get('/tasks/list')
        .query({
          type: TaskType.PRODUCT,
          requiresShoppingCart: true,
        })
        .expect(200);

      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].type).toBe(TaskType.PRODUCT);
      expect(response.body.data.items[0].requiresShoppingCart).toBe(true);
    });

    it('应该能获取任务详情', async () => {
      const createdTask = await taskModel.create(task);

      const response = await agent
        .get(`/tasks/info/${createdTask._id}`)
        .expect(200);

      const { data } = response.body;
      expect(data.title).toBe(task.title);
      expect(data.type).toBe(task.type);
      expect(data.price).toBe(task.price);
      expect(data.commission).toBe(task.commission);
      expect(data.maxRecruits).toBe(task.maxRecruits);
      expect(data.deadline).toBe(task.deadline.toISOString());
      expect(data.firstTimeBonus).toBe(task.firstTimeBonus);
      expect(data.reward).toBe(task.reward);
    });

    it('应该能申请任务', async () => {
      const createdTask = await taskModel.create(task);

      // 申请任务
      await agent.post(`/tasks/apply/${createdTask._id}`).expect(201);

      // 验证用户任务记录
      const userTask = await userTaskModel.findOne({
        taskId: createdTask._id.toString(),
        userId: user._id.toString(),
      });
      expect(userTask).toBeDefined();
      expect(userTask.status).toBe(UserTaskStatus.PENDING);

      // 验证任务申请人数更新
      const updatedTask = await taskModel.findById(createdTask._id);
      expect(updatedTask.currentRecruits).toBe(1);
    });

    it('不能重复申请同一个任务', async () => {
      const createdTask = await taskModel.create(task);

      // 第一次申请成功
      await agent.post(`/tasks/apply/${createdTask._id}`).expect(201);

      // 第二次申请应该失败
      await agent.post(`/tasks/apply/${createdTask._id}`).expect(400);
    });

    it('任务招募人数达到上限时不能申请', async () => {
      // 创建一个已达到招募上限的任务
      const createdTask = await taskModel.create({
        ...task,
        currentRecruits: task.maxRecruits,
      });

      // 尝试申请任务，应该返回400错误
      await agent.post(`/tasks/apply/${createdTask._id}`).expect(400);
    });
  });
});
