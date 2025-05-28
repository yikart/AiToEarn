"use client";

import { ForwardedRef, forwardRef, memo, useMemo } from "react";
import { AccountPlatInfoMap, PlatType } from "@/app/config/platConfig";
import DouyinLogin from "@/app/[lng]/accounts/components/AddAccountModal/AccountLogin/plats/DouyinLogin";
import WxSphLogin from "@/app/[lng]/accounts/components/AddAccountModal/AccountLogin/plats/WxSphLogin";
import XhsLogin from "@/app/[lng]/accounts/components/AddAccountModal/AccountLogin/plats/XhsLogin";
import { Modal } from "antd";
import KwaiLogin from "@/app/[lng]/accounts/components/AddAccountModal/AccountLogin/plats/KwaiLogin";

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
      const platInfo = useMemo(() => {
        return (
          AccountPlatInfoMap.get(plat) ||
          AccountPlatInfoMap.get(PlatType.Douyin)!
        );
      }, [plat]);

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
            title={`${platInfo.name}登录`}
            open={open}
            onCancel={onCancel}
            footer={null}
            width={800}
          >
            <Plat
              onLoginSuccess={() => {
                console.log("登录");
              }}
            />
          </Modal>
        </>
      );
    },
  ),
);

export default AccountLogin;
