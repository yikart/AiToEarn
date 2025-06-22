"use client";

import { useEffect, useState } from "react";
import { getMediaGroupList } from "@/api/media";
import {
  apiCreateMaterialGroup,
  apiCreateMaterialList,
  apiGetMaterialGroupList,
  MaterialType,
} from "@/api/material";

interface NewMaterialGroup {
  type: MaterialType;
  name: string;
  prompt?: string;
  title?: string;
  desc?: string;
  location?: number[];
  publishTime?: string;
  mediaGroups?: string[];
  coverGroup?: string;
  option?: Record<string, any>;
}

export const DemoMaterial = () => {
  const [newMaterialGroup, setNewMaterialGroup] = useState<NewMaterialGroup>({
    type: MaterialType.ARTICLE,
    name: "测试素材组",
    prompt: "语调优美，多用成语和感叹词。",
    title: "景色优美，人人共赏",
    desc: "作为一个美景鉴赏者",
    location: [0, 0],
    publishTime: new Date().toISOString(),
    mediaGroups: [],
    coverGroup: "",
    option: {},
  });

  const [mediaGroupList, setMediaGroupList] = useState<any[]>([]);
  const [materialGroupList, setMaterialGroupList] = useState<any[]>([]);

  useEffect(() => {
    getMediaGroups();
    getMaterialGroupList();
    //
  }, []);

  async function createMaterialGroup() {
    const res = await apiCreateMaterialGroup(newMaterialGroup);
    console.log("------ createMaterialGroup ---- ", res);
  }

  async function getMediaGroups() {
    // 获取素材组列表
    const res = await getMediaGroupList(1, 10);
    console.log("----- res", res);
    setMediaGroupList(res?.data.list || []);
  }

  // 设置封面素材组
  async function setCoverGroup(groupId: string) {
    console.log("----- setCoverGroup", groupId);

    setNewMaterialGroup({
      ...newMaterialGroup,
      coverGroup: groupId,
    });
  }

  // 设置媒体素材组
  async function setMediaGroup(groupId: string) {
    newMaterialGroup.mediaGroups?.push(groupId);
    setNewMaterialGroup({
      ...newMaterialGroup,
    });
  }

  // 获取素材组列表
  async function getMaterialGroupList() {
    const res = await apiGetMaterialGroupList(1, 10);
    console.log("----- apiGetMaterialGroupList res", res);
    setMaterialGroupList(res?.data.list || []);
  }

  /**
   * 批量创建素材
   */
  async function createMaterialList(groupId: string) {
    const res = await apiCreateMaterialList({
      groupId,
      num: 10,
      option: {
        max: 10,
        language: "中文",
      },
    });
    console.log("------ createMaterialGroup ---- ", res);
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
              {newMaterialGroup.mediaGroups?.map((item) => (
                <span>--{item}</span>
              ))}
            </div>
            <div>封面媒体组ID：{newMaterialGroup.coverGroup}</div>
          </div>
        )}
        <p>----- 素材信息 END -----</p>
      </div>
      <div>
        <button onClick={createMaterialGroup}>创建素材组</button>
      </div>
      <div>
        <p>----- 素材组列表 STR -----</p>
        <div>
          {materialGroupList.map((item) => (
            <div key={item.id}>
              <div>ID：{item.id}</div>
              <div>标题：{item.title}</div>
              <div>描述：{item.desc}</div>
              <div>封面素材组ID：{item.coverGroup}</div>

              <button onClick={() => createMaterialList(item._id)}>
                批量创建素材
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
