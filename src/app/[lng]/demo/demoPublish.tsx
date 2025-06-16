"use client";

import { useTransClient } from "@/app/i18n/client";
import { useAccountStore } from "@/store/account";
import { useEffect, useState } from "react";
import { apiInitBilibiliVideo, apiUploadBilibilivideo } from "@/api/bilibili";
import { getAccountListApi } from "@/api/account";
import { apiCreatePublish } from "@/api/publish";

interface Account {
  id: string;
  type: string;
  nickname: string;
  avatar: string;
}

export const DemoPublish = () => {
  const { t } = useTransClient("demo");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [uploadToken, setUploadToken] = useState<string>("");

  useEffect(() => {
    const fetchAccounts = async () => {
      const result = await getAccountListApi();
      console.log("accountList", result);
      if (result?.code === 0 && result?.data) {
        setAccounts(result.data);
      }
    };
    fetchAccounts();
  }, []);

  const createPublish = async () => {
    try {
      // const res: any = await apiCreatePublish({
      //   name: "files.mp4",
      // });
      // if (res?.data?.data) {
      //   setUploadToken(res.data.data);
      //   console.log("获取上传token成功:", res.data.data);
      // }
    } catch (error) {
      console.error("获取上传token失败:", error);
    }
  };

  return (
    <div>
      <div>{t("demoText")}</div>
      <div></div>
    </div>
  );
};
