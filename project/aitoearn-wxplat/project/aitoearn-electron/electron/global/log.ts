/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-02-22 19:21:08
 * @LastEditors: nevin
 * @Description: 日志组件
 */
import * as path from 'path';
import { app, ipcMain } from 'electron';
import fs from 'fs';

import log from 'electron-log/main';

// 创建logs目录并配置日志路径
const logDirectory = path.join(app.getPath('userData'), 'logs');

log.transports.file.level = 'info';
log.transports.file.maxSize = 10 * 1024 * 1024; // 10MB
log.transports.file.resolvePathFn = () => {
  return path.join(
    logDirectory,
    `${new Date().toISOString().slice(0, 10)}.log`,
  );
}; // 按天生成日志

log.initialize();

console.log = log.log;
console.error = log.error;

export const logger = log;

export default log;

// 导出路径
export const logPath = logDirectory;

/**
 * 获取近N天的文件路径列表
 * @param days
 * @returns
 */
export function getLogFilePaths(days: number): string[] {
  const logFiles = fs.readdirSync(logDirectory);
  const logFilePaths = logFiles
    .filter((file) => file.endsWith('.log'))
    .map((file) => path.join(logDirectory, file))
    .filter((filePath) => {
      const fileStat = fs.statSync(filePath);
      const fileDate = new Date(fileStat.mtime);
      return fileDate >= new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    });

  return logFilePaths;
}

/**
 * 清理一周前的日志
 */
export function clearOldLogs() {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const logFiles = fs.readdirSync(logDirectory);
  const logFilePaths = logFiles
    .filter((file) => file.endsWith('.log'))
    .map((file) => path.join(logDirectory, file))
    .filter((filePath) => {
      const fileStat = fs.statSync(filePath);
      return fileStat.mtime.getTime() < oneWeekAgo;
    });

  logFilePaths.forEach((filePath) => {
    fs.unlinkSync(filePath);
  });
}

/**
 * 获取日志文件列表
 */
ipcMain.handle('GLOBAL_LOG_GET_FLIES', async (event, days) => {
  const res = getLogFilePaths(days || 7);
  return res;
});
