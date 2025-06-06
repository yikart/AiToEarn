"use client";

import { useEffect, useState } from "react";
import styles from "./accountAdd.module.scss";
import { useRouter, useSearchParams } from "next/navigation";
import { PlatType } from "@/app/config/platConfig";
import { kwaiLogin } from "@/app/[lng]/accounts/plat/kwaiLogin";
import { Spin } from "antd";
import {CheckCircleOutlined, CloseCircleOutlined} from "@ant-design/icons";

enum LoginStatusEnum {
  // 加载中
  Loading = 0,
  // 失败
  Fail = 1,
  // 成功
  Success = 2,
}

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState(LoginStatusEnum.Loading);

  useEffect(() => {
    login();
  }, []);

  const login = async () => {
    let isSuccess = true;

    switch (searchParams.get("platType") as PlatType) {
      case PlatType.KWAI:
        const res = await kwaiLogin(searchParams.get("code") as string).catch(
          () => (isSuccess = false),
        );
        if (!res) isSuccess = false;
        break;
      default:
        console.error("没有 search 参数：platType");
        router.replace("/accounts");
        return;
    }

    if (isSuccess) {
      setStatus(LoginStatusEnum.Success);
      setTimeout(() => {
        router.replace("/accounts");
      }, 500);
    } else {
      setStatus(LoginStatusEnum.Fail);
    }
  };

  return (
    <Spin
      wrapperClassName={styles.accountAdd}
      spinning={status === LoginStatusEnum.Loading}
      tip={status === LoginStatusEnum.Loading ? "正在添加账户..." : ""}
    >
      {" "}
      {status === LoginStatusEnum.Success && (
        <div className="accountAdd-success">
          <CheckCircleOutlined />
          <div className="accountAdd-success-text">账号添加成功</div>
        </div>
      )}
      {status === LoginStatusEnum.Fail && (
        <div className="accountAdd-fail">
          <CloseCircleOutlined />
          <div className="accountAdd-success-text">
            账号添加失败，请稍后重试
          </div>
        </div>
      )}
    </Spin>
  );
}
