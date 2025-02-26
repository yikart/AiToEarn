// import { AccountModel } from '../models/account';
import { DataSource } from 'typeorm';

export async function examine(db: DataSource): Promise<boolean> {
  // try {
  //   // 确保 db 对象已定义
  //   if (!db.isInitialized) {
  //     throw new Error('Data Source is not initialized');
  //   }

  //   const columns = await db.query(`PRAGMA table_info(account);`);
  //   // 获取AccountModel的字段
  //   const modelColumns = Object.keys(AccountModel.prototype);

  //   // columns modelColumns进行对比
  //   // for (const column of columns) {
  //   //   if (!modelColumns.includes(column.name)) {
  //   //     return false;
  //   //   }
  //   // }
  // } catch (error) {
  // }

  return true;
}

/**
 * 数据迁移 TODO:
 * @param db
 * @returns
 */
export async function asyData(db: DataSource) {
  // 检查
  const res = await examine(db);
  if (res) return;

  // 数据迁移
}
