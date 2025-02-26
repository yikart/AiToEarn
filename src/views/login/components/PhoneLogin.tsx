import { ForwardedRef, forwardRef, memo, useState } from 'react';
import styles from '../login.module.scss';
import { Tabs, Button, Form, Input, message } from 'antd';
import { phoneReg } from '@/utils/regulars';
import GetCode from '@/components/GetCode';
import { userApi } from '@/api/user';
import { IRefreshToken, PhoneLoginParams } from '@/api/types/user-t';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/user';

export interface IPhoneLoginProps {}

export interface IPhoneLoginRef {}

// 密码登录
const PasswordLogin = () => {
  return <>未开发</>;
};

// 短信登录
const MsgLogin = () => {
  const [form] = Form.useForm();
  const [loginLoading, setLoginLoading] = useState(false);
  const navigate = useNavigate();
  const userStore = useUserStore();

  const loginCore = async (params: PhoneLoginParams) => {
    setLoginLoading(true);
    const res = await userApi
      .phoneLogin(params)
      .catch(() => setLoginLoading(true));
    setLoginLoading(false);
    LoginSuccess(res);
  };

  // 登录成功后的统一初始化方法
  const LoginSuccess = (res: IRefreshToken | void) => {
    if (!res) return;
    window.ipcRenderer.invoke('ICP_USER_ADD', res.userInfo);
    userStore.setToken(res);
    userStore.getUserInfo(res.userInfo);
    message.success('登录成功！');
    navigate('/');

    return <></>;
  };

  const MyInput = (props: any) => (
    <div style={{ display: 'flex', width: '100%' }}>
      <div className={styles['loginForm-phone-site']}>+86</div>
      <Input {...props} style={{ width: '100%' }} />
    </div>
  );

  return (
    <Form
      form={form}
      className={styles.loginForm}
      onFinish={loginCore}
      autoComplete="off"
    >
      <Form.Item<PhoneLoginParams>
        name="phone"
        className={styles['loginForm-phone']}
        rules={[
          { required: true, message: '请输入手机号' },
          {
            pattern: phoneReg,
            message: '手机号格式错误，请重新输入',
          },
        ]}
      >
        <MyInput placeholder="请输入您的手机号码" />
      </Form.Item>

      <div style={{ position: 'relative', height: '43px' }}>
        <Form.Item<PhoneLoginParams>
          name="code"
          rules={[{ required: true, message: '验证码不能为空' }]}
        >
          <Input placeholder="请输入您的验证码" />
        </Form.Item>
        <GetCode
          onGetCode={async (unlock) => {
            const validateRes = await form
              .validateFields(['phone'])
              .catch(() => unlock());
            console.log(validateRes);
            if (!validateRes) return;
            const res = await userApi.getUserCode({
              phone: form.getFieldValue('phone'),
            });
            if (!res) return;
            message.success('验证码已发送');
            form.setFieldsValue({
              // code: import.meta.env.MODE === 'development' ? res : '',
              code: res,
            });
          }}
        />
      </div>

      <Form.Item
        className={styles['loginForm-buttonWrapper']}
        wrapperCol={{ offset: 0 }}
        style={{ marginTop: '30px' }}
      >
        <Button loading={loginLoading} className="customBtn4" htmlType="submit">
          登录
        </Button>
      </Form.Item>
    </Form>
  );
};

const PhoneLogin = memo(
  forwardRef(({}: IPhoneLoginProps, ref: ForwardedRef<IPhoneLoginRef>) => {
    return (
      <div className={styles.phoneLogin}>
        <Tabs
          defaultActiveKey="0"
          indicator={{ size: (origin) => origin - 30 }}
          items={[
            {
              key: '0',
              label: '密码登录',
              children: <PasswordLogin />,
            },
            {
              key: '1',
              label: '短信登录',
              children: <MsgLogin />,
            },
          ]}
        />
      </div>
    );
  }),
);
PhoneLogin.displayName = 'PhoneLogin';

export default PhoneLogin;
