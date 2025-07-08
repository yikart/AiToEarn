"use client";

import { PubType } from "@/app/config/publishConfig";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { apiCreatePublish } from "@/api/plat/publish";
import { PlatType } from "@/app/config/platConfig";
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
        accountId: "686ba36565c9020dc1f3a043",
        accountType: PlatType.BILIBILI,
        videoUrl:
          "https://v2-zj-bjcm.kwaicdn.com/upic/2025/06/24/09/BMjAyNTA2MjQwOTI3MjlfNDQwMjk3NjY1Nl8xNjc1OTkwOTUzNzBfMl8z_b_Bea472124f75ea09e1483d87c112ede39.mp4?tag=1-1751887066-unknown-0-uqpbdciha7-0f5473b4478e400b&provider=self&clientCacheKey=3xcwhdmk5jcyv8y_b.mp4&di=dfa08272&bp=14944&x-ks-ptid=167599095370&Aecs=172.17.4.195&ocid=100001260&tt=b&ss=vpm",
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

  return (
    <div>
      <div>========= 发布记录 ==============</div>
      <div>
        <button onClick={createPublish}>创建记录</button>
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
