import type { ForwardedRef } from 'react'
import { Button, Input, message } from 'antd'
import { forwardRef, memo, useEffect, useState } from 'react'
import styles from './proxyInput.module.scss'

export interface IProxyInputRef {}

export interface IProxyInputProps {
  onChange: (name: string) => void
}

export interface ProxyInfo {
  // 协议: 如 http, socks5
  protocol: string
  // IP+端口: 如 192.168.0.1:8000
  ipAndPort: string
  // 代理账号: 可选
  username?: string
  // 代理密码: 可选
  password?: string
  // 刷新URL: 可选
  refreshUrl?: string
  // 备注: 可选
  remark?: string
}

export function parseProxyString(proxyString: string): ProxyInfo | false {
  const regex
    = /^(?:(\w+):\/\/)?([\d.]+:\d+)(?::([^:]+):([^{}\s]+))?(?:\[(.*?)\])?(?:\{(.*?)\})?$/

  const match = proxyString.match(regex)
  if (!match) {
    return false // 无法解析则返回 false
  }

  const [, protocol, ipAndPort, username, password, refreshUrl, remark] = match

  return {
    protocol: protocol || 'http', // 如果未提供协议，默认为 http
    ipAndPort,
    username,
    password,
    refreshUrl,
    remark,
  }
}

// 验证代理地址
export async function verifyProxy(proxyName: string) {
  const proxyInfo = parseProxyString(proxyName)
  if (proxyInfo === false)
    return false
  return true
}

const ProxyInput = memo(
  forwardRef(
    ({ onChange }: IProxyInputProps, ref: ForwardedRef<IProxyInputRef>) => {
      const [proxyLoading, setProxyLoading] = useState(false)
      const [proxyName, setProxyName] = useState('')

      useEffect(() => {
        onChange(proxyName)
      }, [onChange, proxyName])

      return (
        <>
          <div
            className={`${styles.createGroup} ${styles.proxyInput}`}
            style={{ marginBottom: '20px' }}
          >
            <label>代理地址</label>
            <Input
              value={proxyName}
              placeholder="请输入代理地址"
              onChange={e => setProxyName(e.target.value)}
            />
            <Button
              disabled={proxyName.length === 0}
              loading={proxyLoading}
              onClick={async () => {
                const verifyRes = await verifyProxy(proxyName)
                if (verifyRes) {
                  message.success('代理地址可用')
                }
                else {
                  message.error('代理地址不可用')
                }
              }}
            >
              验证连接
            </Button>
          </div>
          <div className={styles.proxyHint}>
            <p>1. 代理类型仅支持HTTP、HTTPS、Socks5；</p>
            <p>支持以下填写格式</p>
            <p>
              192.168.0.1:8000
              {`{备注}`}
            </p>
            <p>
              192.168.0.1:8000:代理账号:代理密码
              {`{备注}`}
            </p>
            <p>
              socks5://192.168.0.1:8000:代理账号:代理密码
              {`{备注}`}
            </p>
          </div>
        </>
      )
    },
  ),
)

export default ProxyInput
