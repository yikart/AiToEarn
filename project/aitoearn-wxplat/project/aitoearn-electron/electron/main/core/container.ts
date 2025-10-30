/*
 * @Author: nevin
 * @Date: 2025-01-24 17:55:15
 * @LastEditTime: 2025-01-24 19:50:24
 * @LastEditors: nevin
 * @Description: 容器
 */
import { INJECT_METADATA_KEY } from './metadata';
// import { AppDataSource } from '../../db';

// 创建一个容器类来管理依赖注入
export class Container {
  private static instance: Container;
  private readonly providers = new Map<string, any>();
  private readonly providerClasses = new Map<string, any>();
  private readonly controllers = new Map<string, any>();
  // 用于检测循环依赖
  private readonly dependencyStack: string[] = [];

  private constructor() {}

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  // 注册 provider 类
  registerProvider(providerClass: any) {
    const providerName = providerClass.name;
    if (!this.providerClasses.has(providerName)) {
      // 检查依赖关系
      this.checkCircularDependencies(providerClass);
      this.providerClasses.set(providerName, providerClass);
    }
  }

  // 检查循环依赖
  private checkCircularDependencies(
    targetClass: any,
    visited = new Set<string>(),
  ) {
    const className = targetClass.name;

    if (visited.has(className)) {
      const dependencyPath = [...visited, className].join(' -> ');
      throw new Error(`Circular dependency detected: ${dependencyPath}`);
    }

    visited.add(className);

    const injections =
      Reflect.getMetadata(INJECT_METADATA_KEY, targetClass) || [];
    for (const { serviceType } of injections) {
      const dependencyClass = serviceType;
      this.checkCircularDependencies(dependencyClass, new Set(visited));
    }
  }

  // 获取或创建 provider 实例
  getProvider(name: string) {
    if (this.dependencyStack.includes(name)) {
      throw new Error(
        `Circular dependency detected: ${[...this.dependencyStack, name].join(
          ' -> ',
        )}`,
      );
    }

    if (!this.providers.has(name)) {
      const providerClass = this.providerClasses.get(name);
      if (!providerClass) {
        throw new Error(`Provider ${name} not registered`);
      }

      this.dependencyStack.push(name);
      const instance = new providerClass();
      this.injectDependencies(instance, providerClass);
      this.dependencyStack.pop();

      this.providers.set(name, instance);
    }
    return this.providers.get(name);
  }

  // 注入依赖
  private injectDependencies(instance: any, targetClass: any) {
    const injections =
      Reflect.getMetadata(INJECT_METADATA_KEY, targetClass) || [];
    injections.forEach(({ propertyKey, serviceType }: any) => {
      instance[propertyKey] = this.getProvider(serviceType.name);
    });
  }

  // Controller 相关方法
  setController(name: string, controller: any) {
    if (!this.controllers.has(name)) {
      this.injectDependencies(controller, controller.constructor);
      this.controllers.set(name, controller);
    }
  }

  getController(name: string) {
    return this.controllers.get(name);
  }

  hasController(name: string) {
    return this.controllers.has(name);
  }

  getAllProviders() {
    return this.providers;
  }

  getAllControllers() {
    return this.controllers;
  }

  // 添加初始化方法
  async initialize() {
    // 初始化所有已注册的 providers
    for (const [name, providerClass] of this.providerClasses.entries()) {
      if (!this.providers.has(name)) {
        const instance = new providerClass();
        this.injectDependencies(instance, providerClass);
        this.providers.set(name, instance);
      }
    }
  }
}

export const container = Container.getInstance();
