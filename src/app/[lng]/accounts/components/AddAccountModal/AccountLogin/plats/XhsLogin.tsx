"use client";

import {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useRef,
  useState,
} from "react";
import { IAccountLoginPlatProps } from "@/app/[lng]/accounts/components/AddAccountModal/AccountLogin/accountLogin.type";
import styles from "../styles/xhsLogin.module.scss";
import { requestPlatApi } from "@/utils/otherRequest";
import AccountLoginLyaout from "@/app/[lng]/accounts/components/AddAccountModal/AccountLogin/AccountLoginLyaout";
import { message } from "antd";
import { sleep } from "@/utils/general";

export interface IXhsLoginRef {}

const XhsLogin = memo(
  forwardRef(
    ({ proxy }: IAccountLoginPlatProps, ref: ForwardedRef<IXhsLoginRef>) => {
      const [qsImg, setQsImg] = useState("");
      const [qRCodeLoading, setQRCodeLoading] = useState(false);
      const [isQRCodeExpire, setIsQRCodeExpire] = useState(false);
      const [loginLoading, setLoginLoading] = useState(false);
      const sendCodeResRef = useRef<any>(null);
      // 停止轮询的方法
      const stopPolling = useRef<() => void>(() => {});
      const [getUserInfoLoding, setGetUserInfoLoding] = useState(false);

      useEffect(() => {
        getLoginQRCode();

        return () => {
          stopPolling.current();
        };
      }, []);

      // 获取登录二维码
      const getLoginQRCode = async () => {
        stopPolling.current();

        setQRCodeLoading(true);
        const loginQrCodeRes = await requestPlatApi({
          url: "xhs/login_qr_code",
          method: "POST",
          data: {
            proxy: proxy,
          },
        }).catch((err) => {
          setQRCodeLoading(false);
          message.error(`${err}`);
        });

        if (qRCodeLoading) return;
        setQRCodeLoading(false);
        setQsImg(
          "data:image/png;base64," +
            loginQrCodeRes.data.response_body.data.base64_qr_code,
        );

        let isStopPolling = false;
        stopPolling.current = () => {
          isStopPolling = true;
        };
        while (true) {
          if (isStopPolling) break;
          const res = await requestPlatApi({
            url: "xhs/check_login",
            method: "POST",
            data: {
              proxy: proxy,
              qr_id: loginQrCodeRes.data.response_body.data.qr_id,
              code: loginQrCodeRes.data.response_body.data.code,
              cookie: loginQrCodeRes.data.response_body.data.cookie,
            },
          });
          const status = res.data.response_body.data.code_status;
          // 验证码过期
          if (status === 3) {
            setIsQRCodeExpire(true);
            break;
          }
          // 验证码登录成功
          if (status === 2) {
            loginSuccess(res.data.response_body.cookie);
            break;
          }
          await sleep(1500);
        }
      };

      const loginSuccess = (cookie: string) => {
        console.log(cookie);
      };

      return (
        <div className={styles.xhsLogin}>
          <AccountLoginLyaout
            qRCodeLoading={qRCodeLoading}
            qRCodeUrl={qsImg}
            phoneConfig={{
              codeSendTime: 180,
              onCodeSend: async (phone: string) => {
                sendCodeResRef.current = await requestPlatApi({
                  url: "xhs/send_code",
                  method: "POST",
                  data: {
                    proxy: proxy,
                    mobile: phone,
                  },
                });
                if (sendCodeResRef.current.data.response_body.code === -1) {
                  message.error(sendCodeResRef.current.data.response_body.msg);
                }
              },
              onLogin: async (params) => {
                setLoginLoading(true);

                const checkCodeRes = await requestPlatApi({
                  url: "xhs/check_code",
                  method: "POST",
                  data: {
                    proxy: proxy,
                    code: params.code,
                    mobile: params.phone,
                    cookie: sendCodeResRef.current?.data?.cookie || "",
                  },
                });

                if (checkCodeRes?.data?.response_body?.code !== 0) {
                  setLoginLoading(false);
                  return message.error("验证码错误，请稍后重试！");
                }

                const loginCodeRes = await requestPlatApi({
                  url: "xhs/login_code",
                  method: "POST",
                  data: {
                    proxy: proxy,
                    mobile_token:
                      checkCodeRes.data.response_body.data.mobile_token,
                    mobile: params.phone,
                    cookie: sendCodeResRef.current?.data?.cookie || "",
                  },
                });
                if (loginCodeRes.data.response_body.code !== 0) {
                  setLoginLoading(false);
                  return message.error(loginCodeRes.msg);
                }
                console.log(loginCodeRes);
              },
              loading: loginLoading,
            }}
            qRCodeTips="可用小红书或微信扫码"
            isQRCodeExpire={isQRCodeExpire}
            onFlushQRCode={getLoginQRCode}
          />
        </div>
      );
    },
  ),
);

export default XhsLogin;
