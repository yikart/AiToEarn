import { useEffect, useState } from 'react';
import { Card, Descriptions, Spin, Typography, Space, Avatar, Switch, Slider, Button, Alert, InputNumber, Form, Tooltip } from 'antd';
import { userApi } from '@/api/user';
import styles from './userProfile.module.scss';
import { UserOutlined, PhoneOutlined, IdcardOutlined, QrcodeOutlined, ClockCircleOutlined, SafetyOutlined, WechatOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { message } from 'antd';

const { Title, Text } = Typography;

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
  earnInfo?: {
    status: number;
    cycleInterval: number;
  };
}

const UserProfile = () => {
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [popularizeCode, setPopularizeCode] = useState<string>('');
  const [earnStatus, setEarnStatus] = useState<boolean>(false);
  const [cycleInterval, setCycleInterval] = useState<number>(30);
  const [earnLoading, setEarnLoading] = useState<boolean>(false);
  const [form] = Form.useForm();

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
      if (res.earnInfo) {
        setEarnStatus(res.earnInfo.status === 1);
        setCycleInterval(res.earnInfo.cycleInterval || 30);
        form.setFieldsValue({
          cycleInterval: res.earnInfo.cycleInterval || 30
        });
      } else {
        setEarnStatus(false);
        setCycleInterval(30);
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

  const handleSaveEarn = async () => {
    setEarnLoading(true);
    try {
      await userApi.updateUserInfo({
        earnInfo: {
          status: earnStatus ? 1 : 0,
          cycleInterval,
        },
      });
      message.success('设置已保存');
      fetchUserInfo();
    } catch (e) {
      message.error('保存失败');
    } finally {
      setEarnLoading(false);
    }
  };

  const handleEarnStatusChange = async (checked: boolean) => {
    setLoading(true);
    try {
      await userApi.setUserEarnInfo({
        status: checked ? 1 : 0,
        cycleInterval: cycleInterval
      });
      setEarnStatus(checked);
      message.success(`赚钱模式已${checked ? '开启' : '关闭'}`);
    } catch (error) {
      console.error('更新赚钱模式状态失败:', error);
      message.error('操作失败，请稍后重试');
      // 恢复原状态
      setEarnStatus(!checked);
    } finally {
      setLoading(false);
    }
  };

  const handleCycleIntervalChange = async (value: number) => {
    setCycleInterval(value);
  };

  const handleAfterChangeInterval = async (value: number) => {
    if (!value || value < 5) return;
    
    setLoading(true);
    try {
      await userApi.setUserEarnInfo({
        status: earnStatus ? 1 : 0,
        cycleInterval: value
      });
      message.success('检查频率已更新');
    } catch (error) {
      console.error('更新检查频率失败:', error);
      message.error('操作失败，请稍后重试');
      // 恢复原值
      setCycleInterval(cycleInterval);
    } finally {
      setLoading(false);
    }
  };

  const getIntervalLabel = (val: number) => {
    if (val < 60) return `${val} 分钟`;
    if (val % 60 === 0) return `${val / 60} 小时`;
    return `${Math.floor(val / 60)} 小时${val % 60} 分钟`;
  };

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

          <Card className={styles.profileCard} style={{ marginTop: 24 }}>
            <Title level={5} style={{ marginBottom: 16 }}>赚钱模式设置</Title>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                <span>赚钱模式</span>
                <Switch 
                  checked={earnStatus} 
                  onChange={handleEarnStatusChange} 
                  loading={loading}
                />
                <Tooltip title="开启后系统将自动为您寻找并完成任务">
                  <QuestionCircleOutlined style={{ color: '#999' }} />
                </Tooltip>
              </div>
              
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 16 }}>
                <span>检查频率</span>
                <Slider
                  min={5} 
                  max={120}
                  step={1}
                  value={cycleInterval}
                  onChange={handleCycleIntervalChange}
                  onAfterChange={handleAfterChangeInterval}
                  style={{ flex: 1, marginRight: 16 }}
                  disabled={!earnStatus || loading}
                />
                <span style={{ minWidth: 70, textAlign: 'right' }}>{getIntervalLabel(cycleInterval)}</span>
              </div>
            </div>
            <div style={{ color: '#999', fontSize: 12, marginBottom: 12 }}>
              可设置 5分钟~24小时 区间
            </div>
            <Alert
              type="info"
              showIcon
              style={{ background: '#fafaff', border: 'none', marginBottom: 16 }}
              message={
                <span>
                  开启赚钱模式后，系统将自动接取并完成互动需求，确保您能获得最大收益。
                </span>
              }
            />
          </Card>

        </div>
      </Spin>
    </div>
  );
};

export default UserProfile; 