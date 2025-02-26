/*
 * @Author: nevin
 * @Date: 2025-01-24 17:55:22
 * @LastEditTime: 2025-02-13 21:15:38
 * @LastEditors: nevin
 * @Description:
 */
import 'reflect-metadata';
import { ipcMain } from 'electron';
import { container } from './container';
import { INJECT_METADATA_KEY } from './metadata';
import { Event } from '../../global/event';
import { scheduleJob, scheduleJobMap } from '../../global/schedule';

// Module 装饰器
export function Module(metadata: {
  imports?: any[];
  controllers?: any[];
  providers?: any[];
}) {
  return function (target: any) {
    // 只注册 providers 和 controllers，不立即初始化
    metadata.providers?.forEach((provider) => {
      container.registerProvider(provider);
    });

    metadata.controllers?.forEach((controller) => {
      const controllerName = controller.name;
      if (!container.hasController(controllerName)) {
        const instance = new controller();
        container.setController(controllerName, instance);
      }
    });
  };
}

// Inject 装饰器
export function Inject(serviceType: any) {
  return function (target: any, propertyKey: string) {
    const injections =
      Reflect.getMetadata(INJECT_METADATA_KEY, target.constructor) || [];
    injections.push({ propertyKey, serviceType });
    Reflect.defineMetadata(INJECT_METADATA_KEY, injections, target.constructor);
  };
}

// Controller 装饰器
export function Controller() {
  return function (target: any) {
    Reflect.defineMetadata('isController', true, target);
  };
}

// Injectable 装饰器
export function Injectable() {
  return function (target: any) {
    Reflect.defineMetadata('isInjectable', true, target);
  };
}

// IPC 方法装饰器
export function Icp(channel: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    ipcMain.handle(channel, async (event, ...args) => {
      const controller = container.getController(target.constructor.name);
      if (!controller) {
        throw new Error(`Controller ${target.constructor.name} not found`);
      }
      return await originalMethod.bind(controller)(event, ...args);
    });

    return descriptor;
  };
}

// Event事件监听装饰器
export function Et(eventName: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    Event.on(eventName, async (...args) => {
      const controller = container.getController(target.constructor.name);
      if (!controller) {
        throw new Error(`Controller ${target.constructor.name} not found`);
      }
      return await originalMethod.bind(controller)(...args);
    });
  };
}

/**
 * 定时任务装饰器
 * @param cron
 * @param key
 * @returns
 */
export function Scheduled(cron: string, key?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    // 使用 node-schedule 创建定时任务
    const job = scheduleJob.scheduleJob(cron, async () => {
      const controller = container.getController(target.constructor.name);
      if (!controller) {
        throw new Error(`Controller ${target.constructor.name} not found`);
      }
      await originalMethod.bind(controller)();
    });

    if (!!key) scheduleJobMap.set(key, job);

    return descriptor;
  };
}
