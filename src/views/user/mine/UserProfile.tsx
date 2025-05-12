import { useEffect, useState } from 'react';
import { Card, Descriptions, Spin, Typography, Space, Avatar } from 'antd';
import { userApi } from '@/api/user';
import styles from './userProfile.module.scss';
import { UserOutlined, PhoneOutlined, IdcardOutlined, QrcodeOutlined, ClockCircleOutlined, SafetyOutlined, WechatOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface UserInfo {
  createTime: string;
  id: string;
  inviteCode: string;
  name: string;
  phone: string;
  status: number;
  updateTime: string;
  wxOpenid: string;
  _id: string;
}

const UserProfile = () => {
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [popularizeCode, setPopularizeCode] = useState<string>('');

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      const res:any = await userApi.getUserInfo();
      setUserInfo(res);
      // 如果没有邀请码，则获取
      if (!res.popularizeCode) {
        const code = await userApi.getMinePopularizeCode();
        setPopularizeCode(code);
      } else {
        setPopularizeCode(res.popularizeCode);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return (
    <div className={styles.profileContainer}>
      <Spin spinning={loading}>
        <div className={styles.profileHeader}>
          <div className={styles.profileAvatar}>
            <Avatar size={120} icon={<UserOutlined />} />
            <Title level={3} className={styles.profileName}>
              {userInfo?.name || '未设置用户名'}
            </Title>
          </div>
        </div>

        <div className={styles.profileContent}>
          <Card className={styles.profileCard}>
            <Space direction="vertical" size="large" className={styles.infoSection}>
              <div className={styles.infoGroup}>
                <div className={styles.infoItem}>
                  <IdcardOutlined className={styles.infoIcon} />
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>用户ID</span>
                    <span className={styles.infoValue}>{userInfo?.id || '-'}</span>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <PhoneOutlined className={styles.infoIcon} />
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>手机号</span>
                    <span className={styles.infoValue}>{userInfo?.phone || '-'}</span>
                  </div>
                </div>

                

                <div className={styles.infoItem}>
                  <QrcodeOutlined className={styles.infoIcon} />
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>我的邀请码</span>
                    <span className={styles.infoValue}>{popularizeCode || '-'}</span>
                  </div>
                </div>

                {userInfo?.inviteCode && (
                  <div className={styles.infoItem}>
                    <QrcodeOutlined className={styles.infoIcon} />
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>邀请者邀请码</span>
                      <span className={styles.infoValue}>{userInfo.inviteCode}</span>
                    </div>
                  </div>
                )}

                <div className={styles.infoItem}>
                  <ClockCircleOutlined className={styles.infoIcon} />
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>创建时间</span>
                    <span className={styles.infoValue}>
                      {userInfo?.createTime ? new Date(userInfo.createTime).toLocaleString() : '-'}
                    </span>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <ClockCircleOutlined className={styles.infoIcon} />
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>更新时间</span>
                    <span className={styles.infoValue}>
                      {userInfo?.updateTime ? new Date(userInfo.updateTime).toLocaleString() : '-'}
                    </span>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <WechatOutlined className={styles.infoIcon} />
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>微信OpenID</span>
                    <span className={styles.infoValue}>{userInfo?.wxOpenid || '-'}</span>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <SafetyOutlined className={styles.infoIcon} />
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>账号状态</span>
                    <span className={`${styles.infoValue} ${userInfo?.status === 1 ? styles.statusNormal : styles.statusAbnormal}`}>
                      {userInfo?.status === 1 ? '正常' : '异常'}
                    </span>
                  </div>
                </div>
              </div>
            </Space>
          </Card>
        </div>
      </Spin>
    </div>
  );
};

export default UserProfile; 