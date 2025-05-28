"use client";

import { ForwardedRef, forwardRef, memo, useEffect, useState } from "react";
import { IAccountLoginPlatProps } from "@/app/[lng]/accounts/components/AddAccountModal/AccountLogin/accountLogin.type";
import styles from "../styles/xhsLogin.module.scss";
import { requestPlatApi } from "@/utils/otherRequest";
import AccountLoginLyaout from "@/app/[lng]/accounts/components/AddAccountModal/AccountLogin/AccountLoginLyaout";

export interface IXhsLoginRef {}

const XhsLogin = memo(
  forwardRef(({}: IAccountLoginPlatProps, ref: ForwardedRef<IXhsLoginRef>) => {
    const [qsImg, setQsImg] = useState("");
    const [qRCodeLoading, setQRCodeLoading] = useState(false);
    const [isQRCodeExpire, setIsQRCodeExpire] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);

    useEffect(() => {
      getLoginQRCode();
    }, []);

    const getLoginQRCode = () => {
      setQRCodeLoading(true);
      requestPlatApi({
        url: "xhs/login_qr_code",
        method: "POST",
      }).then((res) => {
        if (qRCodeLoading) return;
        setQRCodeLoading(false);
        setQsImg("data:image/png;base64," + res.data.base64_qr_code);
      });
    };

    return (
      <div className={styles.xhsLogin}>
        <AccountLoginLyaout
          qRCodeLoading={qRCodeLoading}
          qRCodeUrl={qsImg}
          phoneConfig={{
            codeSendTime: 180,
            onCodeSend: (phone: string) => {
              console.log(phone);
            },
            onLogin: (params) => {
              console.log(params);
            },
            loading: loginLoading,
          }}
          qRCodeTips="可用小红书或微信扫码"
          isQRCodeExpire={isQRCodeExpire}
          onFlushQRCode={getLoginQRCode}
        />
      </div>
    );
  }),
);

export default XhsLogin;
