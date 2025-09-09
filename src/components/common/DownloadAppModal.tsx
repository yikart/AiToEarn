import React, { useState } from 'react';
import { Modal, Button, Space, Typography, message } from 'antd';
import { DownloadOutlined, QrcodeOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { useTransClient } from '@/app/i18n/client';
import logo from '@/assets/images/logo.png';
import { QRCode } from 'react-qrcode-logo';

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
  platform = "",
  appName = "Aitoearn App",
  downloadUrl,
  qrCodeUrl = ''
}) => {
  const { t } = useTransClient("common");
  const [copySuccess, setCopySuccess] = useState(false);

  const handleDownload = () => {
    const linkToOpen = downloadUrl || "https://yikart.oss-cn-beijing.aliyuncs.com/aitoearn-1.0.9.1.apk";
    window.open(linkToOpen, '_blank');
  };

  const handleCopyLink = async () => {
    const linkToCopy = downloadUrl || "https://yikart.oss-cn-beijing.aliyuncs.com/aitoearn-1.0.9.1.apk";
    try {
      await navigator.clipboard.writeText(linkToCopy);
      setCopySuccess(true);
      message.success(t('downloadApp.copy') + '成功');
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      message.error('复制失败，请手动复制');
    }
  };

  return (
    <Modal
      title={
        <Space>
          <img src={logo.src} alt="Aitoearn" style={{ width: 20, height: 20, borderRadius: 4 }} />
          <span>{t('downloadApp.title', { appName })}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          {t('downloadApp.close')}
        </Button>,
        <Button 
          key="download" 
          type="primary" 
          icon={<DownloadOutlined />}
          onClick={handleDownload}
        >
          {t('downloadApp.downloadNow')}
        </Button>
      ]}
      width={520}
      centered
      destroyOnHidden
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        {/* App Logo */}
        <div style={{ marginBottom: '24px' }}>
          <img src={logo.src} alt="Aitoearn" style={{ width: 64, height: 64, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
        </div>
        
        {/* 标题 */}
        <Typography.Title level={4} style={{ marginBottom: '16px', color: '#1f2937' }}>
          {t('downloadApp.operationInApp', { appName })}
        </Typography.Title>
        
        {/* 描述 */}
        <Paragraph style={{ color: '#6b7280', marginBottom: '32px', fontSize: '14px', lineHeight: '1.6' }}>
          {t('downloadApp.description', { appName })}
        </Paragraph>

        {/* 二维码区域 */}
        <div style={{ 
          marginBottom: '32px', 
          padding: '20px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          {qrCodeUrl ? (
            <img 
              src={qrCodeUrl} 
              alt="QR Code" 
              style={{ 
                width: 120, 
                height: 120, 
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }} 
            />
          ) : (
            <QRCode
              value={downloadUrl || "https://yikart.oss-cn-beijing.aliyuncs.com/aitoearn-1.0.9.1.apk"}
              size={120}
              logoImage={logo.src}
              logoWidth={30}
              logoHeight={30}
              logoOpacity={0.8}
              qrStyle="squares"
              eyeRadius={0}
              style={{ borderRadius: '8px' }}
            />
          )}
        </div>

        {/* 下载链接区域 */}
        <div style={{ 
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          border: '1px solid #d1d5db'
        }}>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
            下载链接
          </Text>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <Text 
              code 
              style={{ 
                flex: 1, 
                fontSize: '11px', 
                wordBreak: 'break-all',
                textAlign: 'left'
              }}
            >
              {downloadUrl || "https://yikart.oss-cn-beijing.aliyuncs.com/aitoearn-1.0.9.1.apk"}
            </Text>
            <Button
              size="small"
              icon={copySuccess ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopyLink}
              type={copySuccess ? "primary" : "default"}
            >
              {copySuccess ? '已复制' : '复制'}
            </Button>
          </div>
        </div>

        {/* 提示信息 */}
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#eff6ff', 
          borderRadius: '8px',
          border: '1px solid #dbeafe'
        }}>
          <Text type="secondary" style={{ fontSize: '13px', color: '#1e40af' }}>
            {t('downloadApp.tip')}
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default DownloadAppModal;