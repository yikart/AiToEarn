/**
 * 初始化脚本 - 创建默认用户。自动登录 token 仅在显式开发开关下生成。
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
const SYSTEM_ADMIN_EMAIL = (process.env.SYSTEM_ADMIN_EMAIL || '').trim().toLowerCase()
const SYSTEM_ADMIN_PASSWORD = process.env.SYSTEM_ADMIN_PASSWORD || ''

function encryptPassword(password, salt = crypto.randomBytes(3).toString('base64')) {
  return {
    password: crypto
      .pbkdf2Sync(password, Buffer.from(salt, 'base64'), 10000, 16, 'sha1')
      .toString('base64'),
    salt,
  }
}

async function main() {
  const client = new MongoClient(MONGO_URI)
  await client.connect()
  console.log('Connected to MongoDB')

  const db = client.db(DB_NAME)
  const users = db.collection('user')

  if (!SYSTEM_ADMIN_EMAIL) {
    console.log('SYSTEM_ADMIN_EMAIL not configured; default admin bootstrap skipped')
    await client.close()
    return
  }

  let user = await users.findOne({ mail: SYSTEM_ADMIN_EMAIL, isDelete: { $ne: true } })
  const passwordPatch = SYSTEM_ADMIN_PASSWORD
    ? encryptPassword(SYSTEM_ADMIN_PASSWORD)
    : null

  if (!user) {
    const now = new Date()
    const result = await users.insertOne({
      name: 'Admin',
      mail: SYSTEM_ADMIN_EMAIL,
      status: 1,
      userType: 'CREATOR',
      isDelete: false,
      score: 0,
      usedStorage: 0,
      storage: { total: 524288000 },
      locale: 'en-US',
      ...(passwordPatch || {}),
      createdAt: now,
      updatedAt: now,
    })
    user = { _id: result.insertedId, mail: SYSTEM_ADMIN_EMAIL, name: 'Admin' }

    // 生成 popularizeCode（复用后端算法）
    const identifier = SYSTEM_ADMIN_EMAIL
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
    console.log(`Created system admin user: ${SYSTEM_ADMIN_EMAIL}`)
  } else {
    if (passwordPatch) {
      await users.updateOne(
        { _id: user._id },
        { $set: { ...passwordPatch, updatedAt: new Date() } },
      )
      console.log(`Updated system admin password: ${SYSTEM_ADMIN_EMAIL}`)
    }
    else {
      console.log(`Found existing system admin user: ${SYSTEM_ADMIN_EMAIL}`)
    }
  }

  const token = jwt.sign(
    { id: user._id.toString(), mail: user.mail, name: user.name },
    JWT_SECRET,
    { expiresIn: '15m' },
  )

  if (process.env.ALLOW_BOOTSTRAP_AUTO_LOGIN === 'true' && process.env.NODE_ENV !== 'production') {
    mkdirSync(dirname(TOKEN_PATH), { recursive: true })
    writeFileSync(TOKEN_PATH, token)
    console.log(`Development auto-login token written to ${TOKEN_PATH}`)
  }
  else {
    console.log('Auto-login token generation skipped')
  }

  await client.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
