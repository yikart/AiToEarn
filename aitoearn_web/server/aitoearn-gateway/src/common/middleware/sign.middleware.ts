// TODO: 暂未使用
import * as crypto from 'node:crypto'
import { Injectable, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'

@Injectable()
export class SignMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 获取请求头中的签名信息
    const signature = req.headers['x-signature'] as string
    const timestamp = req.headers['x-timestamp'] as string
    const nonce = req.headers['x-nonce'] as string

    // 检查必要参数
    if (!signature || !timestamp || !nonce) {
      return res.status(401).json({
        code: 401,
        message: '缺少签名参数',
      })
    }

    // 验证时间戳（例如限制在5分钟内）
    const now = Date.now()
    if (Math.abs(now - Number.parseInt(timestamp)) > 5 * 60 * 1000) {
      return res.status(401).json({
        code: 401,
        message: '请求已过期',
      })
    }

    // 构建待签名字符串
    const signString = this.buildSignString(req, timestamp, nonce)

    // 获取密钥（应从环境变量或配置中获取）
    const secret = process.env.SIGN_SECRET || 'your-secret-key'

    // 计算签名
    const expectedSignature = this.generateSignature(signString, secret)

    // 验证签名
    if (signature !== expectedSignature) {
      return res.status(401).json({
        code: 401,
        message: '签名验证失败',
      })
    }

    // 签名验证通过，继续执行后续操作
    next()
  }

  /**
   * 构建待签名字符串
   * @param req 请求对象
   * @param timestamp 时间戳
   * @param nonce 随机数
   * @returns 待签名字符串
   */
  private buildSignString(req: Request, timestamp: string, nonce: string): string {
    // 提取请求参数
    let params: Record<string, any> = {}

    // 合并查询参数和body参数
    if (req.query) {
      params = { ...params, ...req.query }
    }

    if (req.body && typeof req.body === 'object') {
      params = { ...params, ...req.body }
    }

    // 按键名排序参数
    const sortedKeys = Object.keys(params).sort()
    const sortedParams: Record<string, any> = {}
    sortedKeys.forEach((key) => {
      sortedParams[key] = params[key]
    })

    // 构建参数字符串
    const paramsStr = JSON.stringify(sortedParams)

    // 构建待签名字符串: 方法 + URL + 参数 + 时间戳 + 随机数
    return `${req.method}${req.originalUrl}${paramsStr}${timestamp}${nonce}`
  }

  /**
   * 生成签名
   * @param signString 待签名字符串
   * @param secret 密钥
   * @returns 签名
   */
  private generateSignature(signString: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(signString)
      .digest('hex')
  }
}
