import { ForwardedRef, forwardRef, memo, useState } from 'react';
import styles from '../login.module.scss';
import { Button, Form, Input, message } from 'antd';
import { phoneReg } from '@/utils/regulars';
import GetCode from '@/components/GetCode';
import { userApi } from '@/api/user';
import { IRefreshToken, PhoneLoginParams } from '@/api/types/user-t';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/user';

export interface IPhoneLoginProps {}
export interface IPhoneLoginRef {}

const PhoneLogin = memo(
  forwardRef(({}: IPhoneLoginProps, ref: ForwardedRef<IPhoneLoginRef>) => {
    const [form] = Form.useForm();
    const [loginLoading, setLoginLoading] = useState(false);
    const [formValid, setFormValid] = useState(false);
    const navigate = useNavigate();
    const userStore = useUserStore();

    const handleValuesChange = () => {
      const values = form.getFieldsValue();
      setFormValid(!!values.phone && !!values.code);
    };

    const loginCore = async (params: PhoneLoginParams) => {
      setLoginLoading(true);
      const res = await userApi
        .phoneLogin(params)
        .catch(() => setLoginLoading(true));
      setLoginLoading(false);
      LoginSuccess(res);
    };

    const LoginSuccess = (res: IRefreshToken | void) => {
      if (!res) return;
      window.ipcRenderer.invoke('ICP_USER_ADD', res.userInfo);
      userStore.setToken(res);
      userStore.getUserInfo(res.userInfo);
      message.success('登录成功！');
      navigate('/');
    };

    const MyInput = (props: any) => (
      <div style={{ display: 'flex', width: '100%' }}>
        <div className={styles['loginForm-phone-site']}>+86</div>
        <Input {...props} style={{ width: '100%' }} />
      </div>
    );

    return (
      <div className={styles.phoneLogin}>
        <div className={styles.loginHeader}>
          <h2>欢迎来到爱团团</h2>
          <p>请使用手机号登录</p>
        </div>
        <Form
          form={form}
          className={styles.loginForm}
          onFinish={loginCore}
          autoComplete="off"
          onValuesChange={handleValuesChange}
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
                if (!validateRes) return;
                const res = await userApi.getUserCode({
                  phone: form.getFieldValue('phone'),
                });
                if (!res) return;
                message.success('验证码已发送');
                if (typeof res === 'string') {
                  form.setFieldsValue({
                    code: res,
                  });
                }
              }}
            />
          </div>

          <Form.Item
            className={styles['loginForm-buttonWrapper']}
            wrapperCol={{ offset: 0 }}
          >
            <Button
              loading={loginLoading}
              className={`${styles.submitBtn} ${formValid ? styles.active : ''}`}
              htmlType="submit"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  }),
);

PhoneLogin.displayName = 'PhoneLogin';
export default PhoneLogin;
