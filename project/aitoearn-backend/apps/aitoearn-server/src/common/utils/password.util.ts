/*
 * @Author: nevin
 * @Date: 2022-01-21 09:50:47
 * @LastEditors: nevin
 * @LastEditTime: 2024-07-08 15:38:55
 * @Description: 认证模块-加密工具
 */
import * as crypto from 'node:crypto'

export interface Password {
  password: string // 密码
  salt: string // 盐
}

/**
 * 生成随机盐
 */
function makeSalt(): string {
  return crypto.randomBytes(3).toString('base64')
}

/**
 * Encrypt password
 * @param password 密码
 * @param salt 密码盐
 * @returns {
 * password, // 加密的密码
 *  salt
 * }
 */
export function encryptPassword(
  password: string,
  salt?: string,
): Password {
  salt = salt || makeSalt()

  // 10000 代表迭代次数 16代表长度
  password = crypto
    .pbkdf2Sync(password, Buffer.from(salt, 'base64'), 10000, 16, 'sha1')
    .toString('base64')
  return {
    password,
    salt,
  }
}

/**
 * 校验用户信息
 * @param userPassword 用户密码
 * @param userSalt 盐值
 * @param password 密码
 * @returns
 */
export function validatePassWord(
  userPassword: string,
  userSalt: string,
  password: string,
): boolean {
  // 通过密码盐，加密传参，再与数据库里的比较，判断是否相等
  const res = encryptPassword(password, userSalt)
  if (!res)
    return false
  return userPassword === res.password
}
