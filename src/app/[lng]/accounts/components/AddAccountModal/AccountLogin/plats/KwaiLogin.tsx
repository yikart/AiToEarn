"use client";

import { ForwardedRef, forwardRef, memo } from "react";
import { IAccountLoginPlatProps } from "@/app/[lng]/accounts/components/AddAccountModal/AccountLogin/accountLogin.type";

export interface IKwaiLoginRef {}

const KwaiLogin = memo(
  forwardRef(({}: IAccountLoginPlatProps, ref: ForwardedRef<IKwaiLoginRef>) => {
    return <div></div>;
  }),
);

export default KwaiLogin;
