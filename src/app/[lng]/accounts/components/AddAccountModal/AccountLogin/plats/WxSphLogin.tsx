"use client";

import { ForwardedRef, forwardRef, memo } from "react";
import { IAccountLoginPlatProps } from "@/app/[lng]/accounts/components/AddAccountModal/AccountLogin/accountLogin.type";

export interface IWxSphLoginRef {}

const WxSphLogin = memo(
  forwardRef(
    ({}: IAccountLoginPlatProps, ref: ForwardedRef<IWxSphLoginRef>) => {
      return <div></div>;
    },
  ),
);

export default WxSphLogin;
