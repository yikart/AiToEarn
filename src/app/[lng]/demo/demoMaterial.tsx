"use client";

import { useEffect, useState } from "react";
import { getMediaGroupList } from "@/api/media";
import {
  apiCreateMaterialGroup,
  apiCreateMaterialTask,
  apiStartMaterialTask,
  apiGetMaterialGroupList,
  MaterialType,
  NewMaterialTask,
} from "@/api/material";

interface NewMaterialGroup {
  type: MaterialType;
  name: string;
  desc?: string;
}

export const DemoMaterial = () => {
  const [newMaterialGroup, setNewMaterialGroup] = useState<NewMaterialGroup>({
    type: MaterialType.ARTICLE,
    name: "测试素材组",
    desc: "美景鉴赏者素材组",
  });

  const [taskId, setTaskId] = useState<string>("");
  const [groupId, setGroupId] = useState<string>("");

  const [newMaterialTask, setNewMaterialTask] = useState<NewMaterialTask>({
    groupId,
    num: 10,
    aiModelTag: "ali",
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

  async function createMaterialTask(groupId: string) {
    const res = await apiCreateMaterialTask({
      ...newMaterialTask,
      groupId,
    });
    setGroupId(groupId);
    console.log("------ createMaterialTask ---- ", res);
  }

  async function startMaterialTask() {
    const res = await apiStartMaterialTask("68598003d2330bec633c14da");
    console.log("------ startMaterialTask ---- ", res);
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

    setNewMaterialTask({
      ...newMaterialTask,
      coverGroup: groupId,
    });
  }

  // 设置媒体素材组
  async function setMediaGroup(groupId: string) {
    newMaterialTask.mediaGroups?.push(groupId);
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
        <p>----- 草稿组信息 STR -----</p>
        {newMaterialGroup && (
          <div>
            <div>{newMaterialGroup.type}</div>
            <div>{newMaterialGroup.name}</div>
            <div>{newMaterialGroup.desc}</div>
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

              <button onClick={() => createMaterialTask(item._id)}>创建任务</button>
            </div>
          ))}
        </div>

        <p>----- 任务信息 STR -----</p>
        {newMaterialGroup && (
          <div>
            <div>{newMaterialTask.groupId}</div>
            <div>{newMaterialTask.title}</div>
            <div>{newMaterialTask.desc}</div>
            <div>{newMaterialTask.aiModelTag}</div>
            <div>{newMaterialTask.prompt}</div>
            <div>{newMaterialTask.location}</div>
            <div>{newMaterialTask.publishTime?.toString()}</div>
            <div>
              内容媒体组数组：
              {newMaterialTask.mediaGroups?.map((item) => (
                <span>--{item}</span>
              ))}
            </div>
            <div>封面媒体组ID：{newMaterialTask.coverGroup}</div>
          </div>
        )}
        <p>----- 任务信息 END -----</p>

        <button onClick={() => startMaterialTask()}>开始任务</button>
      </div>
    </div>
  );
};
