import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { WechatChannelsConfig } from './wechat.config'

/**
 * WeChat message encryption/decryption service.
 *
 * Implements the WeChat Official Account message encryption protocol:
 * - Signature verification (SHA1)
 * - AES-256-CBC message encryption/decryption
 * - XML message wrapping/unwrapping
 *
 * @see https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Service_Center_Messages.html
 */
@Injectable()
export class WeChatMsgCryptoService {
  private readonly logger = new Logger(WeChatMsgCryptoService.name)

  constructor(private readonly cfg: WechatChannelsConfig) {}

  private get aesKey(): Buffer {
    return Buffer.from(`${this.cfg.encodingAESKey}=`, 'base64')
  }

  /**
   * Verify the signature from WeChat callback.
   *
   * @param signature - The signature from query params
   * @param timestamp - The timestamp from query params
   * @param nonce - The nonce from query params
   * @param encrypt - Optional encrypted message body (for encrypted mode)
   * @returns Whether the signature is valid
   */
  verifySignature(
    signature: string,
    timestamp: string,
    nonce: string,
    encrypt?: string,
  ): boolean {
    const computed = this.computeSignature(timestamp, nonce, encrypt)
    return computed === signature
  }

  /**
   * Compute SHA1 signature for WeChat verification.
   */
  computeSignature(timestamp: string, nonce: string, encrypt?: string): string {
    const parts = [this.cfg.token, timestamp, nonce]
    if (encrypt) {
      parts.push(encrypt)
    }
    parts.sort()

    return createHash('sha1').update(parts.join('')).digest('hex')
  }

  /**
   * Decrypt an encrypted WeChat message.
   *
   * @param encryptedBase64 - The Base64-encoded encrypted message
   * @returns The decrypted XML message content
   */
  decrypt(encryptedBase64: string): string {
    const encrypted = Buffer.from(encryptedBase64, 'base64')
    const iv = this.aesKey.slice(0, 16)

    const decipher = createDecipheriv('aes-256-cbc', this.aesKey, iv)
    decipher.setAutoPadding(false)

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ])

    // Remove PKCS7 padding
    const pad = decrypted[decrypted.length - 1]
    if (pad < 1 || pad > 32) {
      const err = new WeChatCryptoError(`Invalid PKCS7 padding: ${pad}`)
      this.logger.error(err, 'Failed to decrypt WeChat message')
      throw err
    }

    const content = decrypted.slice(0, decrypted.length - pad)

    // Content format: 16 bytes random + 4 bytes length + message + appId
    const messageLength = content.readUInt32BE(16)
    const message = content.slice(20, 20 + messageLength).toString('utf8')
    const extractedAppId = content.slice(20 + messageLength).toString('utf8')

    if (extractedAppId !== this.cfg.appId) {
      const err = new WeChatCryptoError(`AppId mismatch: expected ${this.cfg.appId}, got ${extractedAppId}`)
      this.logger.error(err, 'Failed to decrypt WeChat message')
      throw err
    }

    return message
  }

  /**
   * Encrypt a message for WeChat encrypted mode reply.
   *
   * @param message - The plain XML message to encrypt
   * @returns Base64-encoded encrypted message
   */
  encrypt(message: string): string {
    const randomPrefix = randomBytes(16)
    const messageBuffer = Buffer.from(message, 'utf8')
    const lengthBuffer = Buffer.alloc(4)
    lengthBuffer.writeUInt32BE(messageBuffer.length, 0)
    const appIdBuffer = Buffer.from(this.cfg.appId, 'utf8')

    const content = Buffer.concat([randomPrefix, lengthBuffer, messageBuffer, appIdBuffer])

    // PKCS7 padding
    const blockSize = 32
    const padLength = blockSize - (content.length % blockSize)
    const padding = Buffer.alloc(padLength, padLength)
    const padded = Buffer.concat([content, padding])

    const iv = this.aesKey.slice(0, 16)
    const cipher = createCipheriv('aes-256-cbc', this.aesKey, iv)
    cipher.setAutoPadding(false)

    const encrypted = Buffer.concat([cipher.update(padded), cipher.final()])

    return encrypted.toString('base64')
  }

  /**
   * Build encrypted reply XML.
   *
   * @param encryptedMsg - The encrypted message (Base64)
   * @param timestamp - Current timestamp
   * @param nonce - Random nonce
   * @returns Complete XML reply with encryption envelope
   */
  buildEncryptedReplyXml(encryptedMsg: string, timestamp: string, nonce: string): string {
    const signature = this.computeSignature(timestamp, nonce, encryptedMsg)

    return [
      '<xml>',
      `<Encrypt><![CDATA[${encryptedMsg}]]></Encrypt>`,
      `<MsgSignature><![CDATA[${signature}]]></MsgSignature>`,
      `<TimeStamp>${timestamp}</TimeStamp>`,
      `<Nonce><![CDATA[${nonce}]]></Nonce>`,
      '</xml>',
    ].join('')
  }

  /**
   * Parse encrypted XML body from WeChat callback.
   *
   * @param xml - The raw XML body from WeChat
   * @returns The extracted Encrypt field value
   */
  parseEncryptedXml(xml: string): string | null {
    const match = xml.match(/<Encrypt><!\[CDATA\[(.+?)\]\]><\/Encrypt>/)
    return match?.[1] ?? null
  }
}

export class WeChatCryptoError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WeChatCryptoError'
  }
}
