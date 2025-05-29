"use client";

import { ForwardedRef, forwardRef, memo } from "react";
import styles from "./accountLoginLyaout.module.scss";
import { Button, Form, Input, Spin } from "antd";
import { phoneReg } from "@/utils/regulars";
import GetCode from "@/components/GetCode/GetCode";

export interface IAccountLoginInfo {
  phone: string;
  code: string;
}

export interface IAccountLoginLyaoutRef {}

export interface IAccountLoginLyaoutProps {
  // 整体loading
  loading?: boolean;
  // 获取二维码loading
  qRCodeLoading: boolean;
  // 二维码是否过期
  isQRCodeExpire?: boolean;
  // 二维码过期后刷新二维码
  onFlushQRCode?: () => void;
  // 二维码URL
  qRCodeUrl: string;
  // 二维码提示信息
  qRCodeTips?: string;
  // 手机号登录配置
  phoneConfig?: {
    // 下次发送验证码时间
    codeSendTime: number;
    // 点击验证码发送事件
    onCodeSend: (phone: string) => void;
    // 点击登录事件
    onLogin: (p: IAccountLoginInfo) => void;
    // 登录loding
    loading: boolean;
  };
}

const AccountLoginLyaout = memo(
  forwardRef(
    (
      {
        qRCodeTips,
        qRCodeUrl,
        phoneConfig,
        isQRCodeExpire = false,
        qRCodeLoading,
        onFlushQRCode,
        loading = false,
      }: IAccountLoginLyaoutProps,
      ref: ForwardedRef<IAccountLoginLyaoutRef>,
    ) => {
      const [form] = Form.useForm();

      return (
        <Spin wrapperClassName={styles.accountLoginLyaout} spinning={loading}>
          <div className="accountLoginLyaout-left">
            <Spin
              spinning={qRCodeLoading}
              wrapperClassName="accountLoginLyaout-left-qRCode"
            >
              {qRCodeUrl && <img src={qRCodeUrl} />}
              {isQRCodeExpire && (
                <div className="accountLoginLyaout-left-qRCode-expire">
                  <span>二维码已过期</span>
                  <a onClick={onFlushQRCode}>点击刷新</a>
                </div>
              )}
            </Spin>
            {qRCodeTips && (
              <p className="accountLoginLyaout-left-tips">{qRCodeTips}</p>
            )}
          </div>
          {phoneConfig && (
            <div className="accountLoginLyaout-right">
              <h2>手机号登录</h2>
              <Form
                form={form}
                onFinish={(params) => {
                  phoneConfig!.onLogin(params);
                }}
              >
                <Form.Item<IAccountLoginInfo>
                  name="phone"
                  rules={[
                    { required: true, message: "请输入手机号" },
                    {
                      pattern: phoneReg,
                      message: "手机号格式错误，请重新输入",
                    },
                  ]}
                >
                  <Input placeholder="请输入您的手机号码" />
                </Form.Item>

                <div style={{ position: "relative", height: "40px" }}>
                  <Form.Item<IAccountLoginInfo>
                    name="code"
                    rules={[{ required: true, message: "验证码不能为空" }]}
                  >
                    <Input placeholder="请输入您的验证码" />
                  </Form.Item>
                  <GetCode
                    codeSendTime={phoneConfig!.codeSendTime}
                    onGetCode={async (unlock) => {
                      const validateRes = await form
                        .validateFields(["phone"])
                        .catch(() => unlock());
                      if (!validateRes) return;
                      phoneConfig!.onCodeSend(form.getFieldValue("phone"));
                    }}
                  />
                </div>

                <Form.Item
                  wrapperCol={{ offset: 0 }}
                  style={{ marginTop: "50px" }}
                >
                  <Button
                    htmlType="submit"
                    type="primary"
                    style={{ width: "100%", padding: "18px 0" }}
                    loading={phoneConfig.loading}
                  >
                    登录
                  </Button>
                </Form.Item>
              </Form>
            </div>
          )}
        </Spin>
      );
    },
  ),
);

export default AccountLoginLyaout;
