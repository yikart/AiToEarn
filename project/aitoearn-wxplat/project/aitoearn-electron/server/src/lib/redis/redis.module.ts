/*
 * @Author: nevin
 * @Date: 2024-08-30 14:39:05
 * @LastEditTime: 2024-09-14 19:03:21
 * @LastEditors: nevin
 * @Description:
 */
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from './redis.constant';
import Redis from 'ioredis';
import redisConfig from '../../../config/redis.config';

@Global()
@Module({
  imports: [ConfigModule.forRoot({ load: [redisConfig] })],
  providers: [
    RedisService,
    {
      provide: REDIS_CLIENT,
      useFactory: async (configService: ConfigService) => {
        const client = new Redis(configService.get('REDIS_CONFIG'));
        console.log('Redis client connected.');
        client.on('error', (err) => {
          console.error('Redis client encountered an error:', err);
        });

        client.on('end', () => {
          console.log('Connection to Redis closed.');
        });

        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
