/*
 * @Author: nevin
 * @Date: 2025-02-17 19:28:13
 * @LastEditTime: 2025-02-26 09:09:32
 * @LastEditors: nevin
 * @Description: 微信二维码登录
 */
import { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { GzhLoginTyp, userApi } from '@/api/user';
import { Button, Modal, Form, Input, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import styles from '../login.module.scss';
import { useUserStore } from '@/store/user';
import { useNavigate } from 'react-router-dom';
import GetCode from '@/components/GetCode';

export interface PubItemRef {
  init: (pubRecord: any) => Promise<void>;
}

export default forwardRef<PubItemRef>((props, ref) => {
  const [ticketInfo, setTicketInfo] = useState<{ ticket: string; key: string }>(
    {
      ticket: '',
      key: '',
    },
  );
  const [showMask, setShowMask] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneForm] = Form.useForm();
  const [openId, setOpenId] = useState('');
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const userStore = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    getQrcode();
    const qrcodeTimer = setTimeout(() => {
      setShowMask(true);
    }, 30000); // 30秒后显示遮罩

    return () => {
      clearTimeout(qrcodeTimer);
    };
  }, []);

  // 添加轮询登录检查
  useEffect(() => {
    let loginTimer: NodeJS.Timeout;

    if (ticketInfo.ticket) {
      loginTimer = setInterval(async () => {
        const res = await userApi.wxGzhQrcodelogin(ticketInfo);
        console.log('GzhQrcode ======== ', res);

        const { openId, token, phone, status } = res;

        if (status === -1) {
          message.error('登录失败，请重新扫码登录');
          setShowMask(true);
          clearInterval(loginTimer);
          return;
        }
        setOpenId(openId);

        // 登录完成
        if (status === 1 && !!token && !!phone && res.userInfo) {
          completeLogin(res);
          clearInterval(loginTimer);
          return;
        }

        loginByPhone(res);
      }, 2000); // 每2秒检查一次
    }

    return () => {
      if (loginTimer) {
        clearInterval(loginTimer);
      }
    };
  }, [ticketInfo]);

  async function getQrcode() {
    const res = await userApi.getWxLoginQrcode({});
    if (res) {
      setTicketInfo({
        ticket: res.ticket,
        key: res.key,
      });
      setShowMask(false);
    }
  }

  const loginByPhone = (res: GzhLoginTyp) => {
    if (!res || !res.openId) return;
    setIsFirstLogin(true);
    setShowPhoneModal(true);
  };

  const completeLogin = (res: GzhLoginTyp) => {
    window.ipcRenderer.invoke('ICP_USER_ADD', res.userInfo);
    userStore.setToken(res);
    userStore.getUserInfo(res.userInfo);
    message.success('登录成功！');
    window.ipcRenderer.invoke('start-kwai-listen');
    navigate('/');
  };

  // 提交手机号绑定
  const handlePhoneSubmit = async () => {
    try {
      const values = await phoneForm.validateFields();
      // 调手机号登录
      const res = await userApi.phoneGzhLogin({
        phone: values.phone,
        code: values.code,
        openId: openId,
      });

      if (res) {
        message.success('手机号绑定成功');
        setShowPhoneModal(false);
        // 完成登录流程
        completeLogin({ ...res, phone: values.phone, openId, status: 1 });
      }
    } catch (error) {
      message.error('手机号绑定失败');
    }
  };

  useImperativeHandle(ref, () => ({
    init: async (info: any) => {},
  }));

  return (
    <div className={styles.qrcodeLogin}>
      <div className={styles.qrcodeHeader}>
        <h2>微信扫码登录</h2>
        <p>请使用微信扫描二维码关注哎哟赚公众号</p>
      </div>

      <div className={styles.qrcodeWrapper}>
        {ticketInfo.ticket && (
          <img
            src={`https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${ticketInfo.ticket}`}
            alt="微信登录二维码"
          />
        )}

        {showMask && (
          <div className={styles.qrcodeMask}>
            <p>二维码已过期</p>
            <Button
              type="link"
              icon={<ReloadOutlined />}
              onClick={getQrcode}
              className={styles.refreshBtn}
            >
              刷新二维码
            </Button>
          </div>
        )}
      </div>

      <div className={styles.agreement}>
        登录即表示已接受哎哟赚
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault(); /* 打开注册协议 */
          }}
        >
          《注册协议》
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault(); /* 打开隐私政策 */
          }}
        >
          《隐私权政策》
        </a>
      </div>

      {/* 手机号绑定弹窗 */}
      <Modal
        title="绑定手机号"
        open={showPhoneModal}
        onCancel={() => setShowPhoneModal(false)}
        footer={null}
        closable={false}
        maskClosable={false}
      >
        <Form form={phoneForm} layout="vertical" onFinish={handlePhoneSubmit}>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item
            name="code"
            label="验证码"
            rules={[
              { required: true, message: '请输入验证码' },
              { len: 6, message: '验证码长度为6位' },
            ]}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              <Input placeholder="请输入验证码" style={{ flex: 1 }} />
              {/* <div style={{ marginLeft: '8px', width: '138px', backgroundColor: '#a66ae4', padding: '5px 0', borderRadius: '5px' }}> */}
              <GetCode
                onGetCode={async (unlock: () => void) => {
                  const validateRes = await phoneForm
                    .validateFields(['phone'])
                    .catch(() => unlock());
                  if (!validateRes) return;
                  const res = await userApi.getUserCode({
                    phone: phoneForm.getFieldValue('phone'),
                  });
                  if (!res) return;
                  message.success('验证码已发送');
                  if (typeof res === 'string') {
                    phoneForm.setFieldsValue({
                      code: res,
                    });
                  }
                }}
              />
              {/* </div> */}
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              style={{ marginTop: '10px' }}
            >
              确认绑定
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});
