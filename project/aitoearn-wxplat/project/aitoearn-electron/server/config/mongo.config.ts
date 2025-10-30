/*
 * @Author: nevin
 * @Date: 2024-08-30 14:58:16
 * @LastEditTime: 2025-02-25 16:52:34
 * @LastEditors: nevin
 * @Description: mongo数据库配置
 */
import { MongooseModuleFactoryOptions } from '@nestjs/mongoose';

export default (): { MONGO_CONFIG: MongooseModuleFactoryOptions } => ({
  MONGO_CONFIG: {
    uri: process.env.MONGO_URI || 'wwww',
    dbName: process.env.MONGO_DB || '',
  },
});
