/**
 * IP地理位置获取测试页面
 * 用于测试IP获取功能是否正常工作
 */

import { useState } from 'react';
import { Button, Card, Space, Typography } from 'antd';
import { getIpLocation, IpLocationInfo } from '@/utils/ipLocation';

const { Title, Text, Paragraph } = Typography;

const IpTestPage = () => {
  const [ipInfo, setIpInfo] = useState<IpLocationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 测试获取IP地理位置信息
   */
  const handleTestIpLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await getIpLocation();
      setIpInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取IP信息失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>IP地理位置获取测试</Title>
      
      <Card title="功能说明" style={{ marginBottom: '20px' }}>
        <Paragraph>
          此页面用于测试IP地理位置获取功能。点击下方按钮将调用JSONP接口获取当前IP地址和地理位置信息。
        </Paragraph>
        <Paragraph>
          <Text code>https://ping0.cc/geo/jsonp/callback</Text> 接口将返回以下信息：
        </Paragraph>
        <ul>
          <li><Text strong>IP地址</Text>：当前访问者的公网IP地址</li>
          <li><Text strong>地理位置</Text>：IP地址对应的地理位置信息</li>
          <li><Text strong>ASN</Text>：自治系统号码</li>
          <li><Text strong>组织</Text>：网络服务提供商信息</li>
        </ul>
      </Card>

      <Card title="测试结果" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button 
            type="primary" 
            onClick={handleTestIpLocation}
            loading={loading}
            size="large"
          >
            {loading ? '获取中...' : '获取IP地理位置信息'}
          </Button>

          {error && (
            <Card size="small" style={{ backgroundColor: '#fff2f0', borderColor: '#ffccc7' }}>
              <Text type="danger">错误信息：{error}</Text>
            </Card>
          )}

          {ipInfo && (
            <Card size="small" style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>IP地址：</Text>
                  <Text copyable>{ipInfo.ip}</Text>
                </div>
                <div>
                  <Text strong>地理位置：</Text>
                  <Text>{ipInfo.location}</Text>
                </div>
                <div>
                  <Text strong>ASN：</Text>
                  <Text code>{ipInfo.asn}</Text>
                </div>
                <div>
                  <Text strong>组织：</Text>
                  <Text>{ipInfo.org}</Text>
                </div>
              </Space>
            </Card>
          )}
        </Space>
      </Card>

      <Card title="技术实现" style={{ marginBottom: '20px' }}>
        <Paragraph>
          <Text strong>实现方式：</Text> 使用JSONP（JSON with Padding）技术调用第三方IP地理位置服务
        </Paragraph>
        <Paragraph>
          <Text strong>核心代码：</Text>
        </Paragraph>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
{`// 创建动态回调函数
const callbackName = \`ipLocationCallback_\${Date.now()}_\${Math.random()}\`;

// 定义回调函数
window[callbackName] = (ip, location, asn, org) => {
  // 处理返回的数据
  resolve({ ip, location, asn, org });
};

// 动态加载script标签
const script = document.createElement('script');
script.src = \`https://ping0.cc/geo/jsonp/\${callbackName}\`;
document.head.appendChild(script);`}
        </pre>
      </Card>
    </div>
  );
};

export default IpTestPage;
