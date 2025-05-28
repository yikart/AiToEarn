"use client";

import { ForwardedRef, forwardRef, memo } from "react";
import { IAccountLoginPlatProps } from "@/app/[lng]/accounts/components/AddAccountModal/AccountLogin/accountLogin.type";

export interface IDouyinLoginRef {}

const DouyinLogin = memo(
  forwardRef(
    ({}: IAccountLoginPlatProps, ref: ForwardedRef<IDouyinLoginRef>) => {
      return <div></div>;
    },
  ),
);

export default DouyinLogin;
