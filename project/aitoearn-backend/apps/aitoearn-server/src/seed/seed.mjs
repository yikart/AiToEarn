/**
 * Seed 脚本 - 创建 demo 账号、示例账号绑定与示例发布记录
 * 运行：pnpm nx run aitoearn-server:seed
 *
 * 说明：user 集合无密码字段，登录态为 JWT，因此脚本最后会输出
 * demo 账号的登录 token（与根目录 scripts/init.mjs 同一套做法）。
 */

import { createHash, createHmac, randomUUID } from 'node:crypto'
import mongoose from 'mongoose'

const MONGO_URI
  = process.env.MONGO_URI
    || 'mongodb://admin:password@localhost:27017/?authSource=admin&directConnection=true'
const DB_NAME = process.env.DB_NAME || 'aitoearn'
const CHANNEL_DB_NAME = process.env.CHANNEL_DB_NAME || 'aitoearn_channel'
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-jwt-secret'
const DEMO_MAIL = process.env.DEMO_MAIL || 'demo@aitoearn.dev'
const DEMO_NAME = 'Demo User'

// 生成 popularizeCode（复用根目录 scripts/init.mjs 的算法）
function genPopularizeCode(userId, identifier) {
  const phoneHash = createHash('sha256').update(identifier).digest('hex').substring(0, 16)
  const hash = createHash('sha256')
    .update(userId)
    .update(`aitoearn${phoneHash}`)
    .digest('hex')
  const numericValue = Number.parseInt(hash.substring(0, 6), 16)
  return numericValue.toString(36).slice(-5).toUpperCase().padStart(5, '0')
}

// HS256 JWT（避免额外依赖 jsonwebtoken）
function signToken(payload, secret) {
  const b64 = obj =>
    Buffer.from(JSON.stringify(obj)).toString('base64url')
  const header = b64({ alg: 'HS256', typ: 'JWT' })
  const body = b64(payload)
  const signature = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url')
  return `${header}.${body}.${signature}`
}

async function main() {
  await mongoose.connect(MONGO_URI, { dbName: DB_NAME })
  const db = mongoose.connection.db
  const channelDb = mongoose.connection.client.db(CHANNEL_DB_NAME)
  const now = new Date()

  // 1. demo 用户
  const users = db.collection('user')
  let user = await users.findOne({ mail: DEMO_MAIL, isDelete: { $ne: true } })
  if (!user) {
    const userId = randomUUID()
    const doc = {
      _id: userId,
      name: DEMO_NAME,
      mail: DEMO_MAIL,
      status: 1,
      userType: 'CREATOR',
      isDelete: false,
      score: 0,
      usedStorage: 0,
      storage: { total: 524288000 },
      locale: 'zh-CN',
      popularizeCode: genPopularizeCode(userId, DEMO_MAIL),
      createdAt: now,
      updatedAt: now,
    }
    await users.insertOne(doc)
    user = doc
    process.stdout.write(`[seed] 已创建用户 ${DEMO_MAIL} (id=${userId})` + '\n')
  }
  else {
    process.stdout.write(`[seed] 用户已存在 ${DEMO_MAIL} (id=${user._id})` + '\n')
  }
  const userId = user._id.toString()

  // 2. 默认账号分组
  const groups = db.collection('accountGroup')
  let group = await groups.findOne({ userId, isDefault: true })
  if (!group) {
    const result = await groups.insertOne({
      userId,
      isDefault: true,
      name: '默认分组',
      proxyIp: '',
      rank: 1,
      createdAt: now,
      updatedAt: now,
    })
    group = { _id: result.insertedId }
    process.stdout.write('[seed] 已创建默认账号分组' + '\n')
  }

  // 3. 示例平台账号绑定（主库 account + channel 库 channelAuthIdentity）
  const demoAccounts = [
    {
      _id: 'demo-account-douyin',
      type: 'douyin',
      uid: 'demo-douyin-uid',
      account: 'demo_douyin',
      nickname: '抖音示例账号',
    },
    {
      _id: 'demo-account-xhs',
      type: 'xhs',
      uid: 'demo-xhs-uid',
      account: 'demo_xhs',
      nickname: '小红书示例账号',
    },
  ]
  const accounts = db.collection('account')
  const identities = channelDb.collection('channelAuthIdentity')
  for (const item of demoAccounts) {
    await accounts.updateOne(
      { _id: item._id },
      {
        $set: {
          userId,
          type: item.type,
          uid: item.uid,
          account: item.account,
          nickname: item.nickname,
          avatar: '',
          loginCookie: '',
          token: '',
          fansCount: 1286,
          followingCount: 88,
          readCount: 52000,
          likeCount: 4300,
          collectCount: 560,
          forwardCount: 120,
          commentCount: 210,
          workCount: 32,
          income: 0,
          groupId: group._id.toString(),
          status: 1,
          rank: 1,
          loginTime: now,
          lastStatsTime: now,
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true },
    )
    await identities.updateOne(
      { platform: item.type, subjectUid: item.uid },
      {
        $set: { platform: item.type, subjectUid: item.uid, userId },
        $setOnInsert: { createdAt: now, updatedAt: now },
      },
      { upsert: true },
    )
    process.stdout.write(`[seed] 已创建示例账号绑定 ${item.type} (${item.nickname})` + '\n')
  }

  // 4. 示例发布记录
  const records = db.collection('publishRecord')
  const demoRecords = [
    {
      flowId: 'seed-flow-001',
      accountId: 'demo-account-douyin',
      accountType: 'douyin',
      uid: 'demo-douyin-uid',
      title: '【示例】我的第一条抖音视频',
      desc: '这是 seed 脚本生成的示例发布记录',
      topics: ['示例', 'seed'],
      status: 1,
      workLink: 'https://www.douyin.com/video/demo-seed-001',
    },
    {
      flowId: 'seed-flow-002',
      accountId: 'demo-account-xhs',
      accountType: 'xhs',
      uid: 'demo-xhs-uid',
      title: '【示例】小红书图文笔记',
      desc: '这是 seed 脚本生成的示例发布记录',
      topics: ['示例', 'seed'],
      status: 0,
    },
  ]
  for (const item of demoRecords) {
    await records.updateOne(
      { userId, flowId: item.flowId },
      {
        $set: {
          userId,
          type: 'video',
          title: item.title,
          desc: item.desc,
          topics: item.topics,
          accountId: item.accountId,
          accountType: item.accountType,
          uid: item.uid,
          publishTime: now,
          status: item.status,
          inQueue: false,
          queued: false,
          dataId: '',
          workLink: item.workLink,
          source: 'web',
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true },
    )
    process.stdout.write(`[seed] 已创建示例发布记录 ${item.flowId}` + '\n')
  }

  // 5. 输出 demo 登录 token（user 无密码字段，登录态为 JWT）
  const token = signToken(
    { id: userId, mail: DEMO_MAIL, name: DEMO_NAME, iat: Math.floor(now.getTime() / 1000) },
    JWT_SECRET,
  )
  process.stdout.write('' + '\n')
  process.stdout.write('[seed] 完成。demo 登录 token（100 年有效期，配合 JWT_SECRET 使用）：' + '\n')
  process.stdout.write(`${token}\n`)
  process.stdout.write('' + '\n')
  process.stdout.write('本地联调时，可在浏览器控制台执行：' + '\n')
  process.stdout.write(`  localStorage.setItem('<token 存储 key>', '${token}')` + '\n')

  await mongoose.disconnect()
}

main().catch((e) => {
  console.error('[seed] 失败：', e)
  process.exit(1)
})
