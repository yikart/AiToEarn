import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { exportDatabase, importDatabase } from '../../db';
import { Injectable } from '../core/decorators';

@Injectable()
export class BackupService {
  private backupDir: string;

  constructor() {
    // 在用户数据目录下创建备份文件夹
    this.backupDir = path.join(app.getPath('userData'), 'backups');
    this.initBackupDir();
  }

  /**
   * 初始化备份目录
   */
  private async initBackupDir() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create backup directory:', error);
    }
  }

  /**
   * 创建备份
   * @param name 备份名称（可选）
   * @returns 备份文件路径
   */
  async createBackup(name?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${name ? name + '_' : ''}${timestamp}.sql`;
    const backupPath = path.join(this.backupDir, fileName);

    try {
      await exportDatabase(backupPath);
      return backupPath;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * 从备份文件恢复
   * @param backupPath 备份文件路径
   */
  async restoreFromBackup(backupPath: string): Promise<void> {
    try {
      await importDatabase(backupPath);
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      throw error;
    }
  }
}
