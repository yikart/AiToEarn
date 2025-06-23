"use client";

import { useEffect, useState } from "react";
import { Button, Form, Input, Select, Modal, message, Space, InputNumber, List, Card, Spin } from "antd";
import styles from "./styles/cgmaterial.module.scss";
import {
  apiCreateMaterialGroup,
  apiGetMaterialGroupList,
  apiGetMaterialList,
  apiCreateMaterial,
  apiCreateMaterialTask,
  apiStartMaterialTask,
  MaterialType,
} from "@/api/material";
import { getMediaGroupList, getMediaList } from "@/api/media";
import { getOssUrl } from "@/utils/oss";

const { TextArea } = Input;

export default function CgMaterialPageCore() {
  // 草稿箱组相关
  const [groupList, setGroupList] = useState<any[]>([]);
  const [groupLoading, setGroupLoading] = useState(false);
  const [createGroupModal, setCreateGroupModal] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  // 组内草稿素材相关
  const [materialList, setMaterialList] = useState<any[]>([]);
  const [materialLoading, setMaterialLoading] = useState(false);

  // 创建素材弹窗相关
  const [createModal, setCreateModal] = useState(false);
  const [mediaGroupModal, setMediaGroupModal] = useState(false);
  const [mediaGroups, setMediaGroups] = useState<any[]>([]);
  const [selectedMediaGroup, setSelectedMediaGroup] = useState<any>(null);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [selectedCover, setSelectedCover] = useState<string | null>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

  // 创建/批量表单
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [creating, setCreating] = useState(false);
  const [batchModal, setBatchModal] = useState(false);
  const [batchTaskLoading, setBatchTaskLoading] = useState(false);

  const [detailModal, setDetailModal] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  // 初始化加载草稿箱组
  useEffect(() => {
    fetchGroupList();
  }, []);

  async function fetchGroupList() {
    setGroupLoading(true);
    try {
      const res = await apiGetMaterialGroupList(1, 50);
      setGroupList(res?.data?.list || []);
      if (!selectedGroup && res?.data?.list?.length) {
        setSelectedGroup(res.data.list[0]);
      }
    } catch (e) {
      message.error("获取草稿箱组失败");
    } finally {
      setGroupLoading(false);
    }
  }

  // 选中组后加载组内素材
  useEffect(() => {
    if (selectedGroup && selectedGroup._id) {
      fetchMaterialList(selectedGroup._id);
    }
  }, [selectedGroup]);

  async function fetchMaterialList(groupId: string) {
    setMaterialLoading(true);
    try {
      const res = await apiGetMaterialList(groupId, 1, 50);
      setMaterialList(res?.data?.list || []);
    } catch (e) {
      message.error("获取草稿素材失败");
    } finally {
      setMaterialLoading(false);
    }
  }

  // 创建草稿箱组
  async function handleCreateGroup() {
    if (!newGroupTitle) return message.warning("请输入草稿箱组名称");
    setCreating(true);
    try {
      await apiCreateMaterialGroup({
        type: MaterialType.ARTICLE,
        name: newGroupTitle,
      });
      message.success("创建草稿箱组成功");
      setCreateGroupModal(false);
      setNewGroupTitle("");
      fetchGroupList();
    } catch (e) {
      message.error("创建草稿箱组失败");
    } finally {
      setCreating(false);
    }
  }

  // 打开创建素材弹窗时，先加载媒体组
  async function openCreateMaterialModal() {
    setCreateModal(true);
    setMediaGroupModal(true);
    setSelectedMediaGroup(null);
    setMediaList([]);
    setSelectedCover(null);
    setSelectedMaterials([]);
    const res = await getMediaGroupList(1, 50);
    setMediaGroups(res?.data?.list || []);
  }

  // 选择媒体组后，加载资源
  async function handleSelectMediaGroup(group: any) {
    setSelectedMediaGroup(group);
    setMediaGroupModal(false);
    const res = await getMediaList(group._id, 1, 100);
    setMediaList(res?.data?.list || []);
    setSelectedCover(null);
    setSelectedMaterials([]);
  }

  // 创建单个素材
  async function handleCreateMaterial() {
    await form.validateFields(); // 先校验
    const values = form.getFieldsValue(); // 再获取所有值
    if (!selectedMediaGroup || !selectedCover || selectedMaterials.length === 0) {
      message.warning('请完整选择媒体组、封面和素材');
      return;
    }
    setCreating(true);
    try {
      await apiCreateMaterial({
        groupId: selectedGroup._id,
        coverUrl: selectedCover,
        mediaList: mediaList
          .filter((m: any) => selectedMaterials.includes(m.url))
          .map((m: any) => ({
            url: m.url,
            type: m.type,
            content: m.content || '',
          })),
        title: values.title,
        desc: values.desc,
        option: {},
      });
      message.success('创建素材成功');
      setCreateModal(false);
      fetchMaterialList(selectedGroup._id);
      form.resetFields();
    } catch (e) {
      message.error('创建素材失败');
    } finally {
      setCreating(false);
    }
  }

  // 批量生成草稿
  async function handleBatchMaterial() {
    const values = await batchForm.validateFields();
    setBatchTaskLoading(true);
    try {
      const res = await apiCreateMaterialTask({
        groupId: selectedGroup._id,
        num: values.num,
        aiModelTag: values.model,
        prompt: values.prompt,
        title: values.title,
        desc: values.desc,
        location: [0, 0],
        publishTime: new Date(),
        mediaGroups: [],
        coverGroup: "",
        option: {},
      });
      const taskId = res?.data?._id;
      if (taskId) {
        await apiStartMaterialTask(taskId);
        message.success("批量生成任务已启动");
        setBatchModal(false);
        batchForm.resetFields();
        fetchMaterialList(selectedGroup._id);
      }
    } catch (e) {
      message.error("批量生成草稿失败");
    } finally {
      setBatchTaskLoading(false);
    }
  }

  return (
    <div className={styles.materialContainer}>
      <div className={styles.header}>
        <h2>AI草稿箱</h2>
        <Button type="primary" onClick={()=>setCreateGroupModal(true)}>新建草稿箱组</Button>
      </div>
      <div style={{display:'flex',gap:32,marginTop:24}}>
        {/* 左侧组列表 */}
        <div style={{width:260}}>
          <Spin spinning={groupLoading}>
            <List
              bordered
              dataSource={groupList}
              renderItem={item => (
                <List.Item
                  style={{cursor:'pointer',background:selectedGroup?._id===item._id?'#e6f4ff':'#fff'}}
                  onClick={()=>setSelectedGroup(item)}
                >
                  <div style={{fontWeight:500}}>{item.name || item.title}</div>
                </List.Item>
              )}
            />
          </Spin>
        </div>
        {/* 右侧组内素材列表及操作 */}
        <div style={{flex:1,minWidth:360}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{fontWeight:600,fontSize:18}}>
              {selectedGroup?.name || selectedGroup?.title || '未选择组'}
            </div>
            <Space>
              <Button type="primary" onClick={openCreateMaterialModal} disabled={!selectedGroup}>创建素材</Button>
              <Button onClick={()=>setBatchModal(true)} disabled={!selectedGroup}>批量生成草稿</Button>
            </Space>
          </div>
          <Spin spinning={materialLoading}>
            <List
              grid={{gutter:16,column:3}}
              dataSource={materialList}
              renderItem={item => (
                <List.Item>
                  <Card
                    hoverable
                    onClick={() => { setDetailData(item); setDetailModal(true); }}
                    cover={
                      item.coverUrl ? (
                        <img
                          src={getOssUrl(item.coverUrl)}
                          alt="cover"
                          style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6 }}
                        />
                      ) : null
                    }
                  >
                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{item.title}</div>
                    <div style={{ color: "#888", marginBottom: 4 }}>{item.desc}</div>
                    <div>
                      <span style={{ marginRight: 8, color: "#1677ff" }}>
                        {item.type === MaterialType.ARTICLE ? "图文" : item.type === MaterialType.VIDEO ? "视频" : item.type}
                      </span>
                      <span style={{ color: item.status === 0 ? "#faad14" : "#52c41a" }}>
                        {item.status === 0 ? "草稿" : "已发布"}
                      </span>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </Spin>
        </div>
      </div>
      {/* 创建草稿箱组弹窗 */}
      <Modal
        open={createGroupModal}
        title="新建草稿箱组"
        onOk={handleCreateGroup}
        onCancel={()=>setCreateGroupModal(false)}
        confirmLoading={creating}
      >
        <Input
          placeholder="请输入草稿箱组名称"
          value={newGroupTitle}
          onChange={e=>setNewGroupTitle(e.target.value)}
        />
      </Modal>
      {/* 创建素材弹窗 */}
      <Modal
        open={createModal}
        title="创建素材"
        onOk={handleCreateMaterial}
        onCancel={()=>setCreateModal(false)}
        confirmLoading={creating}
        width={700}
      >
        {/* 媒体组选择弹窗 */}
        <Modal
          open={mediaGroupModal}
          title="选择媒体组"
          onCancel={() => setMediaGroupModal(false)}
          footer={null}
          width={600}
        >
          <List
            dataSource={mediaGroups}
            renderItem={item => (
              <List.Item
                style={{ cursor: 'pointer', background: selectedMediaGroup?._id === item._id ? '#e6f4ff' : '#fff' }}
                onClick={() => handleSelectMediaGroup(item)}
              >
                <div style={{ fontWeight: 500 }}>{item.title}</div>
              </List.Item>
            )}
          />
        </Modal>
        {/* 资源选择区 */}
        {selectedMediaGroup && (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>选择封面（单选）</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {mediaList.map((media: any) => (
                  <img
                    key={media._id}
                    src={getOssUrl(media.url)}
                    alt=""
                    style={{
                      width: 60,
                      height: 60,
                      border: selectedCover === media.url ? '2px solid #1677ff' : '1px solid #eee',
                      borderRadius: 4,
                      cursor: 'pointer',
                      objectFit: 'cover',
                    }}
                    onClick={() => setSelectedCover(media.url)}
                  />
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>选择素材（多选）</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {mediaList.map((media: any) => (
                  <img
                    key={media._id}
                    src={getOssUrl(media.url)}
                    alt=""
                    style={{
                      width: 60,
                      height: 60,
                      border: selectedMaterials.includes(media.url) ? '2px solid #1677ff' : '1px solid #eee',
                      borderRadius: 4,
                      cursor: 'pointer',
                      objectFit: 'cover',
                      opacity: selectedCover === media.url ? 0.5 : 1,
                    }}
                    onClick={() => {
                      if (selectedCover === media.url) return;
                      setSelectedMaterials(prev =>
                        prev.includes(media.url)
                          ? prev.filter(url => url !== media.url)
                          : [...prev, media.url]
                      );
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}
        {/* 表单区 */}
        <Form form={form} layout="vertical">
          <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="简介" name="desc">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
      {/* 批量生成草稿弹窗 */}
      <Modal
        open={batchModal}
        title="批量生成草稿"
        onOk={handleBatchMaterial}
        onCancel={()=>setBatchModal(false)}
        confirmLoading={batchTaskLoading}
      >
        <Form form={batchForm} layout="vertical">
          <Form.Item label="大模型" name="model" rules={[{required:true,message:'请选择大模型'}]}>
            <Select options={[{label:'图片1.0',value:'图片1.0'},{label:'文生图2.0',value:'文生图2.0'}]} style={{width:200}}/>
          </Form.Item>
          <Form.Item label="提示词" name="prompt">
            <Input/>
          </Form.Item>
          <Form.Item label="标题" name="title">
            <Input/>
          </Form.Item>
          <Form.Item label="简介" name="desc">
            <TextArea rows={3}/>
          </Form.Item>
          <Form.Item label="生成数量" name="num" initialValue={4} rules={[{required:true}]}> 
            <InputNumber min={1} max={20}/>
          </Form.Item>
        </Form>
      </Modal>
      {/* 详情弹窗 */}
      <Modal
        open={detailModal}
        title="素材详情"
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={600}
      >
        {detailData && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <b>标题：</b>{detailData.title}
            </div>
            <div style={{ marginBottom: 16 }}>
              <b>简介：</b>{detailData.desc}
            </div>
            <div style={{ marginBottom: 16 }}>
              <b>类型：</b>
              {detailData.type === MaterialType.ARTICLE ? "图文" : detailData.type === MaterialType.VIDEO ? "视频" : detailData.type}
            </div>
            <div style={{ marginBottom: 16 }}>
              <b>状态：</b>
              <span style={{ color: detailData.status === 0 ? "#faad14" : "#52c41a" }}>
                {detailData.status === 0 ? "草稿" : "已发布"}
              </span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <b>封面：</b>
              {detailData.coverUrl && (
                <img
                  src={getOssUrl(detailData.coverUrl)}
                  alt="cover"
                  style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 6, marginLeft: 8 }}
                />
              )}
            </div>
            <div style={{ marginBottom: 16 }}>
              <b>素材内容：</b>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {Array.isArray(detailData.mediaList) && detailData.mediaList.map((media: any, idx: number) => (
                  <img
                    key={idx}
                    src={getOssUrl(media.url)}
                    alt=""
                    style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4 }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
} 