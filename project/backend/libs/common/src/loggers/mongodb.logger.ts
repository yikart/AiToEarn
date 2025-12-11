import type { DestinationStream } from 'pino'
import { Logger } from '@nestjs/common'
import * as winston from 'winston'
import { MongoDB } from 'winston-mongodb'

export interface MongoDBLoggerOptions {
  /**
   * MongoDB 连接 URL
   */
  db: string
  /**
   * 集合名称，默认为 'logs'
   */
  collection?: string
  /**
   * 日志级别，默认为 'info'
   */
  level?: string
  /**
   * 是否存储主机信息
   */
  storeHost?: boolean
  /**
   * 自定义字段
   */
  metaKey?: string
  /**
   * 日志过期时间（秒）
   */
  expireAfterSeconds?: number
  /**
   * 是否使用统一拓扑
   */
  useUnifiedTopology?: boolean
  /**
   * 是否封装字段
   */
  capped?: boolean
  /**
   * 封装集合大小（字节）
   */
  cappedSize?: number
  /**
   * 封装集合最大文档数
   */
  cappedMax?: number
}

export class MongoDBLogger implements DestinationStream {
  private readonly winstonLogger: winston.Logger
  private readonly nestLogger = new Logger(MongoDBLogger.name)

  constructor(private readonly options: MongoDBLoggerOptions) {
    const {
      db,
      collection = 'logs',
      level = 'info',
      storeHost = true,
      metaKey = 'metadata',
      expireAfterSeconds,
      useUnifiedTopology = true,
      capped = false,
      cappedSize,
      cappedMax,
    } = options

    // 创建 winston logger 实例
    this.winstonLogger = winston.createLogger({
      level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new MongoDB({
          db,
          collection,
          level,
          storeHost,
          metaKey,
          expireAfterSeconds,
          options: {
            useUnifiedTopology,
          },
          capped,
          cappedSize,
          cappedMax,
        }),
      ],
    })

    this.nestLogger.log(`MongoDB Logger initialized with collection: ${collection}`)
  }

  async write(msg: string): Promise<void> {
    try {
      const logData = JSON.parse(msg)
      const { level, msg: message, ...meta } = logData

      // 根据日志级别写入
      switch (level) {
        case 10: // trace
        case 20: // debug
          this.winstonLogger.debug(message, meta)
          break
        case 30: // info
          this.winstonLogger.info(message, meta)
          break
        case 40: // warn
          this.winstonLogger.warn(message, meta)
          break
        case 50: // error
          this.winstonLogger.error(message, meta)
          break
        case 60: // fatal
          this.winstonLogger.error(message, { ...meta, fatal: true })
          break
        default:
          this.winstonLogger.info(message, meta)
      }
    }
    catch (error) {
      this.nestLogger.error('Failed to write log to MongoDB', error)
    }
  }

  /**
   * 关闭 logger 连接
   */
  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.winstonLogger.close()
      this.winstonLogger.on('finish', () => {
        this.nestLogger.log('MongoDB Logger closed')
        resolve()
      })
      this.winstonLogger.on('error', (error) => {
        this.nestLogger.error('Error closing MongoDB Logger', error)
        reject(error)
      })
    })
  }
}
