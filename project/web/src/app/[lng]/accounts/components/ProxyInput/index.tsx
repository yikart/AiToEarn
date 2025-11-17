import type { ForwardedRef } from 'react'
import { Button, Input, message } from 'antd'
import { forwardRef, memo, useEffect, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
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
    = /^(?:(\w+):\/\/)?([\d.]+:\d+)(?::([^:]+):([^{}\s[\]]+))?(?:\[([^\]]+)\])?(?:\{([^}]+)\})?$/

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
      const { t } = useTransClient('account')
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
            <label>{t('proxy.label')}</label>
            <Input
              value={proxyName}
              placeholder={t('proxy.placeholder')}
              onChange={e => setProxyName(e.target.value)}
            />
            <Button
              disabled={proxyName.length === 0}
              loading={proxyLoading}
              onClick={async () => {
                const verifyRes = await verifyProxy(proxyName)
                if (verifyRes) {
                  message.success(t('proxy.available'))
                }
                else {
                  message.error(t('proxy.unavailable'))
                }
              }}
            >
              {t('proxy.verify')}
            </Button>
          </div>
          <div className={styles.proxyHint}>
            <p>{t('proxy.hint.line1')}</p>
            <p>{t('proxy.hint.line2')}</p>
            <p>
              192.168.0.1:8000
              {`{${t('proxy.hint.remark')}}`}
            </p>
            <p>
              192.168.0.1:8000:{t('proxy.hint.username')}:{t('proxy.hint.password')}
              {`{${t('proxy.hint.remark')}}`}
            </p>
            <p>
              socks5://192.168.0.1:8000:{t('proxy.hint.username')}:{t('proxy.hint.password')}
              {`{${t('proxy.hint.remark')}}`}
            </p>
          </div>
        </>
      )
    },
  ),
)

export default ProxyInput
