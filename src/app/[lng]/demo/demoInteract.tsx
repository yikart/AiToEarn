"use client";
import { apiAddArcComment, apiGetArcCommentList } from "@/api/plat/interact";
const accountId = "686bc457e9a745f012552abf";
const dataId = "686bc457e9a745f012552abf";
const content = "感谢各位粉丝的关注！";

export const DemoInteract = () => {
  const addArcComment = async () => {
    try {
      const res: any = await apiAddArcComment({
        accountId: accountId,
        dataId,
        content,
      });
      console.log("获取数据成功:---", res);

      if (res?.data?.data) {
        console.log("创建记录成功:", res.data.data);
      }
    } catch (error) {
      console.error("创建记录失败:", error);
    }
  };

  return (
    <div>
      <div style={{ marginTop: "20px" }}>
        <h3>渠道互动测试：</h3>
        <div>
          <button onClick={addArcComment}>添加作品评论</button>
        </div>
      </div>
    </div>
  );
};
