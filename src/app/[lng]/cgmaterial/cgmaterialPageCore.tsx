"use client";

import { useEffect, useState } from "react";
import { Button, Form, Input, Select, Modal, message, Space, InputNumber, List, Card, Spin, Carousel, Avatar } from "antd";
import styles from "./styles/cgmaterial.module.scss";
import {
  apiCreateMaterialGroup,
  apiGetMaterialGroupList,
  apiGetMaterialList,
  apiCreateMaterial,
  apiCreateMaterialTask,
  apiStartMaterialTask,
  MaterialType,
  apiDeleteMaterialGroup,
  apiUpdateMaterialGroupInfo,
  apiPreviewMaterialTask,
} from "@/api/material";
import { getMediaGroupList, getMediaList } from "@/api/media";
import { getOssUrl } from "@/utils/oss";
import { EditOutlined, DeleteOutlined, PlusOutlined, ImportOutlined, FileTextOutlined, FolderOpenOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { getAccountListApi } from "@/api/account";
import { getPublishList } from "@/api/plat/publish";
import { PlatType } from "@/app/config/platConfig";
import { PublishStatus } from "@/api/plat/types/publish.types";

const { TextArea } = Input;

export default function CgMaterialPageCore() {
  // 草稿箱组相关
  const [groupList, setGroupList] = useState<any[]>([]);
  const [groupLoading, setGroupLoading] = useState(false);
  const [createGroupModal, setCreateGroupModal] = useState(false);
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
  // 单个素材位置
  const [singleLocation, setSingleLocation] = useState<[number, number]>([0, 0]);

  // 创建/批量表单
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [createGroupForm] = Form.useForm();
  const [creating, setCreating] = useState(false);
  const [batchModal, setBatchModal] = useState(false);
  const [batchTaskLoading, setBatchTaskLoading] = useState(false);

  // 批量生成草稿相关
  const [batchMediaGroups, setBatchMediaGroups] = useState<string[]>([]);
  const [batchCoverGroup, setBatchCoverGroup] = useState<string>("");
  const [batchLocation, setBatchLocation] = useState<[number, number]>([0, 0]);
  // 预览相关
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [lastTaskParams, setLastTaskParams] = useState<any>(null);
  const [previewModal, setPreviewModal] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewList, setPreviewList] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);

  const [detailModal, setDetailModal] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  // 编辑组相关
  const [editGroupModal, setEditGroupModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);

  // 记录显示操作按钮的组id
  const [showActionsId, setShowActionsId] = useState<string | null>(null);

  // 导入功能相关
  const [importModal, setImportModal] = useState(false);
  const [accountList, setAccountList] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [publishList, setPublishList] = useState<any[]>([]);
  const [selectedPublishItems, setSelectedPublishItems] = useState<string[]>([]);
  const [importLoading, setImportLoading] = useState(false);

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
      // @ts-ignore
      setMaterialList(res?.data?.list || []);
    } catch (e) {
      message.error("获取草稿素材失败");
    } finally {
      setMaterialLoading(false);
    }
  }

  // 创建草稿箱组
  async function handleCreateGroup() {
    try {
      const values = await createGroupForm.validateFields();
      setCreating(true);
      await apiCreateMaterialGroup({
        type: values.type,
        name: values.name,
        desc: values.desc || '',
      });
      message.success("创建草稿箱组成功");
      setCreateGroupModal(false);
      createGroupForm.resetFields();
      fetchGroupList();
          } catch (e: any) {
        if (e?.errorFields) {
          message.warning("请完善表单信息");
        } else {
          message.error("创建草稿箱组失败");
        }
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
    setMediaGroups(((res?.data as any)?.list as any[]) || []);
    // 获取地理位置
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSingleLocation([pos.coords.longitude, pos.coords.latitude]);
          form.setFieldsValue({ location: [pos.coords.longitude, pos.coords.latitude] });
        },
        () => {
          setSingleLocation([0, 0]);
          form.setFieldsValue({ location: [0, 0] });
        }
      );
    } else {
      setSingleLocation([0, 0]);
      form.setFieldsValue({ location: [0, 0] });
    }
  }

  // 选择媒体组后，加载资源
  async function handleSelectMediaGroup(group: any) {
    setSelectedMediaGroup(group);
    setMediaGroupModal(false);
    const res = await getMediaList(group._id, 1, 100);
    // @ts-ignore
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
        location: singleLocation,
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

  // 打开批量生成草稿弹窗时，拉取媒体组和定位
  async function openBatchModal() {
    setBatchModal(true);
    // 拉取媒体组
    const res = await getMediaGroupList(1, 50);
    setMediaGroups(((res?.data as any)?.list as any[]) || []);
    // 获取地理位置
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setBatchLocation([pos.coords.longitude, pos.coords.latitude]);
          batchForm.setFieldsValue({ location: [pos.coords.longitude, pos.coords.latitude] });
        },
        () => {
          setBatchLocation([0, 0]);
          batchForm.setFieldsValue({ location: [0, 0] });
        }
      );
    } else {
      setBatchLocation([0, 0]);
      batchForm.setFieldsValue({ location: [0, 0] });
    }
  }

  // 生成任务参数
  function getBatchTaskParams() {
    const values = batchForm.getFieldsValue();
    return {
      groupId: selectedGroup?._id,
      num: values.num,
      aiModelTag: values.model,
      prompt: values.prompt,
      title: values.title,
      desc: values.desc,
      location: batchLocation,
      publishTime: new Date().toISOString(),
      mediaGroups: batchMediaGroups,
      coverGroup: batchCoverGroup,
      option: {},
    };
  }

  // 预览批量生成草稿
  async function handlePreviewMaterial() {
    const values = await batchForm.validateFields();
    const params = getBatchTaskParams();
    // 判断参数是否变化
    if (!lastTaskParams || JSON.stringify(params) !== JSON.stringify(lastTaskParams)) {
      setCurrentTaskId(null);
      setLastTaskParams(params);
    }
    setPreviewLoading(true);
    let taskId = currentTaskId;
    try {
      if (!taskId) {
        const res = await apiCreateMaterialTask(params);
        taskId = res?.data?._id || null;
        setCurrentTaskId(taskId ?? null);
      }
      if (taskId) {
        const res = await apiPreviewMaterialTask(taskId);
        // @ts-ignore
        setPreviewData(res?.data?.data || null);
        setPreviewModal(true);
      } else {
        message.error("获取预览失败");
      }
    } catch (e) {
      message.error("获取预览失败");
    } finally {
      setPreviewLoading(false);
    }
  }

  // 批量生成草稿
  async function handleBatchMaterial() {
    const values = await batchForm.validateFields();
    const params = getBatchTaskParams();
    setBatchTaskLoading(true);
    try {
      let taskId = currentTaskId;
      // 如果参数变化或没有taskId，重新创建
      if (!lastTaskParams || JSON.stringify(params) !== JSON.stringify(lastTaskParams)) {
        const res = await apiCreateMaterialTask(params);
        taskId = res?.data?._id || null;
        setCurrentTaskId(taskId ?? null);
        setLastTaskParams(params);
      }
      if (taskId) {
        await apiStartMaterialTask(taskId);
        message.success("批量生成任务已启动");
        setBatchModal(false);
        batchForm.resetFields();
        fetchMaterialList(selectedGroup._id);
        setCurrentTaskId(null);
        setLastTaskParams(null);
      }
    } catch (e) {
      message.error("批量生成草稿失败");
    } finally {
      setBatchTaskLoading(false);
    }
  }

  // 处理编辑组
  async function handleEditGroup() {
    if (!editGroupName) return message.warning("请输入新组名");
    setEditLoading(true);
    try {
      await apiUpdateMaterialGroupInfo(editingGroup._id, { name: editGroupName });
      message.success("更新成功");
      setEditGroupModal(false);
      setEditGroupName("");
      setEditingGroup(null);
      fetchGroupList();
    } catch {
      message.error("更新失败");
    } finally {
      setEditLoading(false);
    }
  }

  // 打开导入弹窗
  async function openImportModal() {
    setImportModal(true);
    try {
      const res = await getAccountListApi();
      setAccountList(res?.data || []);
    } catch (e) {
      message.error("获取账户列表失败");
    }
  }

  // 选择账户后获取发布列表
  async function handleSelectAccount(account: any) {
    setSelectedAccount(account);
    try {
      const res = await getPublishList({
        accountId: account.id,
        accountType: account.type as PlatType,
        status: PublishStatus.RELEASED, // 只获取已发布的内容
      });
      setPublishList(res?.data || []);
    } catch (e) {
      message.error("获取发布列表失败");
      setPublishList([]);
    }
  }

  // 导入选中的发布内容到草稿箱
  async function handleImportPublishItems() {
    if (!selectedAccount || selectedPublishItems.length === 0) {
      message.warning('请选择要导入的发布内容');
      return;
    }
    
    if (!selectedGroup) {
      message.warning('请先选择草稿箱组');
      return;
    }

    setImportLoading(true);
    try {
      const importPromises = selectedPublishItems.map(async (itemId) => {
        const publishItem = publishList.find(item => item.id === itemId);
        if (!publishItem) return;

        // 构造素材数据
        const mediaList = [];
                 if (publishItem.imgUrlList && publishItem.imgUrlList.length > 0) {
           mediaList.push(...publishItem.imgUrlList.map((url: string) => ({
             url,
             type: 'image',
             content: '',
           })));
         }
        if (publishItem.videoUrl) {
          mediaList.push({
            url: publishItem.videoUrl,
            type: 'video',
            content: '',
          });
        }

        return apiCreateMaterial({
          groupId: selectedGroup._id,
          coverUrl: publishItem.coverUrl || publishItem.imgUrlList?.[0] || '',
          mediaList,
          title: publishItem.title,
          desc: publishItem.desc,
          option: publishItem.option || {},
          location: [0, 0], // 默认位置
        });
      });

      await Promise.all(importPromises);
      message.success(`成功导入 ${selectedPublishItems.length} 条内容到草稿箱`);
      setImportModal(false);
      setSelectedPublishItems([]);
      setSelectedAccount(null);
      setPublishList([]);
      fetchMaterialList(selectedGroup._id);
    } catch (e) {
      message.error('导入失败');
    } finally {
      setImportLoading(false);
    }
  }

  // 组列表项事件：PC端长按，移动端左滑
  function handleGroupItemEvents(item: any) {
    let timer: any = null;
    let startX = 0;
    let moved = false;
    return {
      onPointerDown: (e: any) => {
        if (e.pointerType === 'touch') {
          startX = e.clientX;
          moved = false;
          const move = (ev: any) => {
            if (Math.abs(ev.clientX - startX) > 40) {
              setShowActionsId(item._id);
              moved = true;
              window.removeEventListener('pointermove', move);
            }
          };
          window.addEventListener('pointermove', move);
          const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            if (!moved) setTimeout(() => setShowActionsId(null), 2000);
          };
          window.addEventListener('pointerup', up);
        } else {
          timer = setTimeout(() => {
            setShowActionsId(item._id);
          }, 700);
          const up = () => {
            clearTimeout(timer);
            window.removeEventListener('pointerup', up);
            setTimeout(() => setShowActionsId(null), 2000);
          };
          window.addEventListener('pointerup', up);
        }
      },
      onMouseLeave: () => {
        setTimeout(() => setShowActionsId(null), 500);
      },
      onMouseEnter: () => {
        setShowActionsId(item._id);
      },
    };
  }

  // 获取平台显示名称
  function getPlatformName(type: string) {
    const platformNames: Record<string, string> = {
      'tiktok': 'TikTok',
      'youtube': 'YouTube', 
      'twitter': 'Twitter',
      'bilibili': '哔哩哔哩',
      'KWAI': '快手',
      'douyin': '抖音',
      'xhs': '小红书',
      'wxSph': '微信视频号',
      'wxGzh': '微信公众号',
      'facebook': 'Facebook',
      'instagram': 'Instagram',
      'threads': 'Threads',
    };
    return platformNames[type] || type;
  }

  return (
    <div className={styles.materialContainer}>
      <div className={styles.header}>
        <h2>AI草稿箱</h2>
        <div className={styles.headerActions}>
          <Button 
            className={`${styles.actionButton} ${styles.importButton}`}
            onClick={openImportModal}
            icon={<ImportOutlined />}
          >
            导入发布内容
          </Button>
          <Button 
            className={styles.actionButton}
            onClick={() => setCreateGroupModal(true)}
            icon={<PlusOutlined />}
          >
            新建草稿箱组
          </Button>
        </div>
      </div>
      
      <div className={styles.cgMain}>
        {/* 左侧边栏 */}
        <div className={styles.sidebar}>
          <div className={styles.groupListContainer}>
            <Spin spinning={groupLoading}>
              {groupList.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <FolderOpenOutlined />
                  </div>
                  <h3>暂无草稿箱组</h3>
                  <p>创建您的第一个草稿箱组开始整理素材</p>
                </div>
              ) : (
                <List
                  dataSource={groupList as any[]}
                  renderItem={(item: any) => (
                    <List.Item
                      className={styles.groupItem + (selectedGroup?._id===item._id ? ' ' + styles.selected : '') + (showActionsId===item._id ? ' ' + styles.showActions : '')}
                      onClick={()=>setSelectedGroup(item as any)}
                      {...handleGroupItemEvents(item)}
                    >
                      <div className={styles.groupName} style={{ marginTop: 10, paddingLeft: 10 }}>{item.name || item.title}</div>
                      <div className={styles.descTypeInfo} style={{ marginBottom: 10, paddingLeft: 10, paddingRight: 10 }}>
                        <span>{item.desc || '暂无描述'}</span>
                        <span className={styles.typeTag}>
                          {item.type === MaterialType.ARTICLE ? '图文' : item.type === MaterialType.VIDEO ? '视频' : item.type}
                        </span>
                      </div>
                      <div className={styles.groupActions}>
                        <span
                          className={styles.groupActionBtn}
                          onClick={e => {
                            e.stopPropagation();
                            setEditingGroup(item);
                            setEditGroupName(item.name || item.title || "");
                            setEditGroupModal(true);
                          }}
                        >
                          <EditOutlined /> 编辑
                        </span>
                        <span
                          className={styles.groupActionBtn}
                          onClick={e => {
                            e.stopPropagation();
                            Modal.confirm({
                              title: '删除草稿组',
                              content: `确定要删除"${item.name || item.title}"吗？`,
                              okText: '删除',
                              okType: 'danger',
                              cancelText: '取消',
                              onOk: async () => {
                                try {
                                  await apiDeleteMaterialGroup(item._id);
                                  message.success('删除成功');
                                  fetchGroupList();
                                } catch {
                                  message.error('删除失败');
                                }
                              },
                            });
                          }}
                        >
                          <DeleteOutlined /> 删除
                        </span>
                      </div>
                    </List.Item>
                  )}
                />
              )}
            </Spin>
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className={styles.contentArea}>
          <div className={styles.contentHeader}>
            <div className={styles.contentTitle}>
              {selectedGroup?.name || selectedGroup?.title || '请选择草稿箱组'}
            </div>
            <div className={styles.contentActions}>
              <Button 
                className={styles.actionButton}
                onClick={openCreateMaterialModal} 
                disabled={!selectedGroup}
                icon={<PlusOutlined />}
              >
                创建素材
              </Button>
              <Button 
                className={styles.actionButton}
                onClick={openBatchModal} 
                disabled={!selectedGroup}
                icon={<FileTextOutlined />}
              >
                批量生成草稿
              </Button>
            </div>
          </div>

          <div className={styles.materialListContainer}>
            <Spin spinning={materialLoading}>
              {!selectedGroup ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <FolderOpenOutlined />
                  </div>
                  <h3>请选择草稿箱组</h3>
                  <p>从左侧选择一个草稿箱组来查看其中的素材</p>
                </div>
              ) : materialList.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <FileTextOutlined />
                  </div>
                  <h3>暂无草稿素材</h3>
                  <p>创建您的第一个素材或批量生成草稿</p>
                </div>
              ) : (
                <List
                  grid={{gutter: [16, 16], column: 3}}
                  dataSource={materialList}
                  renderItem={item => (
                    <List.Item>
                      <div
                        className={styles.materialCard}
                        onClick={() => { setDetailData(item); setDetailModal(true); }}
                      >
                        {item.coverUrl && (
                          <img
                            src={getOssUrl(item.coverUrl)}
                            alt="cover"
                            className={styles.cardCover}
                          />
                        )}
                        <div className={styles.cardContent}>
                          <div className={styles.cardTitle}>{item.title}</div>
                          <div className={styles.cardDesc}>{item.desc}</div>
                          <div className={styles.cardMeta}>
                            <span className={styles.typeLabel}>
                              {item.type === MaterialType.ARTICLE ? "图文" : item.type === MaterialType.VIDEO ? "视频" : item.type}
                            </span>
                            <span className={`${styles.statusLabel} ${item.status === 0 ? styles.generating : styles.completed}`}>
                              {item.status === 0 ? "生成中" : "已生成"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              )}
            </Spin>
          </div>
        </div>
      </div>

      {/* 创建草稿箱组弹窗 */}
      <Modal
        open={createGroupModal}
        title="新建草稿箱组"
        onOk={handleCreateGroup}
        onCancel={() => {
          setCreateGroupModal(false);
          createGroupForm.resetFields();
        }}
        confirmLoading={creating}
        width={500}
      >
        <Form form={createGroupForm} layout="vertical">
          <Form.Item 
            label="组名称" 
            name="name" 
            rules={[{ required: true, message: '请输入草稿箱组名称' }]}
          >
            <Input placeholder="请输入草稿箱组名称" />
          </Form.Item>
          
          <Form.Item 
            label="类型" 
            name="type" 
            rules={[{ required: true, message: '请选择草稿类型' }]}
            initialValue={MaterialType.ARTICLE}
          >
            <Select placeholder="请选择草稿类型">
              <Select.Option value={MaterialType.ARTICLE}>
                <FileTextOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                图文草稿
              </Select.Option>
              <Select.Option value={MaterialType.VIDEO}>
                <VideoCameraOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                视频草稿
              </Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="描述" name="desc">
            <TextArea 
              rows={3} 
              placeholder="请输入草稿箱组描述（可选）"
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 导入发布内容弹窗 */}
      <Modal
        open={importModal}
        title="导入已有发布内容"
        onOk={handleImportPublishItems}
        onCancel={() => {
          setImportModal(false);
          setSelectedAccount(null);
          setPublishList([]);
          setSelectedPublishItems([]);
        }}
        confirmLoading={importLoading}
        width={800}
        okText="导入选中内容"
        okButtonProps={{ disabled: selectedPublishItems.length === 0 }}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>选择账户</div>
          <List
            bordered
            style={{ maxHeight: 200, overflow: 'auto' }}
            dataSource={accountList}
            renderItem={account => (
              <List.Item
                style={{ 
                  cursor: 'pointer', 
                  background: selectedAccount?.id === account.id ? '#e6f4ff' : '#fff',
                  padding: '12px 16px'
                }}
                onClick={() => handleSelectAccount(account)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar src={account.avatar} size={32}>
                    {account.nickname?.charAt(0)}
                  </Avatar>
                  <div>
                    <div style={{ fontWeight: 500 }}>{account.nickname}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {getPlatformName(account.type)} • {account.workCount} 作品
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>

        {selectedAccount && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              {selectedAccount.nickname} 的发布内容 (选择要导入的内容)
            </div>
            <List
              bordered
              style={{ maxHeight: 300, overflow: 'auto' }}
              dataSource={publishList}
              renderItem={item => (
                <List.Item
                  style={{ 
                    cursor: 'pointer',
                    background: selectedPublishItems.includes(item.id) ? '#e6f4ff' : '#fff',
                    padding: '12px 16px'
                  }}
                  onClick={() => {
                    setSelectedPublishItems(prev =>
                      prev.includes(item.id)
                        ? prev.filter(id => id !== item.id)
                        : [...prev, item.id]
                    );
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                    {(item.coverUrl || item.imgUrlList?.[0]) && (
                      <img
                        src={getOssUrl(item.coverUrl || item.imgUrlList[0])}
                        alt="cover"
                        style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                        {item.desc?.substring(0, 100)}{item.desc?.length > 100 ? '...' : ''}
                      </div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {new Date(item.publishTime).toLocaleDateString()}
                        {item.imgUrlList?.length > 0 && ` • ${item.imgUrlList.length} 张图片`}
                        {item.videoUrl && ' • 包含视频'}
                      </div>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}
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
          width={700}
        >
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: '#666', fontSize: 14 }}>
              选择一个媒体组来获取其中的图片和视频资源
            </div>
          </div>
          <List
            grid={{ gutter: 16, column: 2 }}
            dataSource={mediaGroups}
            renderItem={item => (
              <List.Item>
                <div
                  className={styles.mediaCard}
                  style={{
                    background: selectedMediaGroup?._id === item._id ? 
                      'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' : 
                      '#FAEFFC',
                    border: selectedMediaGroup?._id === item._id ? 
                      '2px solid #667eea' : '2px solid transparent',
                    padding: '20px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    minHeight: '100px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}
                  onClick={() => handleSelectMediaGroup(item)}
                  onMouseEnter={(e) => {
                    if (selectedMediaGroup?._id !== item._id) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedMediaGroup?._id !== item._id) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div style={{ 
                    fontSize: 24, 
                    marginBottom: 8,
                    color: selectedMediaGroup?._id === item._id ? '#667eea' : '#bdc3c7'
                  }}>
                    <FolderOpenOutlined />
                  </div>
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: 16,
                    color: '#2c3e50',
                    marginBottom: 4
                  }}>
                    {item.title}
                  </div>
                  {item.desc && (
                    <div style={{ 
                      fontSize: 12, 
                      color: '#7f8c8d',
                      lineHeight: 1.4
                    }}>
                      {item.desc}
                    </div>
                  )}
                  {selectedMediaGroup?._id === item._id && (
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#667eea',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 12
                    }}>
                      ✓
                    </div>
                  )}
                </div>
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
          <Form.Item label="地理位置" name="location">
            <Input
              value={singleLocation.join(',')}
              onChange={e => {
                const val = e.target.value.split(',').map((v: string) => Number(v.trim()));
                setSingleLocation([val[0] || 0, val[1] || 0]);
              }}
            />
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
        footer={[
          <Button key="preview" onClick={handlePreviewMaterial} loading={previewLoading} type="default">预览</Button>,
          <Button key="submit" type="primary" onClick={handleBatchMaterial} loading={batchTaskLoading}>开始任务</Button>,
          <Button key="cancel" onClick={()=>setBatchModal(false)}>取消</Button>,
        ]}
      >
        <Form form={batchForm} layout="vertical">
          <Form.Item label="大模型" name="model" rules={[{required:true,message:'请选择大模型'}]}>
            <Select options={[{label:'阿里1.0',value:'ali'},]} style={{width:200}}/>
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
          <Form.Item label="封面组" name="coverGroup" rules={[{required:true,message:'请选择封面组'}]}>
            <Select
              options={mediaGroups.map((g:any)=>({label:g.title,value:g._id}))}
              style={{width:200}}
              onChange={v=>setBatchCoverGroup(v)}
            />
          </Form.Item>
          <Form.Item label="素材组" name="mediaGroups" rules={[{required:true,message:'请选择素材组'}]}>
            <Select
              mode="multiple"
              options={mediaGroups.map((g:any)=>({label:g.title,value:g._id}))}
              style={{width:300}}
              onChange={v=>setBatchMediaGroups(v)}
            />
          </Form.Item>
          <Form.Item label="生成数量" name="num" initialValue={4} rules={[{required:true}]}> 
            <InputNumber min={1} max={20}/>
          </Form.Item>
          <Form.Item label="地理位置" name="location">
            <Input value={batchLocation.join(',')} disabled />
          </Form.Item>
        </Form>
      </Modal>
      {/* 预览弹窗 */}
      <Modal
        open={previewModal}
        title="生成预览"
        onCancel={()=>setPreviewModal(false)}
        footer={null}
        width={700}
      >
        <Spin spinning={previewLoading}>
          {!previewData ? (
            <div style={{textAlign:'center',color:'#888'}}>暂无预览内容</div>
          ) : (
            <Card title={previewData.title} bordered>
              <div style={{marginBottom:8}}><b>简介：</b>{previewData.desc}</div>
              <div style={{marginBottom:8}}><b>类型：</b>{previewData.type === MaterialType.ARTICLE ? "图文" : previewData.type === MaterialType.VIDEO ? "视频" : previewData.type}</div>
              <div style={{marginBottom:8}}><b>封面：</b>
                <div style={{marginTop:4}}>
                  {previewData.coverUrl && (
                    <img
                      src={getOssUrl(previewData.coverUrl)}
                      alt="cover"
                      style={{width:'100%',maxWidth:320,height:120,objectFit:'cover',borderRadius:8,display:'block'}}
                    />
                  )}
                </div>
              </div>
              <div style={{marginBottom:8}}><b>地理位置：</b>{Array.isArray(previewData.location) ? previewData.location.join(', ') : ''}</div>
              <div><b>素材内容：</b>
                {Array.isArray(previewData.mediaList) && previewData.mediaList.length > 0 ? (
                  <Carousel dots style={{marginTop:8}}>
                    {previewData.mediaList.map((media:any,idx:number)=>(
                      <div key={idx}>
                        <img
                          src={getOssUrl(media.url)}
                          alt="素材图片"
                          style={{width:'100%',height:'320px',objectFit:'cover',borderRadius:8}}
                        />
                      </div>
                    ))}
                  </Carousel>
                ) : (
                  <div style={{color:'#888',marginTop:8}}>暂无素材内容</div>
                )}
              </div>
            </Card>
          )}
        </Spin>
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
              <b>封面：</b>
              <div style={{marginTop:4}}>
                {detailData.coverUrl && (
                  <img
                    src={getOssUrl(detailData.coverUrl)}
                    alt="cover"
                    style={{width:'100%',maxWidth:320,height:120,objectFit:'cover',borderRadius:8,display:'block'}}
                  />
                )}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <b>素材内容：</b>
              {Array.isArray(detailData.mediaList) && detailData.mediaList.length > 0 ? (
                <Carousel dots style={{marginTop:8}}>
                  {detailData.mediaList.map((media: any, idx: number) => (
                    <div key={idx}>
                      <img
                        src={getOssUrl(media.url)}
                        alt="素材图片"
                        style={{width:'100%',height:'320px',objectFit:'cover',borderRadius:8}}
                      />
                    </div>
                  ))}
                </Carousel>
              ) : (
                <div style={{color:'#888',marginTop:8}}>暂无素材内容</div>
              )}
            </div>
            <div style={{ marginBottom: 16 }}>
              <b>状态：</b>
              <span style={{ color: detailData.status === 0 ? "#faad14" : "#52c41a" }}>
                {detailData.status === 0 ? "生成中" : "已生成"}
              </span>
            </div>
          </div>
        )}
      </Modal>
      {/* 编辑组名弹窗 */}
      <Modal
        open={editGroupModal}
        title="编辑草稿箱组"
        onOk={handleEditGroup}
        onCancel={()=>setEditGroupModal(false)}
        confirmLoading={editLoading}
      >
        <Input
          placeholder="请输入新组名"
          value={editGroupName}
          onChange={e=>setEditGroupName(e.target.value)}
        />
      </Modal>
    </div>
  );
} 