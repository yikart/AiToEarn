"use client";

import { useEffect, useState } from "react";
import { getMediaGroupList } from "@/api/media";
import { MaterialType } from "@/api/material";

interface NewMaterialGroup {
  type: MaterialType;
  name: string;
  prompt?: string;
  title?: string;
  desc?: string;
  location?: number[];
  publishTime?: Date;
  mediaGroups?: string[];
  coverGroup?: string;
  option?: Record<string, any>;
}

export const DemoMaterial = () => {
  const [newMaterialGroup, setNewMaterialGroup] = useState<NewMaterialGroup>({
    type: MaterialType.ARTICLE,
    name: "测试素材组",
    prompt: "测试素材组",
    title: "测试素材组",
    desc: "测试素材组",
    location: [0, 0],
    publishTime: new Date(),
    mediaGroups: [],
    coverGroup: "",
    option: {},
  });

  const [mediaGroupList, setMediaGroupList] = useState<any[]>([]);

  useEffect(() => {
    getMediaGroups();
    //
  }, []);

  const createPublish = async () => {};

  async function getMediaGroups() {
    // 获取素材组列表
    const res = await getMediaGroupList(1, 10);
    console.log("----- res", res);
    setMediaGroupList(res?.data.list || []);
  }

  // 设置封面素材组
  async function setCoverGroup(groupId: string) {
    console.log("----- setCoverGroup", groupId);
    
    setNewMaterialGroup(
      {
        ...newMaterialGroup,
        coverGroup: groupId,
      },
    );
  }

  // 设置媒体素材组
  async function setMediaGroup(groupId: string) {
    newMaterialGroup.mediaGroups?.push(groupId);
    setNewMaterialGroup({
      ...newMaterialGroup,
    });
  }

  return (
    <div>
      <div>========= 素材草稿 ==============</div>
      <div>
        <p>----- 媒体组列表 STR -----</p>
        {mediaGroupList.map((item) => (
          <div key={item.id}>
            <div>{item.title}</div>
            <button
              className="btn btn-primary"
              onClick={() => setCoverGroup(item._id)}
            >
              作为封面媒体组
            </button>
            <button onClick={() => setMediaGroup(item._id)}>
              作为内容媒体组
            </button>
          </div>
        ))}
        <p>----- 媒体组列表 END -----</p>
      </div>
      <div>
        <p>----- 素材信息 STR -----</p>
        {newMaterialGroup && (
          <div>
            <div>{newMaterialGroup.type}</div>
            <div>{newMaterialGroup.name}</div>
            <div>{newMaterialGroup.prompt}</div>
            <div>{newMaterialGroup.title}</div>
            <div>{newMaterialGroup.desc}</div>
            <div>{newMaterialGroup.location}</div>
            <div>{newMaterialGroup.publishTime?.toString()}</div>
            <div>
              内容媒体组数组：
              {newMaterialGroup.mediaGroups?.map((item) => <span>--{item}</span>)}
            </div>
            <div>封面媒体组ID：{newMaterialGroup.coverGroup}</div>
          </div>
        )}
        <p>----- 素材信息 END -----</p>
      </div>
      <div>
        <button onClick={createPublish}>创建记录</button>
      </div>
    </div>
  );
};
