/**
 * 初始化脚本 - 创建默认用户并生成自动登录 token
 * 通过 docker-compose aitoearn-init 服务运行
 */

import { MongoClient } from 'mongodb'
import jwt from 'jsonwebtoken'
import { writeFileSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import crypto from 'crypto'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:password@mongodb:27017'
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-jwt-secret'
const DB_NAME = process.env.DB_NAME || 'aitoearn'
const TOKEN_PATH = process.env.AUTO_LOGIN_TOKEN_PATH || '/data/init/token.txt'
const DEFAULT_EMAIL = 'admin@aitoearn.local'

async function main() {
  const client = new MongoClient(MONGO_URI)
  await client.connect()
  console.log('Connected to MongoDB')

  const db = client.db(DB_NAME)
  const users = db.collection('users')

  let user = await users.findOne({ mail: DEFAULT_EMAIL, isDelete: { $ne: true } })

  if (!user) {
    const now = new Date()
    const result = await users.insertOne({
      name: 'Admin',
      mail: DEFAULT_EMAIL,
      status: 1,
      userType: 'CREATOR',
      isDelete: false,
      score: 0,
      usedStorage: 0,
      storage: { total: 524288000 },
      locale: 'en-US',
      createdAt: now,
      updatedAt: now,
    })
    user = { _id: result.insertedId, mail: DEFAULT_EMAIL, name: 'Admin' }

    // 生成 popularizeCode（复用后端算法）
    const identifier = DEFAULT_EMAIL
    const phoneHash = crypto
      .createHash('sha256')
      .update(identifier)
      .digest('hex')
      .substring(0, 16)
    const combinedSalt = `aitoearn${phoneHash}`
    const hash = crypto
      .createHash('sha256')
      .update(user._id.toString())
      .update(combinedSalt)
      .digest('hex')
    const numericValue = parseInt(hash.substring(0, 6), 16)
    const code = numericValue
      .toString(36)
      .slice(-5)
      .toUpperCase()
      .padStart(5, '0')

    await users.updateOne({ _id: user._id }, { $set: { popularizeCode: code } })
    console.log(`Created default user: ${DEFAULT_EMAIL}`)
  } else {
    console.log(`Found existing user: ${DEFAULT_EMAIL}`)
  }

  const token = jwt.sign(
    { id: user._id.toString(), mail: user.mail, name: user.name },
    JWT_SECRET,
    { expiresIn: '100y' },
  )

  mkdirSync(dirname(TOKEN_PATH), { recursive: true })
  writeFileSync(TOKEN_PATH, token)
  console.log(`Token written to ${TOKEN_PATH}`)

  await client.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
