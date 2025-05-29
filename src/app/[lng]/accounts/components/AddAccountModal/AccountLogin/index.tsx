"use client";

import {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AccountPlatInfoMap, PlatType } from "@/app/config/platConfig";
import DouyinLogin from "@/app/[lng]/accounts/components/AddAccountModal/AccountLogin/plats/DouyinLogin";
import WxSphLogin from "@/app/[lng]/accounts/components/AddAccountModal/AccountLogin/plats/WxSphLogin";
import XhsLogin from "@/app/[lng]/accounts/components/AddAccountModal/AccountLogin/plats/XhsLogin";
import { Button, message, Modal, Steps, Switch, Tooltip } from "antd";
import KwaiLogin from "@/app/[lng]/accounts/components/AddAccountModal/AccountLogin/plats/KwaiLogin";
import styles from "./styles/accountLogin.module.scss";
import { useShallow } from "zustand/react/shallow";
import { useUserStore } from "@/store/user";
import { QuestionCircleOutlined } from "@ant-design/icons";
import ProxyInput, {
  verifyProxy,
} from "@/app/[lng]/accounts/components/ProxyInput";

export interface IAccountLoginRef {}

export interface IAccountLoginProps {
  plat: PlatType;
  open: boolean;
  onLoginSuccess: (cookie: string) => void;
  onCancel: () => void;
}

const AccountLogin = memo(
  forwardRef(
    (
      { plat, open, onLoginSuccess, onCancel }: IAccountLoginProps,
      ref: ForwardedRef<IAccountLoginRef>,
    ) => {
      const { setIsAddAccountPorxy, isAddAccountPorxy } = useUserStore(
        useShallow((state) => ({
          setIsAddAccountPorxy: state.setIsAddAccountPorxy,
          isAddAccountPorxy: state.isAddAccountPorxy,
        })),
      );
      const platInfo = useMemo(() => {
        return (
          AccountPlatInfoMap.get(plat) ||
          AccountPlatInfoMap.get(PlatType.Douyin)!
        );
      }, [plat]);
      // 代理地址
      const [proxy, setProxy] = useState("");
      // 步骤
      const [currStep, setCurrStep] = useState(0);
      const [verifyProxyLoading, setVerifyProxyLoading] = useState(false);

      useEffect(() => {
        if (isAddAccountPorxy) {
          setCurrStep(0);
        } else {
          setCurrStep(1);
        }
      }, [isAddAccountPorxy]);

      const Plat = useMemo(() => {
        switch (plat) {
          case PlatType.Douyin:
            return DouyinLogin;
          case PlatType.WxSph:
            return WxSphLogin;
          case PlatType.Xhs:
            return XhsLogin;
          case PlatType.KWAI:
            return KwaiLogin;
        }
      }, [plat]);

      return (
        <>
          <Modal
            title={
              <div className={styles.ALModaltitle}>
                <span className="ALModaltitle-title">{platInfo.name}登录</span>
                <div className="ALModaltitle-switch">
                  <span>
                    是否开启代理
                    <Tooltip title="开启后下次进入页面默认会为开启状态">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  </span>
                  <Switch
                    value={isAddAccountPorxy}
                    onChange={(e) => setIsAddAccountPorxy(e)}
                  />
                </div>
              </div>
            }
            open={open}
            onCancel={onCancel}
            footer={null}
            width={800}
          >
            {isAddAccountPorxy && (
              <Steps
                style={{ marginTop: "20px" }}
                current={currStep}
                items={[
                  {
                    title: "设置代理地址",
                  },
                  {
                    title: "登录",
                  },
                ]}
              />
            )}

            {currStep === 0 ? (
              <>
                <ProxyInput onChange={(e) => setProxy(e)} />
                <div style={{ display: "flex", justifyContent: "right" }}>
                  <Button
                    type="primary"
                    style={{ width: "200px", padding: "16px 0" }}
                    onClick={async () => {
                      setVerifyProxyLoading(true);
                      const verifyRes = await verifyProxy(proxy);
                      setVerifyProxyLoading(false);
                      if (verifyRes) {
                        setCurrStep(1);
                      } else {
                        return message.error("代理地址不可用，无法添加账户！");
                      }
                    }}
                  >
                    下一步
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Plat
                  proxy={isAddAccountPorxy ? proxy : ""}
                  onLoginSuccess={() => {
                    console.log("登录");
                  }}
                />
              </>
            )}
          </Modal>
        </>
      );
    },
  ),
);

export default AccountLogin;
