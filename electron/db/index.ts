/*
 * @Author: nevin
 * @Date: 2025-01-20 16:22:03
 * @LastEditTime: 2025-03-18 22:53:17
 * @LastEditors: nevin
 * @Description: 数据库
 */
import { DataSource } from 'typeorm';
import { AccountModel } from './models/account';
import { UserModel } from './models/user';
import { PubRecordModel } from './models/pubRecord';
import { VideoModel } from './models/video';
import { AccountStatsModel } from './models/accountStats';
import { VideoStatsModel } from './models/videoStats';
import * as migrations from './migrations';
import path from 'path';
import { app } from 'electron';
import { isDev } from '../util';
import fs from 'fs/promises';
import { asyData as accountExamine } from './scripts/account';
import { logger } from '../global/log';
import { AutoRunModel } from './models/autoRun';
import { AutoRunRecordModel } from './models/autoRunRecord';

const configPath = app.getPath('userData');
const database = path.join(configPath, 'database.sqlite');
logger.log('att database path:', database);

export const AppDataSource = new DataSource({
  type: 'better-sqlite3', // 设定链接的数据库类型
  database, // 数据库存放地址
  synchronize: true, // 确保每次运行应用程序时实体都将与数据库同步
  logging: false, // 日志，默认在控制台中打印，数组列举错误类型枚举
  entities: [
    AccountModel,
    UserModel,
    PubRecordModel,
    VideoModel,
    AccountStatsModel,
    VideoStatsModel,
    AutoRunModel,
    AutoRunRecordModel,
  ], // 实体或模型表
  migrations: Object.values(migrations), // 迁移类
  migrationsRun: true, // 确保在连接时自动运行迁移
});

/**
 * 初始化sqlite3数据库
 */
export async function initSqlite3Db() {
  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
      await AppDataSource.runMigrations();
      // 运行账号检查
      await accountExamine(AppDataSource);
      return true;
    } catch (error) {
      logger.error('Error during database initialization:', error);
      return false;
    }
  }
  return true;
}

/**
 * 导出数据库到SQL文件
 * @param filePath 导出文件路径
 */
export async function exportDatabase(filePath: string): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      logger.error('Database is not initialized');
      throw new Error('Database is not initialized');
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // 获取所有表的数据
    const tables = AppDataSource.entityMetadatas.map(
      (entity) => entity.tableName,
    );
    let sqlContent = '';

    for (const table of tables) {
      const records = await queryRunner.query(`SELECT * FROM ${table}`);
      if (records.length > 0) {
        sqlContent += `-- Table: ${table}\n`;
        for (const record of records) {
          const columns = Object.keys(record).join(', ');
          const values = Object.values(record)
            .map((value) => {
              if (value === null) return 'NULL';
              if (typeof value === 'string')
                return `'${value.replace(/'/g, "''")}'`;
              return value;
            })
            .join(', ');
          sqlContent += `INSERT INTO ${table} (${columns}) VALUES (${values});\n`;
        }
        sqlContent += '\n';
      }
    }

    await fs.writeFile(filePath, sqlContent, 'utf8');
    await queryRunner.release();
  } catch (error) {
    logger.error('Failed to export database:', error);
    throw error;
  }
}

/**
 * 从SQL文件导入数据
 * @param filePath SQL文件路径
 */
export async function importDatabase(filePath: string): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database is not initialized');
    }

    const sqlContent = await fs.readFile(filePath, 'utf8');
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 清空所有表
      const tables = AppDataSource.entityMetadatas.map(
        (entity) => entity.tableName,
      );
      for (const table of tables) {
        await queryRunner.query(`DELETE FROM ${table}`);
      }

      // 执行SQL语句
      const statements = sqlContent
        .split('\n')
        .filter((line) => line.trim() && !line.startsWith('--'))
        .join('\n')
        .split(';')
        .filter((statement) => statement.trim());

      for (const statement of statements) {
        await queryRunner.query(statement);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    logger.error('Failed to import database:', error);
    throw error;
  }
}
