import { Controller, Icp, Inject } from '../core/decorators';
import { BackupService } from './service';

@Controller()
export class BackupController {
  @Inject(BackupService)
  private readonly backupService!: BackupService;

  /**
   * 创建备份
   * @param name 备份名称（可选）
   * @returns 备份文件路径
   */
  @Icp('backup:create')
  async createBackup(
    event: Electron.IpcMainInvokeEvent,
    name?: string,
  ): Promise<string> {
    return await this.backupService.createBackup(name);
  }

  /**
   * 从备份文件恢复
   * @param backupPath 备份文件路径
   */
  @Icp('backup:restore')
  async restoreFromBackup(
    event: Electron.IpcMainInvokeEvent,
    backupPath: string,
  ): Promise<void> {
    await this.backupService.restoreFromBackup(backupPath);
  }
}
