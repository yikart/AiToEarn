"use client";

import {
  AccountType,
  apiCreatePublish,
  apiGetPublishList,
} from "@/api/publish";
import { PubType } from "@/app/config/publishConfig";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
// dayjs.extend(timezone);

export const DemoPublish = () => {
  const createPublish = async () => {
    const publishTime = dayjs().add(31, "minute").utc().format();
    try {
      const res: any = await apiCreatePublish({
        flowId: "cd296d3bda0f465f977b1cbf200e21d6",
        type: PubType.VIDEO,
        title: "测试视频标题",
        desc: "测试视频描述",
        accountId: "685a8d466d33f16378b7bdfe",
        accountType: AccountType.BILIBILI,
        videoUrl:
          "https://v2.kwaicdn.com/ksc2/d2q1A45M3Dq7tzU1oxY-1trkIMKvM7_7SzRHFhPWMyv8MatfnrAhssXlVmWRVcok-zzQmyooCLGO_K-UXLRx547rxh4VnQ1uMCK4ljl6h8IANtgbCDdDnMvk7amRiyvfADYxi0GedqjHF8kF4iUDMjSl3kJTWbtbbjn8F-AK8UWG66m0W4rFjuSig1px-gxC.mp4?pkey=AAU8pxO15eRlb-oUBHkLPbqgb41b-i13g7MJXM_rILMMpOH-W8mR0-_V5teAff_N6MmFZN6abZXieAoDuAVUaWMDd1YGZCfB3B7qIv2MBHqsEPQC3-SRIQ5T8PTEKWP2a8c&tag=1-1751611371-unknown-0-csnzcnrvrd-0ae9c87425d902fe&clientCacheKey=3xnhic5vb7mq3n9_b.mp4&di=dfa08251&bp=14944&kwai-not-alloc=28&tt=b&ss=vpm",
        coverUrl: "https://education.yikart.cn/images/swiper/swiper1.png",
        // imgList: ["imgList1", "imgList2"],
        publishTime,
        option: {
          isAutoPublish: true,
          isAutoDelete: true,
          isAutoCover: true,
          isAutoImg: true,
          bilibili: {
            tid: 21,
            copyright: 1,
          },
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
      const res: any = await apiGetPublishList(1, 10, {});
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

      <div style={{ marginTop: "20px" }}>
        <h3>发布记录列表组件测试：</h3>
        {/* <Page 
          height="400px"
          onChange={(record) => {
            console.log('选中的记录:', record);
          }}
        /> */}
      </div>
    </div>
  );
};
