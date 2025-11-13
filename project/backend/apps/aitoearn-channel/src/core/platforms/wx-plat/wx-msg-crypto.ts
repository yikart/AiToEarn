import * as crypto from 'node:crypto'

const ALGORITHM = 'aes-256-cbc' // 使用的加密算法
const MSG_LENGTH_SIZE = 4 // 存放消息体尺寸的空间大小。单位：字节
const RANDOM_BYTES_SIZE = 16 // 随机数据的大小。单位：字节

/**
 * 解密数据
 * @param {*} encryptdMsg 加密消息体
 * @param {*} encodingAESKey AES 加密密钥
 * @returns
 */
export function decode(encryptdMsg: string, encodingAESKey: string) {
  const key = Buffer.from(`${encodingAESKey}=`, 'base64') // 解码密钥
  const iv = key.subarray(0, 16) // 初始化向量为密钥的前16字节
  const encryptedMsgBuf = Buffer.from(encryptdMsg, 'base64') // 将 base64 编码的数据转成 buffer
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv) // 创建解密器实例
  decipher.setAutoPadding(false) // 禁用默认的数据填充方式
  let decryptdBuf = Buffer.concat([
    decipher.update(encryptedMsgBuf),
    decipher.final(),
  ]) // 解密后的数据

  const padSize = decryptdBuf[decryptdBuf.length - 1]
  decryptdBuf = decryptdBuf.subarray(0, decryptdBuf.length - padSize) // 去除填充的数据

  const msgSize = decryptdBuf.readUInt32BE(RANDOM_BYTES_SIZE) // 根据指定偏移值，从 buffer 中读取消息体的大小，单位：字节
  const msgBufStartPos = RANDOM_BYTES_SIZE + MSG_LENGTH_SIZE // 消息体的起始位置
  const msgBufEndPos = msgBufStartPos + msgSize // 消息体的结束位置

  const msgBuf = decryptdBuf.subarray(msgBufStartPos, msgBufEndPos) // 从 buffer 中提取消息体

  return msgBuf.toString() // 将消息体转成字符串，并返回数据
}

/**
 * 生成签名
 * @param {*} encrypt 加密消息体
 * @param {*} timestamp 时间戳
 * @param {*} nonce 随机数
 * @param {*} token 令牌
 * @returns
 */
export function genSign(
  encrypt: string,
  timestamp: string,
  nonce: string,
  token: string,
) {
  const rawStr = [token, timestamp, nonce, encrypt].sort().join('') // 原始字符串
  const signature = crypto.createHash('sha1').update(rawStr).digest('hex') // 计算签名
  return signature
}
