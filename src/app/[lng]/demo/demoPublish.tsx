"use client";

import { useTransClient } from "@/app/i18n/client";
import { useEffect, useState } from "react";
import {
  AccountType,
  apiCreatePublish,
  apiGetPublishList,
  PubStatus,
} from "@/api/publish";
import { PubType } from "@/app/config/publishConfig";

export const DemoPublish = () => {
  const { t } = useTransClient("demo");

  useEffect(() => {
    //
  }, []);

  const createPublish = async () => {
    try {
      const res: any = await apiCreatePublish({
        flowId: "flowIdxxx",
        type: PubType.VIDEO,
        title: "title",
        desc: "desc",
        accountId: "111",
        uid: "uid",
        accountType: AccountType.KWAI,
        videoUrl: "videoUrl",
        coverUrl: "coverUrl",
        imgList: ["imgList1", "imgList2"],
        publishTime: new Date().toDateString(),
        status: PubStatus.RELEASED,
        option: {
          isAutoPublish: true,
          isAutoDelete: true,
          isAutoCover: true,
          isAutoImg: true,
        },
      });
      if (res?.data?.data) {
        console.log("创建记录成功:", res.data.data);
      }
    } catch (error) {
      console.error("创建记录失败:", error);
    }
  };

  const getPublishList = async () => {
    try {
      const res: any = await apiGetPublishList(1, 10);
      if (res?.data?.data) {
        console.log("获取记录列表成功:", res.data.data);
      }
    } catch (error) {
      console.error("获取记录列表失败:", error);
    }
  };

  return (
    <div>
      <div>========= 发布记录 ==============</div>
      <div>
        <button onClick={createPublish}>创建记录</button>
        <button onClick={getPublishList}>获取记录列表</button>
      </div>
    </div>
  );
};
