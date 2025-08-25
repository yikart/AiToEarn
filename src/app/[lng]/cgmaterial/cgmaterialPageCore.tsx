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
  apiDeleteMaterialGroup,
  apiUpdateMaterialGroupInfo,
  apiPreviewMaterialTask,
  apiUpdateMaterial,
} from "@/api/material";
import { getMediaGroupList, getMediaList } from "@/api/media";
import { getOssUrl } from "@/utils/oss";
import { EditOutlined, DeleteOutlined, PlusOutlined, ImportOutlined, FileTextOutlined, FolderOpenOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { getAccountListApi } from "@/api/account";
import { getPublishList } from "@/api/plat/publish";
import { PlatType } from "@/app/config/platConfig";
import { PublishStatus } from "@/api/plat/types/publish.types";
import { useTransClient } from "@/app/i18n/client";
import { PubType } from "@/app/config/publishConfig";

const { TextArea } = Input;

export default function CgMaterialPageCore() {
  const { t } = useTransClient('cgmaterial');
  
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
  
  // 视频组专用：封面组和视频组分别选择
  const [coverGroupModal, setCoverGroupModal] = useState(false);
  const [videoGroupModal, setVideoGroupModal] = useState(false);
  const [coverGroups, setCoverGroups] = useState<any[]>([]);
  const [videoGroups, setVideoGroups] = useState<any[]>([]);
  const [selectedCoverGroup, setSelectedCoverGroup] = useState<any>(null);
  const [selectedVideoGroup, setSelectedVideoGroup] = useState<any>(null);
  const [coverList, setCoverList] = useState<any[]>([]);
  const [videoList, setVideoList] = useState<any[]>([]);
  
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

  // 编辑素材相关
  const [editMaterialModal, setEditMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [editMaterialForm] = Form.useForm();
  const [editMaterialLoading, setEditMaterialLoading] = useState(false);
  const [editMaterialMediaGroups, setEditMaterialMediaGroups] = useState<any[]>([]);
  const [editMaterialSelectedGroup, setEditMaterialSelectedGroup] = useState<any>(null);
  const [editMaterialMediaList, setEditMaterialMediaList] = useState<any[]>([]);
  const [editMaterialSelectedCover, setEditMaterialSelectedCover] = useState<string | null>(null);
  const [editMaterialSelectedMaterials, setEditMaterialSelectedMaterials] = useState<string[]>([]);
  const [editMaterialLocation, setEditMaterialLocation] = useState<[number, number]>([0, 0]);
  
  // 编辑素材：视频组专用状态
  const [editMaterialCoverGroups, setEditMaterialCoverGroups] = useState<any[]>([]);
  const [editMaterialVideoGroups, setEditMaterialVideoGroups] = useState<any[]>([]);
  const [editMaterialSelectedCoverGroup, setEditMaterialSelectedCoverGroup] = useState<any>(null);
  const [editMaterialSelectedVideoGroup, setEditMaterialSelectedVideoGroup] = useState<any>(null);
  const [editMaterialCoverList, setEditMaterialCoverList] = useState<any[]>([]);
  const [editMaterialVideoList, setEditMaterialVideoList] = useState<any[]>([]);
  
  // 编辑素材弹窗状态
  const [editMaterialCoverGroupModal, setEditMaterialCoverGroupModal] = useState(false);
  const [editMaterialVideoGroupModal, setEditMaterialVideoGroupModal] = useState(false);

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
      message.error(t('createGroup.getGroupsFailed'));
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
      message.error(t('createGroup.getMaterialsFailed'));
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
      message.success(t('createGroup.createSuccess'));
      setCreateGroupModal(false);
      createGroupForm.resetFields();
      fetchGroupList();
          } catch (e: any) {
        if (e?.errorFields) {
          message.warning(t('pleaseCompleteForm'));
        } else {
          message.error(t('createGroup.createFailed'));
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
    
    // 重置视频组专用状态
    setSelectedCoverGroup(null);
    setSelectedVideoGroup(null);
    setCoverList([]);
    setVideoList([]);
    
    // 根据草稿箱组类型过滤媒体组
    const res = await getMediaGroupList(1, 50);
    const allGroups = ((res?.data as any)?.list as any[]) || [];
    
    // 根据当前选中的草稿箱组类型过滤媒体组
    if (selectedGroup) {
      if (selectedGroup.type === PubType.ImageText) {
        // 图文组：只能选择图片组
        const filteredGroups = allGroups.filter((g: any) => g.type === 'img');
        setMediaGroups(filteredGroups);
      } else if (selectedGroup.type === PubType.VIDEO) {
        // 视频组：分别设置封面组（图片组）和视频组
        const imgGroups = allGroups.filter((g: any) => g.type === 'img');
        const videoGroups = allGroups.filter((g: any) => g.type === 'video');
        setCoverGroups(imgGroups);
        setVideoGroups(videoGroups);
        setMediaGroups([]); // 清空普通媒体组
      }
    } else {
      setMediaGroups(allGroups);
    }
    
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

  // 选择封面组后，加载封面资源
  async function handleSelectCoverGroup(group: any) {
    setSelectedCoverGroup(group);
    setCoverGroupModal(false);
    const res = await getMediaList(group._id, 1, 100);
    // @ts-ignore
    setCoverList(res?.data?.list || []);
    setSelectedCover(null);
  }

  // 选择视频组后，加载视频资源
  async function handleSelectVideoGroup(group: any) {
    setSelectedVideoGroup(group);
    setVideoGroupModal(false);
    const res = await getMediaList(group._id, 1, 100);
    // @ts-ignore
    setVideoList(res?.data?.list || []);
    setSelectedMaterials([]);
  }

  // 创建单个素材
  async function handleCreateMaterial() {
    await form.validateFields(); // 先校验
    const values = form.getFieldsValue(); // 再获取所有值
    
    // 根据草稿箱组类型进行不同的验证
    if (selectedGroup.type === PubType.ImageText) {
      // 图文组：必须有媒体组、封面和素材，且都是图片
      if (!selectedMediaGroup) {
        message.warning(t('createMaterial.selectMediaGroup'));
        return;
      }
      if (!selectedCover || selectedMaterials.length === 0) {
        message.warning(t('createMaterial.selectCoverAndMaterials'));
        return;
      }
      // 检查是否都是图片类型
      const selectedMediaItems = mediaList.filter((m: any) => 
        selectedMaterials.includes(m.url) || selectedCover === m.url
      );
      const hasVideo = selectedMediaItems.some((m: any) => m.type === 'video');
      if (hasVideo) {
        message.warning(t('createMaterial.imageGroupOnly'));
        return;
      }
    } else if (selectedGroup.type === PubType.VIDEO) {
      // 视频组：必须有封面组、视频组、封面和视频素材
      if (!selectedCoverGroup) {
        message.warning(t('createMaterial.selectCoverGroupRequired'));
        return;
      }
      if (!selectedVideoGroup) {
        message.warning(t('createMaterial.selectVideoGroupRequired'));
        return;
      }
      if (!selectedCover) {
        message.warning(t('createMaterial.selectCoverRequired'));
        return;
      }
      if (selectedMaterials.length === 0) {
        message.warning(t('createMaterial.selectVideoRequired'));
        return;
      }
      // 检查封面是否为图片
      const coverItem = coverList.find((m: any) => m.url === selectedCover);
      if (coverItem && coverItem.type !== 'img') {
        message.warning(t('createMaterial.coverMustBeImage'));
        return;
      }
      // 检查素材是否都是视频
      const selectedMediaItems = videoList.filter((m: any) => selectedMaterials.includes(m.url));
      const hasImage = selectedMediaItems.some((m: any) => m.type === 'img');
      if (hasImage) {
        message.warning(t('createMaterial.videoGroupOnly'));
        return;
      }
    }
    
    setCreating(true);
    try {
      // 根据类型使用不同的媒体列表
      const finalMediaList = selectedGroup.type === PubType.VIDEO ? videoList : mediaList;
      
      await apiCreateMaterial({
        groupId: selectedGroup._id,
        coverUrl: selectedCover || undefined,
        mediaList: finalMediaList
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
      message.success(t('createMaterial.createSuccess'));
      setCreateModal(false);
      // 重置创建素材相关状态
      setSelectedMediaGroup(null);
      setMediaList([]);
      setSelectedCover(null);
      setSelectedMaterials([]);
      setSelectedCoverGroup(null);
      setSelectedVideoGroup(null);
      setCoverList([]);
      setVideoList([]);
      setMediaGroupModal(false);
      setCoverGroupModal(false);
      setVideoGroupModal(false);
      form.resetFields();
      fetchMaterialList(selectedGroup._id);
    } catch (e) {
      message.error(t('createMaterial.createFailed'));
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

  // 打开编辑素材弹窗
  async function openEditMaterialModal(material: any) {
    setEditingMaterial(material);
    setEditMaterialModal(true);
    
    // 重置视频组专用状态
    setEditMaterialSelectedCoverGroup(null);
    setEditMaterialSelectedVideoGroup(null);
    setEditMaterialCoverList([]);
    setEditMaterialVideoList([]);
    
    // 加载媒体组
    const res = await getMediaGroupList(1, 50);
    const allGroups = ((res?.data as any)?.list as any[]) || [];
    
    // 根据草稿箱组类型过滤媒体组
    if (selectedGroup) {
      if (selectedGroup.type === PubType.ImageText) {
        // 图文组：只能选择图片组
        const filteredGroups = allGroups.filter((g: any) => g.type === 'img');
        setEditMaterialMediaGroups(filteredGroups);
      } else if (selectedGroup.type === PubType.VIDEO) {
        // 视频组：分别设置封面组（图片组）和视频组
        const imgGroups = allGroups.filter((g: any) => g.type === 'img');
        const videoGroups = allGroups.filter((g: any) => g.type === 'video');
        setEditMaterialCoverGroups(imgGroups);
        setEditMaterialVideoGroups(videoGroups);
        setEditMaterialMediaGroups([]); // 清空普通媒体组
      }
    } else {
      setEditMaterialMediaGroups(allGroups);
    }
    
    // 设置表单初始值
    editMaterialForm.setFieldsValue({
      title: material.title,
      desc: material.desc,
      location: material.location || [0, 0],
    });
    
    // 设置封面和素材
    setEditMaterialSelectedCover(material.coverUrl || null);
    setEditMaterialSelectedMaterials(material.mediaList?.map((m: any) => m.url) || []);
    setEditMaterialLocation(material.location || [0, 0]);
    
    // 获取地理位置
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setEditMaterialLocation([pos.coords.longitude, pos.coords.latitude]);
          editMaterialForm.setFieldsValue({ location: [pos.coords.longitude, pos.coords.latitude] });
        },
        () => {
          setEditMaterialLocation([0, 0]);
          editMaterialForm.setFieldsValue({ location: [0, 0] });
        }
      );
    } else {
      setEditMaterialLocation([0, 0]);
      editMaterialForm.setFieldsValue({ location: [0, 0] });
    }
  }

  // 选择编辑素材的媒体组
  async function handleEditMaterialSelectGroup(group: any) {
    setEditMaterialSelectedGroup(group);
    const res = await getMediaList(group._id, 1, 100);
    setEditMaterialMediaList(((res?.data as any)?.list as any[]) || []);
  }

  // 选择编辑素材的封面组
  async function handleEditMaterialSelectCoverGroup(group: any) {
    setEditMaterialSelectedCoverGroup(group);
    setEditMaterialCoverGroupModal(false);
    const res = await getMediaList(group._id, 1, 100);
    setEditMaterialCoverList(((res?.data as any)?.list as any[]) || []);
  }

  // 选择编辑素材的视频组
  async function handleEditMaterialSelectVideoGroup(group: any) {
    setEditMaterialSelectedVideoGroup(group);
    setEditMaterialVideoGroupModal(false);
    const res = await getMediaList(group._id, 1, 100);
    setEditMaterialVideoList(((res?.data as any)?.list as any[]) || []);
  }

  // 更新素材
  async function handleUpdateMaterial() {
    await editMaterialForm.validateFields();
    const values = editMaterialForm.getFieldsValue();
    
    // 根据草稿箱组类型进行不同的验证
    if (selectedGroup.type === PubType.ImageText) {
      // 图文组：必须有媒体组、封面和素材，且都是图片
      if (!editMaterialSelectedGroup) {
        message.warning('请选择媒体组');
        return;
      }
      if (!editMaterialSelectedCover || editMaterialSelectedMaterials.length === 0) {
        message.warning('请完整选择封面和素材');
        return;
      }
      // 检查是否都是图片类型
      const selectedMediaItems = editMaterialMediaList.filter((m: any) => 
        editMaterialSelectedMaterials.includes(m.url) || editMaterialSelectedCover === m.url
      );
      const hasVideo = selectedMediaItems.some((m: any) => m.type === 'video');
      if (hasVideo) {
        message.warning('图文组不能选择视频素材');
        return;
      }
    } else if (selectedGroup.type === PubType.VIDEO) {
      // 视频组：必须有封面组、视频组、封面和视频素材
      if (!editMaterialSelectedCoverGroup) {
        message.warning('请选择封面组（图片组）');
        return;
      }
      if (!editMaterialSelectedVideoGroup) {
        message.warning('请选择视频组');
        return;
      }
      if (!editMaterialSelectedCover) {
        message.warning('请选择封面（图片）');
        return;
      }
      if (editMaterialSelectedMaterials.length === 0) {
        message.warning('请选择视频素材');
        return;
      }
      // 检查封面是否为图片
      const coverItem = editMaterialCoverList.find((m: any) => m.url === editMaterialSelectedCover);
      if (coverItem && coverItem.type !== 'img') {
        message.warning('封面必须是图片');
        return;
      }
      // 检查素材是否都是视频
      const selectedMediaItems = editMaterialVideoList.filter((m: any) => editMaterialSelectedMaterials.includes(m.url));
      const hasImage = selectedMediaItems.some((m: any) => m.type === 'img');
      if (hasImage) {
        message.warning('视频组只能选择视频素材');
        return;
      }
    }
    
    setEditMaterialLoading(true);
    try {
      // 根据类型使用不同的媒体列表
      const finalMediaList = selectedGroup.type === PubType.VIDEO ? editMaterialVideoList : editMaterialMediaList;
      
      await apiUpdateMaterial(editingMaterial._id, {
        coverUrl: editMaterialSelectedCover || undefined,
        mediaList: finalMediaList
          .filter((m: any) => editMaterialSelectedMaterials.includes(m.url))
          .map((m: any) => ({
            url: m.url,
            type: m.type,
            content: m.content || '',
          })),
        title: values.title,
        desc: values.desc,
        location: editMaterialLocation,
        option: editingMaterial.option || {},
      });
      
      message.success('更新素材成功');
      setEditMaterialModal(false);
      setEditingMaterial(null);
      // 重置编辑素材相关状态
      setEditMaterialSelectedGroup(null);
      setEditMaterialMediaList([]);
      setEditMaterialSelectedCover(null);
      setEditMaterialSelectedMaterials([]);
      setEditMaterialSelectedCoverGroup(null);
      setEditMaterialSelectedVideoGroup(null);
      setEditMaterialCoverList([]);
      setEditMaterialVideoList([]);
      setEditMaterialCoverGroupModal(false);
      setEditMaterialVideoGroupModal(false);
      editMaterialForm.resetFields();
      fetchMaterialList(selectedGroup._id);
    } catch (e) {
      message.error('更新素材失败');
    } finally {
      setEditMaterialLoading(false);
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
        <h2>{t('header.title')}</h2>
        <div className={styles.headerActions}>
          <Button 
            className={`${styles.actionButton} ${styles.importButton}`}
            onClick={openImportModal}
            icon={<ImportOutlined />}
          >
            {t('header.importContent')}
          </Button>
          <Button 
            className={styles.actionButton}
            onClick={() => setCreateGroupModal(true)}
            icon={<PlusOutlined />}
          >
            {t('header.createGroup')}
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
                  <h3>{t('sidebar.noGroups')}</h3>
                  <p>{t('sidebar.noGroupsDesc')}</p>
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
                        <span>{item.desc || t('sidebar.noDesc')}</span>
                        <span className={styles.typeTag}>
                          {item.type === PubType.ImageText ? '图文' : item.type === PubType.VIDEO ? '视频' : item.type}
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
                          <EditOutlined /> {t('sidebar.edit')}
                        </span>
                        <span
                          className={styles.groupActionBtn}
                          onClick={e => {
                            e.stopPropagation();
                            Modal.confirm({
                              title: t('sidebar.deleteConfirm'),
                              content: t('sidebar.deleteConfirmDesc', { name: item.name || item.title }),
                              okText: t('sidebar.delete'),
                              okType: 'danger',
                              cancelText: t('batchGenerate.cancel'),
                              onOk: async () => {
                                try {
                                  await apiDeleteMaterialGroup(item._id);
                                  message.success(t('sidebar.deleteSuccess'));
                                  fetchGroupList();
                                } catch {
                                  message.error(t('sidebar.deleteFailed'));
                                }
                              },
                            });
                          }}
                        >
                          <DeleteOutlined /> {t('sidebar.delete')}
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
              {selectedGroup?.name || selectedGroup?.title || t('sidebar.selectGroup')}
            </div>
            <div className={styles.contentActions}>
              <Button 
                className={styles.actionButton}
                onClick={openCreateMaterialModal} 
                disabled={!selectedGroup}
                icon={<PlusOutlined />}
              >
                {t('content.createMaterial')}
              </Button>
              <Button 
                className={styles.actionButton}
                onClick={openBatchModal} 
                disabled={!selectedGroup}
                icon={<FileTextOutlined />}
              >
                {t('content.batchGenerate')}
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
                  <h3>{t('sidebar.selectGroup')}</h3>
                  <p>{t('sidebar.selectGroupDesc')}</p>
                </div>
              ) : materialList.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <FileTextOutlined />
                  </div>
                  <h3>{t('content.noMaterials')}</h3>
                  <p>{t('content.noMaterialsDesc')}</p>
                </div>
              ) : (
                <List
                  grid={{gutter: [16, 16], column: 3}}
                  dataSource={materialList}
                  renderItem={item => (
                    <List.Item>
                      <div className={styles.materialCard}>
                        <div
                          className={styles.cardMain}
                          onClick={() => { setDetailData(item); setDetailModal(true); }}
                        >
                          {item.coverUrl && (
                            selectedGroup?.type === PubType.VIDEO && item.mediaList?.some((m: any) => m.type === 'video') ? (
                              // <video
                              //   src={getOssUrl(item.coverUrl)}
                              //   className={styles.cardCover}
                              //   muted
                              //   loop
                              //   onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                              //   onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                              // />
                              <img
                                src={getOssUrl(item.coverUrl)}
                                alt="cover"
                                className={styles.cardCover}
                              />
                            ) : (
                              <img
                                src={getOssUrl(item.coverUrl)}
                                alt="cover"
                                className={styles.cardCover}
                              />
                            )
                          )}
                          <div className={styles.cardContent}>
                            <div className={styles.cardTitle}>{item.title}</div>
                            <div className={styles.cardDesc}>{item.desc}</div>
                            <div className={styles.cardMeta}>
                              <span className={styles.typeLabel}>
                                {item.type === PubType.ImageText ? "图文" : item.type === PubType.VIDEO ? "视频" : item.type}
                              </span>
                              <span className={`${styles.statusLabel} ${item.status === 0 ? styles.generating : styles.completed}`}>
                                {item.status === 0 ? t('content.generating') : t('content.completed')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className={styles.cardActions}>
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditMaterialModal(item);
                            }}
                            className={styles.editButton}
                          >
                            {t('content.edit')}
                          </Button>
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
        title={t('createGroup.title')}
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
            label={t('createGroup.name')} 
            name="name" 
            rules={[{ required: true, message: t('createGroup.namePlaceholder') }]}
            initialValue="DraftboxGroup"
          >
            <Input placeholder={t('createGroup.namePlaceholder')} />
          </Form.Item>
          
          <Form.Item 
            label="类型" 
            name="type" 
            rules={[{ required: true, message: '请选择草稿类型' }]}
            initialValue={PubType.ImageText}
          >
            <Select placeholder="请选择草稿类型">
              <Select.Option value={PubType.ImageText}>
                <FileTextOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                图文草稿
              </Select.Option>
              <Select.Option value={PubType.VIDEO}>
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
        onCancel={() => {
          setCreateModal(false);
          // 重置创建素材相关状态
          setSelectedMediaGroup(null);
          setMediaList([]);
          setSelectedCover(null);
          setSelectedMaterials([]);
          setSelectedCoverGroup(null);
          setSelectedVideoGroup(null);
          setCoverList([]);
          setVideoList([]);
          setMediaGroupModal(false);
          setCoverGroupModal(false);
          setVideoGroupModal(false);
          form.resetFields();
        }}
        confirmLoading={creating}
        width={700}
      >
        {/* 图文组：媒体组选择弹窗 */}
        {selectedGroup?.type === PubType.ImageText && (
          <Modal
            open={mediaGroupModal}
            title={t('createMaterial.selectCoverGroup')}
            onCancel={() => setMediaGroupModal(false)}
            footer={null}
            width={700}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#666', fontSize: 14 }}>
                {t('createMaterial.selectCoverGroupDesc')}
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
                    {/* 类型标签 */}
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '500',
                      color: '#fff',
                      background: item.type === 'img' ? '#52c41a' : 
                                 item.type === 'video' ? '#1890ff' : '#722ed1',
                      zIndex: 1
                    }}>
                      {item.type === 'img' ? t('mediaGroupType.img') : 
                       item.type === 'video' ? t('mediaGroupType.video') : t('mediaGroupType.mixed')}
                    </div>
                    {item.desc && (
                      <div style={{ 
                        fontSize: 12, 
                        color: '#7f8c8d',
                        lineHeight: 1.4,
                        marginTop: 4
                      }}>
                        {item.desc}
                      </div>
                    )}
                    {/* 资源数量 */}
                    <div style={{
                      fontSize: 11,
                      color: '#95a5a6',
                      marginTop: 4
                    }}>
                      {item.mediaList.total || 0} {t('mediaCount')}
                    </div>
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
                        fontSize: 12,
                        zIndex: 2
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                </List.Item>
              )}
            />
          </Modal>
        )}

        {/* 视频组：封面组选择弹窗 */}
        {selectedGroup?.type === PubType.VIDEO && (
          <Modal
            open={coverGroupModal}
            title="选择封面组（图片组）"
            onCancel={() => setCoverGroupModal(false)}
            footer={null}
            width={700}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#666', fontSize: 14 }}>
                选择一个图片组作为封面来源
              </div>
            </div>
            <List
              grid={{ gutter: 16, column: 2 }}
              dataSource={coverGroups}
              renderItem={item => (
                <List.Item>
                  <div
                    className={styles.mediaCard}
                    style={{
                      background: selectedCoverGroup?._id === item._id ? 
                        'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' : 
                        '#FAEFFC',
                      border: selectedCoverGroup?._id === item._id ? 
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
                    onClick={() => handleSelectCoverGroup(item)}
                    onMouseEnter={(e) => {
                      if (selectedCoverGroup?._id !== item._id) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCoverGroup?._id !== item._id) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    <div style={{ 
                      fontSize: 24, 
                      marginBottom: 8,
                      color: selectedCoverGroup?._id === item._id ? '#667eea' : '#bdc3c7'
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
                    {/* 类型标签 */}
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '500',
                      color: '#fff',
                      background: '#52c41a',
                      zIndex: 1
                    }}>
                      {t('mediaGroupType.img')}
                    </div>
                    {item.desc && (
                      <div style={{ 
                        fontSize: 12, 
                        color: '#7f8c8d',
                        lineHeight: 1.4,
                        marginTop: 4
                      }}>
                        {item.desc}
                      </div>
                    )}
                    {/* 资源数量 */}
                    <div style={{
                      fontSize: 11,
                      color: '#95a5a6',
                      marginTop: 4
                    }}>
                      {item.mediaCount || 0} {t('mediaCount')}
                    </div>
                    {selectedCoverGroup?._id === item._id && (
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
                        fontSize: 12,
                        zIndex: 2
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                </List.Item>
              )}
            />
          </Modal>
        )}

        {/* 视频组：视频组选择弹窗 */}
        {selectedGroup?.type === PubType.VIDEO && (
          <Modal
            open={videoGroupModal}
            title="选择视频组"
            onCancel={() => setVideoGroupModal(false)}
            footer={null}
            width={700}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#666', fontSize: 14 }}>
                选择一个视频组作为视频素材来源
              </div>
            </div>
            <List
              grid={{ gutter: 16, column: 2 }}
              dataSource={videoGroups}
              renderItem={item => (
                <List.Item>
                  <div
                    className={styles.mediaCard}
                    style={{
                      background: selectedVideoGroup?._id === item._id ? 
                        'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' : 
                        '#FAEFFC',
                      border: selectedVideoGroup?._id === item._id ? 
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
                    onClick={() => handleSelectVideoGroup(item)}
                    onMouseEnter={(e) => {
                      if (selectedVideoGroup?._id !== item._id) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedVideoGroup?._id !== item._id) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    <div style={{ 
                      fontSize: 24, 
                      marginBottom: 8,
                      color: selectedVideoGroup?._id === item._id ? '#667eea' : '#bdc3c7'
                    }}>
                      <VideoCameraOutlined />
                    </div>
                    <div style={{ 
                      fontWeight: 600, 
                      fontSize: 16,
                      color: '#2c3e50',
                      marginBottom: 4
                    }}>
                      {item.title}
                    </div>
                    {/* 类型标签 */}
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '500',
                      color: '#fff',
                      background: '#1890ff',
                      zIndex: 1
                    }}>
                      {t('mediaGroupType.video')}
                    </div>
                    {item.desc && (
                      <div style={{ 
                        fontSize: 12, 
                        color: '#7f8c8d',
                        lineHeight: 1.4,
                        marginTop: 4
                      }}>
                        {item.desc}
                      </div>
                    )}
                    {/* 资源数量 */}
                    <div style={{
                      fontSize: 11,
                      color: '#95a5a6',
                      marginTop: 4
                    }}>
                      {item.mediaCount || 0} {t('mediaCount')}
                    </div>
                    {selectedVideoGroup?._id === item._id && (
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
                        fontSize: 12,
                        zIndex: 2
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                </List.Item>
              )}
            />
          </Modal>
        )}

        {/* 图文组：资源选择区 */}
        {selectedGroup?.type === PubType.ImageText && selectedMediaGroup && (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>
                {t('selectCover')}
              </div>
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
              <div style={{ fontWeight: 500, marginBottom: 8 }}>
                {t('selectMaterials')}
              </div>
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

        {/* 视频组：资源选择区 */}
        {selectedGroup?.type === PubType.VIDEO && (
          <>
            {/* 封面组选择按钮 */}
            {!selectedCoverGroup && (
              <div style={{ marginBottom: 16 }}>
                <Button 
                  type="dashed" 
                  onClick={() => setCoverGroupModal(true)}
                  style={{ width: '100%', height: 60 }}
                >
                  <FolderOpenOutlined style={{ marginRight: 8 }} />
                  选择封面组（图片组）
                </Button>
              </div>
            )}

            {/* 视频组选择按钮 */}
            {!selectedVideoGroup && (
              <div style={{ marginBottom: 16 }}>
                <Button 
                  type="dashed" 
                  onClick={() => setVideoGroupModal(true)}
                  style={{ width: '100%', height: 60 }}
                >
                  <VideoCameraOutlined style={{ marginRight: 8 }} />
                  选择视频组
                </Button>
              </div>
            )}

            {/* 封面选择区 */}
            {selectedCoverGroup && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 500 }}>
                    选择封面（图片，单选）
                  </div>
                  <Button 
                    type="link" 
                    size="small"
                    onClick={() => {
                      setSelectedCoverGroup(null);
                      setCoverList([]);
                      setSelectedCover(null);
                    }}
                  >
                    重新选择封面组
                  </Button>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {coverList.map((media: any) => (
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
                        opacity: media.type !== 'img' ? 0.3 : 1,
                      }}
                      onClick={() => {
                        if (media.type !== 'img') {
                          message.warning('封面必须是图片');
                          return;
                        }
                        setSelectedCover(media.url);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 视频素材选择区 */}
            {selectedVideoGroup && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 500 }}>
                    选择视频素材（单选）
                  </div>
                  <Button 
                    type="link" 
                    size="small"
                    onClick={() => {
                      setSelectedVideoGroup(null);
                      setVideoList([]);
                      setSelectedMaterials([]);
                    }}
                  >
                    重新选择视频组
                  </Button>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {videoList.map((media: any) => (
                    media.type === 'video' ? (
                      <video
                        key={media._id}
                        src={getOssUrl(media.url)}
                        style={{
                          width: 60,
                          height: 60,
                          border: selectedMaterials.includes(media.url) ? '2px solid #1677ff' : '1px solid #eee',
                          borderRadius: 4,
                          cursor: 'pointer',
                          objectFit: 'cover',
                        }}
                        onClick={() => setSelectedMaterials([media.url])}
                        muted
                        loop
                        onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                        onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                      />
                    ) : (
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
                          opacity: 0.3,
                        }}
                        onClick={() => {
                          message.warning('视频组只能选择视频素材');
                        }}
                      />
                    )
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* 表单区 */}
        <Form form={form} layout="vertical">
          <Form.Item label={t('title')} name="title" rules={[{ required: true, message: '请输入标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('description')} name="desc">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item label={t('location')} name="location">
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
              <div style={{marginBottom:8}}><b>类型：</b>{previewData.type === PubType.ImageText ? "图文" : previewData.type === PubType.VIDEO ? "视频" : previewData.type}</div>
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
              {detailData.type === PubType.ImageText ? "图文" : detailData.type === PubType.VIDEO ? "视频" : detailData.type}
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <b>封面：</b>
              <div style={{marginTop:4}}>
                {detailData.coverUrl && (
                  
                    <img
                      src={getOssUrl(detailData.coverUrl)}
                      alt="cover"
                      style={{maxWidth:320, objectFit:'cover',borderRadius:8,display:'block'}}
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
                      {media.type === 'video' ? (
                        <video
                          src={getOssUrl(media.url)}
                          controls
                          style={{width:'100%',height:'320px',objectFit:'cover',borderRadius:8}}
                        />
                      ) : (
                        <img
                          src={getOssUrl(media.url)}
                          alt="素材图片"
                          style={{width:'100%',height:'320px',objectFit:'cover',borderRadius:8}}
                        />
                      )}
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

      {/* 编辑素材弹窗 */}
      <Modal
        open={editMaterialModal}
        title="编辑素材"
        onOk={handleUpdateMaterial}
        onCancel={() => {
          setEditMaterialModal(false);
          setEditingMaterial(null);
          editMaterialForm.resetFields();
          // 重置编辑素材相关状态
          setEditMaterialSelectedGroup(null);
          setEditMaterialMediaList([]);
          setEditMaterialSelectedCover(null);
          setEditMaterialSelectedMaterials([]);
          setEditMaterialSelectedCoverGroup(null);
          setEditMaterialSelectedVideoGroup(null);
          setEditMaterialCoverList([]);
          setEditMaterialVideoList([]);
          setEditMaterialCoverGroupModal(false);
          setEditMaterialVideoGroupModal(false);
        }}
        confirmLoading={editMaterialLoading}
        width={700}
      >
        {/* 编辑素材：封面组选择弹窗 */}
        {selectedGroup?.type === PubType.VIDEO && (
          <Modal
            open={editMaterialCoverGroupModal}
            title="选择封面组（图片组）"
            onCancel={() => setEditMaterialCoverGroupModal(false)}
            footer={null}
            width={700}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#666', fontSize: 14 }}>
                选择一个图片组作为封面来源
              </div>
            </div>
            <List
              grid={{ gutter: 16, column: 2 }}
              dataSource={editMaterialCoverGroups}
              renderItem={item => (
                <List.Item>
                  <div
                    className={styles.mediaCard}
                    style={{
                      background: editMaterialSelectedCoverGroup?._id === item._id ? 
                        'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' : 
                        '#FAEFFC',
                      border: editMaterialSelectedCoverGroup?._id === item._id ? 
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
                    onClick={() => handleEditMaterialSelectCoverGroup(item)}
                    onMouseEnter={(e) => {
                      if (editMaterialSelectedCoverGroup?._id !== item._id) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (editMaterialSelectedCoverGroup?._id !== item._id) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    <div style={{ 
                      fontSize: 24, 
                      marginBottom: 8,
                      color: editMaterialSelectedCoverGroup?._id === item._id ? '#667eea' : '#bdc3c7'
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
                    {/* 类型标签 */}
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '500',
                      color: '#fff',
                      background: '#52c41a',
                      zIndex: 1
                    }}>
                      {t('mediaGroupType.img')}
                    </div>
                    {item.desc && (
                      <div style={{ 
                        fontSize: 12, 
                        color: '#7f8c8d',
                        lineHeight: 1.4,
                        marginTop: 4
                      }}>
                        {item.desc}
                      </div>
                    )}
                    {/* 资源数量 */}
                    <div style={{
                      fontSize: 11,
                      color: '#95a5a6',
                      marginTop: 4
                    }}>
                      {item.mediaCount || 0} {t('mediaCount')}
                    </div>
                    {editMaterialSelectedCoverGroup?._id === item._id && (
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
                        fontSize: 12,
                        zIndex: 2
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                </List.Item>
              )}
            />
          </Modal>
        )}

        {/* 编辑素材：视频组选择弹窗 */}
        {selectedGroup?.type === PubType.VIDEO && (
          <Modal
            open={editMaterialVideoGroupModal}
            title="选择视频组"
            onCancel={() => setEditMaterialVideoGroupModal(false)}
            footer={null}
            width={700}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#666', fontSize: 14 }}>
                选择一个视频组作为视频素材来源
              </div>
            </div>
            <List
              grid={{ gutter: 16, column: 2 }}
              dataSource={editMaterialVideoGroups}
              renderItem={item => (
                <List.Item>
                  <div
                    className={styles.mediaCard}
                    style={{
                      background: editMaterialSelectedVideoGroup?._id === item._id ? 
                        'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' : 
                        '#FAEFFC',
                      border: editMaterialSelectedVideoGroup?._id === item._id ? 
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
                    onClick={() => handleEditMaterialSelectVideoGroup(item)}
                    onMouseEnter={(e) => {
                      if (editMaterialSelectedVideoGroup?._id !== item._id) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (editMaterialSelectedVideoGroup?._id !== item._id) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    <div style={{ 
                      fontSize: 24, 
                      marginBottom: 8,
                      color: editMaterialSelectedVideoGroup?._id === item._id ? '#667eea' : '#bdc3c7'
                    }}>
                      <VideoCameraOutlined />
                    </div>
                    <div style={{ 
                      fontWeight: 600, 
                      fontSize: 16,
                      color: '#2c3e50',
                      marginBottom: 4
                    }}>
                      {item.title}
                    </div>
                    {/* 类型标签 */}
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '500',
                      color: '#fff',
                      background: '#1890ff',
                      zIndex: 1
                    }}>
                      {t('mediaGroupType.video')}
                    </div>
                    {item.desc && (
                      <div style={{ 
                        fontSize: 12, 
                        color: '#7f8c8d',
                        lineHeight: 1.4,
                        marginTop: 4
                      }}>
                        {item.desc}
                      </div>
                    )}
                    {/* 资源数量 */}
                    <div style={{
                      fontSize: 11,
                      color: '#95a5a6',
                      marginTop: 4
                    }}>
                      {item.mediaCount || 0} {t('mediaCount')}
                    </div>
                    {editMaterialSelectedVideoGroup?._id === item._id && (
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
                        fontSize: 12,
                        zIndex: 2
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                </List.Item>
              )}
            />
          </Modal>
        )}
        {/* 图文组：媒体组选择 */}
        {selectedGroup?.type === PubType.ImageText && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>选择媒体组</div>
            <List
              grid={{ gutter: 16, column: 2 }}
              dataSource={editMaterialMediaGroups}
              renderItem={item => (
                <List.Item>
                  <div
                    className={styles.mediaCard}
                    style={{
                      background: editMaterialSelectedGroup?._id === item._id ? 
                        'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' : 
                        '#FAEFFC',
                      border: editMaterialSelectedGroup?._id === item._id ? 
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
                    onClick={() => handleEditMaterialSelectGroup(item)}
                    onMouseEnter={(e) => {
                      if (editMaterialSelectedGroup?._id !== item._id) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (editMaterialSelectedGroup?._id !== item._id) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    <div style={{ 
                      fontSize: 24, 
                      marginBottom: 8,
                      color: editMaterialSelectedGroup?._id === item._id ? '#667eea' : '#bdc3c7'
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
                    {editMaterialSelectedGroup?._id === item._id && (
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
          </div>
        )}

        {/* 图文组：资源选择区 */}
        {selectedGroup?.type === PubType.ImageText && editMaterialSelectedGroup && (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>
                选择封面（单选）
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {editMaterialMediaList.map((media: any) => (
                  <img
                    key={media._id}
                    src={getOssUrl(media.url)}
                    alt=""
                    style={{
                      width: 60,
                      height: 60,
                      border: editMaterialSelectedCover === media.url ? '2px solid #1677ff' : '1px solid #eee',
                      borderRadius: 4,
                      cursor: 'pointer',
                      objectFit: 'cover',
                    }}
                    onClick={() => setEditMaterialSelectedCover(media.url)}
                  />
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>
                选择素材（多选）
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {editMaterialMediaList.map((media: any) => (
                  <img
                    key={media._id}
                    src={getOssUrl(media.url)}
                    alt=""
                    style={{
                      width: 60,
                      height: 60,
                      border: editMaterialSelectedMaterials.includes(media.url) ? '2px solid #1677ff' : '1px solid #eee',
                      borderRadius: 4,
                      cursor: 'pointer',
                      objectFit: 'cover',
                      opacity: editMaterialSelectedCover === media.url ? 0.5 : 1,
                    }}
                    onClick={() => {
                      if (editMaterialSelectedCover === media.url) return;
                      setEditMaterialSelectedMaterials(prev =>
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

        {/* 视频组：资源选择区 */}
        {selectedGroup?.type === PubType.VIDEO && (
          <>
            {/* 封面组选择按钮 */}
            {!editMaterialSelectedCoverGroup && (
              <div style={{ marginBottom: 16 }}>
                <Button 
                  type="dashed" 
                  onClick={() => setEditMaterialCoverGroupModal(true)}
                  style={{ width: '100%', height: 60 }}
                >
                  <FolderOpenOutlined style={{ marginRight: 8 }} />
                  选择封面组（图片组）
                </Button>
              </div>
            )}

            {/* 视频组选择按钮 */}
            {!editMaterialSelectedVideoGroup && (
              <div style={{ marginBottom: 16 }}>
                <Button 
                  type="dashed" 
                  onClick={() => setEditMaterialVideoGroupModal(true)}
                  style={{ width: '100%', height: 60 }}
                >
                  <VideoCameraOutlined style={{ marginRight: 8 }} />
                  选择视频组
                </Button>
              </div>
            )}

            {/* 封面选择区 */}
            {editMaterialSelectedCoverGroup && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 500 }}>
                    选择封面（图片，单选）
                  </div>
                  <Button 
                    type="link" 
                    size="small"
                    onClick={() => {
                      setEditMaterialSelectedCoverGroup(null);
                      setEditMaterialCoverList([]);
                      setEditMaterialSelectedCover(null);
                    }}
                  >
                    重新选择封面组
                  </Button>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {editMaterialCoverList.map((media: any) => (
                    <img
                      key={media._id}
                      src={getOssUrl(media.url)}
                      alt=""
                      style={{
                        width: 60,
                        height: 60,
                        border: editMaterialSelectedCover === media.url ? '2px solid #1677ff' : '1px solid #eee',
                        borderRadius: 4,
                        cursor: 'pointer',
                        objectFit: 'cover',
                        opacity: media.type !== 'img' ? 0.3 : 1,
                      }}
                      onClick={() => {
                        if (media.type !== 'img') {
                          message.warning('封面必须是图片');
                          return;
                        }
                        setEditMaterialSelectedCover(media.url);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 视频素材选择区 */}
            {editMaterialSelectedVideoGroup && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 500 }}>
                    选择视频素材（单选）
                  </div>
                  <Button 
                    type="link" 
                    size="small"
                    onClick={() => {
                      setEditMaterialSelectedVideoGroup(null);
                      setEditMaterialVideoList([]);
                      setEditMaterialSelectedMaterials([]);
                    }}
                  >
                    重新选择视频组
                  </Button>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {editMaterialVideoList.map((media: any) => (
                    media.type === 'video' ? (
                      <video
                        key={media._id}
                        src={getOssUrl(media.url)}
                        style={{
                          width: 60,
                          height: 60,
                          border: editMaterialSelectedMaterials.includes(media.url) ? '2px solid #1677ff' : '1px solid #eee',
                          borderRadius: 4,
                          cursor: 'pointer',
                          objectFit: 'cover',
                        }}
                        onClick={() => setEditMaterialSelectedMaterials([media.url])}
                        muted
                        loop
                        onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                        onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                      />
                    ) : (
                      <img
                        key={media._id}
                        src={getOssUrl(media.url)}
                        alt=""
                        style={{
                          width: 60,
                          height: 60,
                          border: editMaterialSelectedMaterials.includes(media.url) ? '2px solid #1677ff' : '1px solid #eee',
                          borderRadius: 4,
                          cursor: 'pointer',
                          objectFit: 'cover',
                          opacity: 0.3,
                        }}
                        onClick={() => {
                          message.warning('视频组只能选择视频素材');
                        }}
                      />
                    )
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* 表单区 */}
        <Form form={editMaterialForm} layout="vertical">
          <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="简介" name="desc">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item label="地理位置" name="location">
            <Input
              value={editMaterialLocation.join(',')}
              onChange={e => {
                const val = e.target.value.split(',').map((v: string) => Number(v.trim()));
                setEditMaterialLocation([val[0] || 0, val[1] || 0]);
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 