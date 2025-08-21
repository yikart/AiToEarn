import React from 'react';
import { Modal, Button, Space, Typography } from 'antd';
import { DownloadOutlined, MobileOutlined, QrcodeOutlined } from '@ant-design/icons';
import { useTransClient } from '@/app/i18n/client';

const { Text, Paragraph } = Typography;

interface DownloadAppModalProps {
  visible: boolean;
  onClose: () => void;
  platform?: string; // 平台名称，如"小红书"
  appName?: string; // app名称
  downloadUrl?: string; // 下载链接
  qrCodeUrl?: string; // 二维码图片URL
}

/**
 * 下载App提示弹窗组件
 * 用于提示用户下载对应的移动端应用
 */
const DownloadAppModal: React.FC<DownloadAppModalProps> = ({
  visible,
  onClose,
  platform = "小红书",
  appName = "小红书App",
  downloadUrl,
  qrCodeUrl
}) => {
  const { t } = useTransClient("common");

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  const handleCopyLink = () => {
    if (downloadUrl) {
      navigator.clipboard.writeText(downloadUrl).then(() => {
        // 可以添加复制成功的提示
      });
    }
  };

  return (
    <Modal
      title={
        <Space>
          <MobileOutlined style={{ color: '#1890ff' }} />
          <span>下载{appName}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
        downloadUrl && (
          <Button 
            key="download" 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={handleDownload}
          >
            立即下载
          </Button>
        )
      ]}
      width={500}
      centered
      destroyOnClose
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ marginBottom: '24px' }}>
          <MobileOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
        </div>
        
        <Typography.Title level={4} style={{ marginBottom: '16px' }}>
          请在{platform}App中操作
        </Typography.Title>
        
        <Paragraph style={{ color: '#666', marginBottom: '24px' }}>
          为了更好的用户体验和功能完整性，{platform}相关操作需要在移动端App中进行。
          请下载并安装{appName}后继续操作。
        </Paragraph>

        {qrCodeUrl && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '8px' }}>
              <QrcodeOutlined style={{ marginRight: '4px' }} />
              <Text strong>扫描二维码下载</Text>
            </div>
            <img 
              src={qrCodeUrl} 
              alt="下载二维码" 
              style={{ 
                width: '120px', 
                height: '120px',
                border: '1px solid #e8e8e8',
                borderRadius: '8px'
              }} 
            />
          </div>
        )}

        {downloadUrl && (
          <div style={{ marginBottom: '16px' }}>
            <Space direction="vertical" size="small">
              <Text type="secondary">下载链接：</Text>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                justifyContent: 'center'
              }}>
                <Text 
                  code 
                  style={{ 
                    maxWidth: '300px', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {downloadUrl}
                </Text>
                <Button 
                  size="small" 
                  onClick={handleCopyLink}
                  type="text"
                >
                  复制
                </Button>
              </div>
            </Space>
          </div>
        )}

        <div style={{ 
          padding: '16px', 
          backgroundColor: '#f6f8fa', 
          borderRadius: '8px',
          border: '1px solid #e1e4e8'
        }}>
          <Text type="secondary">
            💡 提示：安装完成后，请在App中登录您的账号，然后重新尝试相关操作
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default DownloadAppModal;
