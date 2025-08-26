import type { IncomingMessage } from 'node:http'
/**
 * @module utils/ip
 * @description IP utility functions
 */
import axios from 'axios'

/* 判断IP是不是内网 */
function isLAN(ip: string) {
  ip.toLowerCase()
  if (ip === 'localhost')
    return true
  let a_ip = 0
  if (ip === '')
    return false
  const aNum = ip.split('.')
  if (aNum.length !== 4)
    return false
  a_ip += Number.parseInt(aNum[0]) << 24
  a_ip += Number.parseInt(aNum[1]) << 16
  a_ip += Number.parseInt(aNum[2]) << 8
  a_ip += Number.parseInt(aNum[3]) << 0
  a_ip = (a_ip >> 16) & 0xFFFF
  return (
    a_ip >> 8 === 0x7F
    || a_ip >> 8 === 0xA
    || a_ip === 0xC0A8
    || (a_ip >= 0xAC10 && a_ip <= 0xAC1F)
  )
}

export function getIp(request: IncomingMessage) {
  const req = request as any

  let ip: string
    = request.headers['x-forwarded-for']
      || request.headers['X-Forwarded-For']
      || request.headers['X-Real-IP']
      || request.headers['x-real-ip']
      || req?.ip
      || req?.raw?.connection?.remoteAddress
      || req?.raw?.socket?.remoteAddress
      || undefined
  if (ip && ip.split(',').length > 0)
    ip = ip.split(',')[0]

  return ip
}

export async function getIpAddress(ip: string) {
  if (isLAN(ip))
    return '内网IP'
  try {
    let { data } = await axios.get(
      `https://whois.pconline.com.cn/ipJson.jsp?ip=${ip}&json=true`,
      { responseType: 'arraybuffer' },
    )
    data = new TextDecoder('gbk').decode(data)
    data = JSON.parse(data)
    return data.addr.trim().split(' ').at(0)
  }
  catch (_error) {
    return '第三方接口请求失败'
  }
}
