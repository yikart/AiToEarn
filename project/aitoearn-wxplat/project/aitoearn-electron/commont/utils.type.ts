export interface ProxyInfo {
  // 协议: 如 http, socks5
  protocol: string;
  // IP+端口: 如 192.168.0.1:8000
  ipAndPort: string;
  // 代理账号: 可选
  username?: string;
  // 代理密码: 可选
  password?: string;
  // 刷新URL: 可选
  refreshUrl?: string;
  // 备注: 可选
  remark?: string;
}
