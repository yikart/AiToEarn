'use client'

import type { EngagementPostsParams } from '@/api/types/engagement'
import { DeleteOutlined, EditOutlined, FileTextOutlined, FolderOpenOutlined, ImportOutlined, PlusOutlined, VideoCameraOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Form, Input, InputNumber, List, message, Modal, Select, Space, Spin } from 'antd'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getAccountListApi } from '@/api/account'
import { getChatModels } from '@/api/ai'
import { apiGetEngagementPosts } from '@/api/engagement'
import {
  apiCreateMaterial,
  apiCreateMaterialGroup,
  apiCreateMaterialTask,
  apiDeleteMaterialGroup,
  apiGetMaterialGroupList,
  apiGetMaterialList,
  apiPreviewMaterialTask,
  apiStartMaterialTask,
  apiUpdateMaterial,
  apiUpdateMaterialGroupInfo,
} from '@/api/material'
import { getMediaGroupList, getMediaList } from '@/api/media'
import { PublishStatus } from '@/api/plat/types/publish.types'
import { apiGetPostsRecordStatus, apiImportPostsRecord } from '@/api/statistics'
import { EngagementPostsResponse } from '@/api/types/engagement'
import { PlatType } from '@/app/config/platConfig'
import { PubType } from '@/app/config/publishConfig'
import { useTransClient } from '@/app/i18n/client'
import AvatarPlat from '@/components/AvatarPlat'
import VipContentModal from '@/components/modals/VipContentModal'
import publishDialogStyles from '@/components/PublishDialog/publishDialog.module.scss'
import { useUserStore } from '@/store/user'
import { getOssUrl } from '@/utils/oss'
import styles from './styles/cgmaterial.module.scss'

const { TextArea } = Input

export default function CgMaterialPageCore() {
  const { t } = useTransClient('cgmaterial')
  const { lng } = useParams()
  const userStore = useUserStore()

  // VIP 弹窗相关
  const [vipModalVisible, setVipModalVisible] = useState(false)

  // 草稿箱组相关
  const [groupList, setGroupList] = useState<any[]>([])
  const [groupLoading, setGroupLoading] = useState(false)
  const [createGroupModal, setCreateGroupModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)

  // 组内草稿素材相关
  const [materialList, setMaterialList] = useState<any[]>([])
  const [materialLoading, setMaterialLoading] = useState(false)

  // 创建素材弹窗相关
  const [createModal, setCreateModal] = useState(false)
  const [mediaGroupModal, setMediaGroupModal] = useState(false)
  const [mediaGroups, setMediaGroups] = useState<any[]>([])
  const [selectedMediaGroup, setSelectedMediaGroup] = useState<any>(null)
  const [mediaList, setMediaList] = useState<any[]>([])
  const [selectedCover, setSelectedCover] = useState<string | null>(null)
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])

  // 视频组专用：封面组和视频组分别选择
  const [coverGroupModal, setCoverGroupModal] = useState(false)
  const [videoGroupModal, setVideoGroupModal] = useState(false)
  const [coverGroups, setCoverGroups] = useState<any[]>([])
  const [videoGroups, setVideoGroups] = useState<any[]>([])
  const [selectedCoverGroup, setSelectedCoverGroup] = useState<any>(null)
  const [selectedVideoGroup, setSelectedVideoGroup] = useState<any>(null)
  const [coverList, setCoverList] = useState<any[]>([])
  const [videoList, setVideoList] = useState<any[]>([])

  // 单个素材位置
  const [singleLocation, setSingleLocation] = useState<[number, number]>([0, 0])

  // 创建/批量表单
  const [form] = Form.useForm()
  const [batchForm] = Form.useForm()
  const [createGroupForm] = Form.useForm()
  const [creating, setCreating] = useState(false)
  const [batchModal, setBatchModal] = useState(false)
  const [batchTaskLoading, setBatchTaskLoading] = useState(false)
  const [chatModels, setChatModels] = useState<any[]>([])
  const [chatModelsLoading, setChatModelsLoading] = useState(false)

  // 批量生成草稿相关
  const [batchMediaGroups, setBatchMediaGroups] = useState<string[]>([])
  const [batchCoverGroup, setBatchCoverGroup] = useState<string>('')
  const [batchLocation, setBatchLocation] = useState<[number, number]>([0, 0])
  // 预览相关
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [lastTaskParams, setLastTaskParams] = useState<any>(null)
  const [previewModal, setPreviewModal] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewList, setPreviewList] = useState<any[]>([])
  const [previewData, setPreviewData] = useState<any>(null)

  const [detailModal, setDetailModal] = useState(false)
  const [detailData, setDetailData] = useState<any>(null)

  // 编辑组相关
  const [editGroupModal, setEditGroupModal] = useState(false)
  const [editGroupName, setEditGroupName] = useState('')
  const [editingGroup, setEditingGroup] = useState<any>(null)
  const [editLoading, setEditLoading] = useState(false)

  // 编辑素材相关
  const [editMaterialModal, setEditMaterialModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<any>(null)
  const [editMaterialForm] = Form.useForm()
  const [editMaterialLoading, setEditMaterialLoading] = useState(false)
  const [editMaterialMediaGroups, setEditMaterialMediaGroups] = useState<any[]>([])
  const [editMaterialSelectedGroup, setEditMaterialSelectedGroup] = useState<any>(null)
  const [editMaterialMediaList, setEditMaterialMediaList] = useState<any[]>([])
  const [editMaterialSelectedCover, setEditMaterialSelectedCover] = useState<string | null>(null)
  const [editMaterialSelectedMaterials, setEditMaterialSelectedMaterials] = useState<string[]>([])
  const [editMaterialLocation, setEditMaterialLocation] = useState<[number, number]>([0, 0])

  // 编辑素材：视频组专用状态
  const [editMaterialCoverGroups, setEditMaterialCoverGroups] = useState<any[]>([])
  const [editMaterialVideoGroups, setEditMaterialVideoGroups] = useState<any[]>([])
  const [editMaterialSelectedCoverGroup, setEditMaterialSelectedCoverGroup] = useState<any>(null)
  const [editMaterialSelectedVideoGroup, setEditMaterialSelectedVideoGroup] = useState<any>(null)
  const [editMaterialCoverList, setEditMaterialCoverList] = useState<any[]>([])
  const [editMaterialVideoList, setEditMaterialVideoList] = useState<any[]>([])

  // 编辑素材弹窗状态
  const [editMaterialCoverGroupModal, setEditMaterialCoverGroupModal] = useState(false)
  const [editMaterialVideoGroupModal, setEditMaterialVideoGroupModal] = useState(false)

  // 记录显示操作按钮的组id
  const [showActionsId, setShowActionsId] = useState<string | null>(null)

  // 导入功能相关
  const [importModal, setImportModal] = useState(false)
  const [accountList, setAccountList] = useState<any[]>([])
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  const [publishList, setPublishList] = useState<any[]>([])
  const [selectedPublishItems, setSelectedPublishItems] = useState<string[]>([])
  const [importLoading, setImportLoading] = useState(false)

  // 分页相关状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    hasMore: false,
  })
  const [publishListLoading, setPublishListLoading] = useState(false)

  const renderMediaContent = (mediaList?: any[]) => {
    if (!Array.isArray(mediaList) || mediaList.length === 0) {
      return <div style={{ color: '#888', marginTop: 8 }}>{t('detail.noMaterials' as any)}</div>
    }

    const isSingle = mediaList.length === 1

    return (
      <div
        style={{
          marginTop: 8,
          display: 'grid',
          gap: 12,
          gridTemplateColumns: isSingle ? '1fr' : 'repeat(2, minmax(0, 1fr))',
        }}
      >
        {mediaList.map((media, idx) => (
          <div key={idx} style={{ width: '100%' }}>
            {media.type === 'video'
              ? (
                  <video
                    src={getOssUrl(media.url)}
                    controls
                    style={{ width: '100%', height: '320px', objectFit: 'cover', borderRadius: 8 }}
                  />
                )
              : (
                  <img
                    src={getOssUrl(media.url)}
                    alt={t('detail.materialImageAlt' as any)}
                    style={{ width: '100%', height: '320px', objectFit: 'cover', borderRadius: 8 }}
                  />
                )}
          </div>
        ))}
      </div>
    )
  }

  const getMaterialTypeLabel = (type: string | undefined) => {
    if (type === PubType.ImageText)
      return t('materialType.imageText' as any)
    if (type === PubType.VIDEO)
      return t('materialType.video' as any)
    return type || ''
  }

  const getMaterialStatusLabel = (status: number | undefined) => {
    if (status === 0)
      return t('materialStatus.generating' as any)
    if (status === 1)
      return t('materialStatus.completed' as any)
    return ''
  }

  const getImportStatusText = (status: string) => {
    const map: Record<string, string> = {
      success: t('import.status.success' as any),
      failed: t('import.status.failed' as any),
      running: t('import.status.running' as any),
      pending: t('import.status.pending' as any),
    }
    return map[status] || status
  }

  // 初始化加载草稿箱组
  useEffect(() => {
    fetchGroupList()
  }, [])

  async function fetchGroupList() {
    setGroupLoading(true)
    try {
      const res = await apiGetMaterialGroupList(1, 50)
      setGroupList(res?.data?.list || [])
      if (!selectedGroup && res?.data?.list?.length) {
        setSelectedGroup(res.data.list[0])
      }
    }
    catch (e) {
      message.error(t('createGroup.getGroupsFailed'))
    }
    finally {
      setGroupLoading(false)
    }
  }

  // 选中组后加载组内素材
  useEffect(() => {
    if (selectedGroup && selectedGroup._id) {
      fetchMaterialList(selectedGroup._id)
    }
  }, [selectedGroup])

  async function fetchMaterialList(groupId: string) {
    setMaterialLoading(true)
    try {
      const res = await apiGetMaterialList(groupId, 1, 50)
      // @ts-ignore
      setMaterialList(res?.data?.list || [])
    }
    catch (e) {
      message.error(t('createGroup.getMaterialsFailed'))
    }
    finally {
      setMaterialLoading(false)
    }
  }

  // 创建草稿箱组
  async function handleCreateGroup() {
    try {
      const values = await createGroupForm.validateFields()
      setCreating(true)
      await apiCreateMaterialGroup({
        type: values.type,
        name: values.name,
        desc: values.desc || '',
      })
      message.success(t('createGroup.createSuccess'))
      setCreateGroupModal(false)
      createGroupForm.resetFields()
      fetchGroupList()
    }
    catch (e: any) {
      if (e?.errorFields) {
        message.warning(t('pleaseCompleteForm'))
      }
      else {
        message.error(t('createGroup.createFailed'))
      }
    }
    finally {
      setCreating(false)
    }
  }

  // 打开创建素材弹窗时，先加载媒体组
  async function openCreateMaterialModal() {
    setCreateModal(true)
    setMediaGroupModal(true)
    setSelectedMediaGroup(null)
    setMediaList([])
    setSelectedCover(null)
    setSelectedMaterials([])

    // 重置视频组专用状态
    setSelectedCoverGroup(null)
    setSelectedVideoGroup(null)
    setCoverList([])
    setVideoList([])

    // 根据草稿箱组类型过滤媒体组
    const res = await getMediaGroupList(1, 50)
    const allGroups = ((res?.data as any)?.list as any[]) || []

    // 根据当前选中的草稿箱组类型过滤媒体组
    if (selectedGroup) {
      if (selectedGroup.type === PubType.ImageText) {
        // 图文组：只能选择图片组
        const filteredGroups = allGroups.filter((g: any) => g.type === 'img')
        setMediaGroups(filteredGroups)
      }
      else if (selectedGroup.type === PubType.VIDEO) {
        // 视频组：分别设置封面组（图片组）和视频组
        const imgGroups = allGroups.filter((g: any) => g.type === 'img')
        const videoGroups = allGroups.filter((g: any) => g.type === 'video')
        setCoverGroups(imgGroups)
        setVideoGroups(videoGroups)
        setMediaGroups([]) // 清空普通媒体组
      }
    }
    else {
      setMediaGroups(allGroups)
    }

    // 获取地理位置
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSingleLocation([pos.coords.longitude, pos.coords.latitude])
          form.setFieldsValue({ location: [pos.coords.longitude, pos.coords.latitude] })
        },
        () => {
          setSingleLocation([0, 0])
          form.setFieldsValue({ location: [0, 0] })
        },
      )
    }
    else {
      setSingleLocation([0, 0])
      form.setFieldsValue({ location: [0, 0] })
    }
  }

  // 选择媒体组后，加载资源
  async function handleSelectMediaGroup(group: any) {
    setSelectedMediaGroup(group)
    setMediaGroupModal(false)
    const res = await getMediaList(group._id, 1, 100)
    // @ts-ignore
    setMediaList(res?.data?.list || [])
    setSelectedCover(null)
    setSelectedMaterials([])
  }

  // 选择封面组后，加载封面资源
  async function handleSelectCoverGroup(group: any) {
    setSelectedCoverGroup(group)
    setCoverGroupModal(false)
    const res = await getMediaList(group._id, 1, 100)
    // @ts-ignore
    setCoverList(res?.data?.list || [])
    setSelectedCover(null)
  }

  // 选择视频组后，加载视频资源
  async function handleSelectVideoGroup(group: any) {
    setSelectedVideoGroup(group)
    setVideoGroupModal(false)
    const res = await getMediaList(group._id, 1, 100)
    // @ts-ignore
    setVideoList(res?.data?.list || [])
    setSelectedMaterials([])
  }

  // 创建单个素材
  async function handleCreateMaterial() {
    await form.validateFields() // 先校验
    const values = form.getFieldsValue() // 再获取所有值

    // 根据草稿箱组类型进行不同的验证
    if (selectedGroup.type === PubType.ImageText) {
      // 图文组：必须有媒体组、封面和素材，且都是图片
      if (!selectedMediaGroup) {
        message.warning(t('createMaterial.selectMediaGroup'))
        return
      }
      if (!selectedCover || selectedMaterials.length === 0) {
        message.warning(t('createMaterial.selectCoverAndMaterials'))
        return
      }
      // 检查是否都是图片类型
      const selectedMediaItems = mediaList.filter((m: any) =>
        selectedMaterials.includes(m.url) || selectedCover === m.url,
      )
      const hasVideo = selectedMediaItems.some((m: any) => m.type === 'video')
      if (hasVideo) {
        message.warning(t('createMaterial.imageGroupOnly'))
        return
      }
    }
    else if (selectedGroup.type === PubType.VIDEO) {
      // 视频组：必须有封面组、视频组、封面和视频素材
      if (!selectedCoverGroup) {
        message.warning(t('createMaterial.selectCoverGroupRequired'))
        return
      }
      if (!selectedVideoGroup) {
        message.warning(t('createMaterial.selectVideoGroupRequired'))
        return
      }
      if (!selectedCover) {
        message.warning(t('createMaterial.selectCoverRequired'))
        return
      }
      if (selectedMaterials.length === 0) {
        message.warning(t('createMaterial.selectVideoRequired'))
        return
      }
      // 检查封面是否为图片
      const coverItem = coverList.find((m: any) => m.url === selectedCover)
      if (coverItem && coverItem.type !== 'img') {
        message.warning(t('createMaterial.coverMustBeImage'))
        return
      }
      // 检查素材是否都是视频
      const selectedMediaItems = videoList.filter((m: any) => selectedMaterials.includes(m.url))
      const hasImage = selectedMediaItems.some((m: any) => m.type === 'img')
      if (hasImage) {
        message.warning(t('createMaterial.videoGroupOnly'))
        return
      }
    }

    setCreating(true)
    try {
      // 根据类型使用不同的媒体列表
      const finalMediaList = selectedGroup.type === PubType.VIDEO ? videoList : mediaList

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
      })
      message.success(t('createMaterial.createSuccess'))
      setCreateModal(false)
      // 重置创建素材相关状态
      setSelectedMediaGroup(null)
      setMediaList([])
      setSelectedCover(null)
      setSelectedMaterials([])
      setSelectedCoverGroup(null)
      setSelectedVideoGroup(null)
      setCoverList([])
      setVideoList([])
      setMediaGroupModal(false)
      setCoverGroupModal(false)
      setVideoGroupModal(false)
      form.resetFields()
      fetchMaterialList(selectedGroup._id)
    }
    catch (e) {
      message.error(t('createMaterial.createFailed'))
    }
    finally {
      setCreating(false)
    }
  }

  // 打开批量生成草稿弹窗时，拉取媒体组和定位
  async function openBatchModal() {
    setBatchModal(true)
    // 拉取媒体组
    const res = await getMediaGroupList(1, 50)
    setMediaGroups(((res?.data as any)?.list as any[]) || [])
    // 拉取聊天大模型
    try {
      setChatModelsLoading(true)
      const chatRes = await getChatModels()
      setChatModels(((chatRes?.data as any[]) || []))
    }
    catch (e) {
      // 忽略加载失败，不阻塞弹窗
      setChatModels([])
    }
    finally {
      setChatModelsLoading(false)
    }
    // 获取地理位置
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setBatchLocation([pos.coords.longitude, pos.coords.latitude])
          batchForm.setFieldsValue({ location: [pos.coords.longitude, pos.coords.latitude] })
        },
        () => {
          setBatchLocation([0, 0])
          batchForm.setFieldsValue({ location: [0, 0] })
        },
      )
    }
    else {
      setBatchLocation([0, 0])
      batchForm.setFieldsValue({ location: [0, 0] })
    }
  }

  // 生成任务参数
  function getBatchTaskParams() {
    const values = batchForm.getFieldsValue()
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
    }
  }

  // 预览批量生成草稿
  async function handlePreviewMaterial() {
    const values = await batchForm.validateFields()
    const params: any = getBatchTaskParams()
    // 判断参数是否变化
    if (!lastTaskParams || JSON.stringify(params) !== JSON.stringify(lastTaskParams)) {
      setCurrentTaskId(null)
      setLastTaskParams(params)
    }
    setPreviewLoading(true)
    let taskId = currentTaskId
    try {
      if (!taskId) {
        const res = await apiCreateMaterialTask(params)
        taskId = res?.data?._id || null
        setCurrentTaskId(taskId ?? null)
      }
      if (taskId) {
        const res = await apiPreviewMaterialTask(taskId)
        // @ts-ignore
        setPreviewData(res?.data?.data || null)
        setPreviewModal(true)
      }
      else {
        message.error(t('batchGenerate.previewFailed'))
      }
    }
    catch (e) {
      message.error(t('batchGenerate.previewFailed'))
    }
    finally {
      setPreviewLoading(false)
    }
  }

  // 批量生成草稿
  async function handleBatchMaterial() {
    const values = await batchForm.validateFields()
    const params: any = getBatchTaskParams()
    setBatchTaskLoading(true)
    try {
      let taskId = currentTaskId
      // 如果参数变化或没有taskId，重新创建
      if (!lastTaskParams || JSON.stringify(params) !== JSON.stringify(lastTaskParams)) {
        const res = await apiCreateMaterialTask(params)
        taskId = res?.data?._id || null
        setCurrentTaskId(taskId ?? null)
        setLastTaskParams(params)
      }
      if (taskId) {
        await apiStartMaterialTask(taskId)
        message.success(t('batchGenerate.taskStarted'))
        setBatchModal(false)
        batchForm.resetFields()
        fetchMaterialList(selectedGroup._id)
        setCurrentTaskId(null)
        setLastTaskParams(null)
      }
    }
    catch (e) {
      message.error(t('batchGenerate.generateFailed'))
    }
    finally {
      setBatchTaskLoading(false)
    }
  }

  // 处理编辑组
  async function handleEditGroup() {
    if (!editGroupName)
      return message.warning(t('editGroup.enterName' as any))
    setEditLoading(true)
    try {
      await apiUpdateMaterialGroupInfo(editingGroup._id, { name: editGroupName })
      message.success(t('sidebar.updateSuccess'))
      setEditGroupModal(false)
      setEditGroupName('')
      setEditingGroup(null)
      fetchGroupList()
    }
    catch {
      message.error(t('sidebar.updateFailed'))
    }
    finally {
      setEditLoading(false)
    }
  }

  // 打开编辑素材弹窗
  async function openEditMaterialModal(material: any) {
    setEditingMaterial(material)
    setEditMaterialModal(true)

    // 重置视频组专用状态
    setEditMaterialSelectedCoverGroup(null)
    setEditMaterialSelectedVideoGroup(null)
    setEditMaterialCoverList([])
    setEditMaterialVideoList([])

    // 加载媒体组
    const res = await getMediaGroupList(1, 50)
    const allGroups = ((res?.data as any)?.list as any[]) || []

    // 根据草稿箱组类型过滤媒体组
    if (selectedGroup) {
      if (selectedGroup.type === PubType.ImageText) {
        // 图文组：只能选择图片组
        const filteredGroups = allGroups.filter((g: any) => g.type === 'img')
        setEditMaterialMediaGroups(filteredGroups)
      }
      else if (selectedGroup.type === PubType.VIDEO) {
        // 视频组：分别设置封面组（图片组）和视频组
        const imgGroups = allGroups.filter((g: any) => g.type === 'img')
        const videoGroups = allGroups.filter((g: any) => g.type === 'video')
        setEditMaterialCoverGroups(imgGroups)
        setEditMaterialVideoGroups(videoGroups)
        setEditMaterialMediaGroups([]) // 清空普通媒体组
      }
    }
    else {
      setEditMaterialMediaGroups(allGroups)
    }

    // 设置表单初始值
    editMaterialForm.setFieldsValue({
      title: material.title,
      desc: material.desc,
      location: material.location || [0, 0],
    })

    // 设置封面和素材
    setEditMaterialSelectedCover(material.coverUrl || null)
    setEditMaterialSelectedMaterials(material.mediaList?.map((m: any) => m.url) || [])
    setEditMaterialLocation(material.location || [0, 0])

    // 获取地理位置
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setEditMaterialLocation([pos.coords.longitude, pos.coords.latitude])
          editMaterialForm.setFieldsValue({ location: [pos.coords.longitude, pos.coords.latitude] })
        },
        () => {
          setEditMaterialLocation([0, 0])
          editMaterialForm.setFieldsValue({ location: [0, 0] })
        },
      )
    }
    else {
      setEditMaterialLocation([0, 0])
      editMaterialForm.setFieldsValue({ location: [0, 0] })
    }
  }

  // 选择编辑素材的媒体组
  async function handleEditMaterialSelectGroup(group: any) {
    setEditMaterialSelectedGroup(group)
    const res = await getMediaList(group._id, 1, 100)
    setEditMaterialMediaList(((res?.data as any)?.list as any[]) || [])
  }

  // 选择编辑素材的封面组
  async function handleEditMaterialSelectCoverGroup(group: any) {
    setEditMaterialSelectedCoverGroup(group)
    setEditMaterialCoverGroupModal(false)
    const res = await getMediaList(group._id, 1, 100)
    setEditMaterialCoverList(((res?.data as any)?.list as any[]) || [])
  }

  // 选择编辑素材的视频组
  async function handleEditMaterialSelectVideoGroup(group: any) {
    setEditMaterialSelectedVideoGroup(group)
    setEditMaterialVideoGroupModal(false)
    const res = await getMediaList(group._id, 1, 100)
    setEditMaterialVideoList(((res?.data as any)?.list as any[]) || [])
  }

  // 更新素材
  async function handleUpdateMaterial() {
    await editMaterialForm.validateFields()
    const values = editMaterialForm.getFieldsValue()

    // 根据草稿箱组类型进行不同的验证
    if (selectedGroup.type === PubType.ImageText) {
      // 图文组：必须有媒体组、封面和素材，且都是图片
      if (!editMaterialSelectedGroup) {
        message.warning(t('createMaterial.selectMediaGroup'))
        return
      }
      if (!editMaterialSelectedCover || editMaterialSelectedMaterials.length === 0) {
        message.warning(t('createMaterial.selectCoverAndMaterials'))
        return
      }
      // 检查是否都是图片类型
      const selectedMediaItems = editMaterialMediaList.filter((m: any) =>
        editMaterialSelectedMaterials.includes(m.url) || editMaterialSelectedCover === m.url,
      )
      const hasVideo = selectedMediaItems.some((m: any) => m.type === 'video')
      if (hasVideo) {
        message.warning(t('createMaterial.imageGroupOnly'))
        return
      }
    }
    else if (selectedGroup.type === PubType.VIDEO) {
      // 视频组：必须有封面组、视频组、封面和视频素材
      if (!editMaterialSelectedCoverGroup) {
        message.warning(t('createMaterial.selectCoverGroupRequired'))
        return
      }
      if (!editMaterialSelectedVideoGroup) {
        message.warning(t('createMaterial.selectVideoGroupRequired'))
        return
      }
      if (!editMaterialSelectedCover) {
        message.warning(t('createMaterial.selectCoverRequired'))
        return
      }
      if (editMaterialSelectedMaterials.length === 0) {
        message.warning(t('createMaterial.selectVideoRequired'))
        return
      }
      // 检查封面是否为图片
      const coverItem = editMaterialCoverList.find((m: any) => m.url === editMaterialSelectedCover)
      if (coverItem && coverItem.type !== 'img') {
        message.warning(t('createMaterial.coverMustBeImage'))
        return
      }
      // 检查素材是否都是视频
      const selectedMediaItems = editMaterialVideoList.filter((m: any) => editMaterialSelectedMaterials.includes(m.url))
      const hasImage = selectedMediaItems.some((m: any) => m.type === 'img')
      if (hasImage) {
        message.warning(t('createMaterial.videoGroupOnly'))
        return
      }
    }

    setEditMaterialLoading(true)
    try {
      // 根据类型使用不同的媒体列表
      const finalMediaList = selectedGroup.type === PubType.VIDEO ? editMaterialVideoList : editMaterialMediaList

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
      })

      message.success(t('editMaterial.updateSuccess'))
      setEditMaterialModal(false)
      setEditingMaterial(null)
      // 重置编辑素材相关状态
      setEditMaterialSelectedGroup(null)
      setEditMaterialMediaList([])
      setEditMaterialSelectedCover(null)
      setEditMaterialSelectedMaterials([])
      setEditMaterialSelectedCoverGroup(null)
      setEditMaterialSelectedVideoGroup(null)
      setEditMaterialCoverList([])
      setEditMaterialVideoList([])
      setEditMaterialCoverGroupModal(false)
      setEditMaterialVideoGroupModal(false)
      editMaterialForm.resetFields()
      fetchMaterialList(selectedGroup._id)
    }
    catch (e) {
      message.error(t('editMaterial.updateFailed'))
    }
    finally {
      setEditMaterialLoading(false)
    }
  }

  // 打开导入弹窗
  async function openImportModal() {
    // 检查是否为VIP用户
    const isVip
      = userStore.userInfo?.vipInfo
        && userStore.userInfo.vipInfo.expireTime
        && new Date(userStore.userInfo.vipInfo.expireTime) > new Date()

    if (!isVip) {
      // 如果不是VIP，显示确认对话框
      Modal.confirm({
        title: t('import.vipRequired' as any),
        content: t('import.vipRequiredDesc' as any),
        okText: t('import.upgradeNow' as any),
        cancelText: t('import.cancel' as any),
        onOk: () => {
          // 打开VIP弹窗
          setVipModalVisible(true)
        },
      })
      return
    }

    // 如果是VIP，正常打开导入弹窗
    setImportModal(true)
    try {
      const res = await getAccountListApi()
      const allAccounts = res?.data || []

      // 只过滤掉离线账户
      const availableAccounts = allAccounts.filter((account: any) => {
        // 过滤掉离线账户
        if (account.status === 0) {
          return false
        }

        return true
      })

      setAccountList(availableAccounts)
    }
    catch (e) {
      message.error(t('import.getAccountsFailed' as any))
    }
  }

  // 选择账户后获取发布列表
  async function handleSelectAccount(account: any) {
    setSelectedAccount(account)
    setPublishList([])
    setPagination({
      current: 1,
      pageSize: 10,
      total: 0,
      hasMore: false,
    })
    await fetchPublishList(account, 1)
  }

  // 获取发布帖子列表（支持分页）
  async function fetchPublishList(account: any, page: number = 1) {
    if (!account)
      return

    setPublishListLoading(true)
    try {
      const params: EngagementPostsParams = {
        platform: account.type as any,
        uid: account.uid || account.id,
        page,
        pageSize: pagination.pageSize,
      }

      const res = await apiGetEngagementPosts(params)
      if (res?.data) {
        const { posts, total, hasMore } = res.data

        if (page === 1) {
          // 第一页，替换数据
          setPublishList(posts || [])
        }
        else {
          // 后续页，追加数据
          setPublishList(prev => [...prev, ...(posts || [])])
        }

        setPagination(prev => ({
          ...prev,
          current: page,
          total: total ?? prev.total,
          hasMore: hasMore ?? prev.hasMore,
        }))
      }
    }
    catch (e) {
      message.error(t('import.getPublishListFailed'))
      if (page === 1) {
        setPublishList([])
      }
    }
    finally {
      setPublishListLoading(false)
    }
  }

  // 加载更多帖子
  async function loadMorePosts() {
    if (!selectedAccount || !pagination.hasMore || publishListLoading)
      return

    const nextPage = pagination.current + 1
    await fetchPublishList(selectedAccount, nextPage)
  }

  // 导入选中的发布内容到草稿箱
  async function handleImportPublishItems() {
    if (!selectedAccount || selectedPublishItems.length === 0) {
      message.warning(t('import.selectToImport' as any))
      return
    }

    if (!selectedGroup) {
      message.warning(t('import.selectGroupFirst' as any))
      return
    }

    setImportLoading(true)
    try {
      // 构造导入记录
      const records = selectedPublishItems.map((itemId) => {
        const publishItem = publishList.find(item => item.postId === itemId)
        if (!publishItem)
          return null

        return {
          accountId: selectedAccount.id,
          platform: selectedAccount.type,
          userId: selectedAccount.userId || selectedAccount.id, // 使用账户的用户ID
          uid: selectedAccount.uid || selectedAccount.id,
          postId: publishItem.postId,
        }
      }).filter((record): record is NonNullable<typeof record> => record !== null)

      console.log('构造的导入记录:', records)
      console.log('选中的账户:', selectedAccount)

      if (records.length === 0) {
        message.warning(t('import.noValidRecords' as any))
        return
      }

      // 调用导入接口
      console.log('开始调用导入接口...')
      const res = await apiImportPostsRecord(records)
      console.log('导入接口返回结果:', res)

      if (res?.code === 0) {
        message.success(t('import.importSuccess' as any, { count: records.length }))

        setImportModal(false)
        setSelectedPublishItems([])
        setSelectedAccount(null)
        setPublishList([])
        fetchMaterialList(selectedGroup._id)
      }
      else {
        message.error(res?.message || t('import.importFailed' as any))
      }
    }
    catch (e: any) {
      console.error('导入失败详情:', e)
      message.error(t('import.importFailedWithReason' as any, { reason: e?.message || e || t('import.unknownError' as any) }))
    }
    finally {
      setImportLoading(false)
    }
  }

  // 检查导入状态
  async function checkImportStatus() {
    try {
      const res = await apiGetPostsRecordStatus()

      if (res?.code === 0 && res?.data && Array.isArray(res.data)) {
        const statusData: any[] = res.data
        const successCount = statusData.filter((item: any) => item.status === 'success').length
        const failedCount = statusData.filter((item: any) => item.status === 'failed').length
        const runningCount = statusData.filter((item: any) => item.status === 'running').length
        const pendingCount = statusData.filter((item: any) => item.status === 'pending').length

        let statusMessage = t('import.importStatus' as any)
        if (successCount > 0)
          statusMessage += `${t('import.successCount' as any, { count: successCount })} `
        if (failedCount > 0)
          statusMessage += `${t('import.failedCount' as any, { count: failedCount })} `
        if (runningCount > 0)
          statusMessage += `${t('import.runningCount' as any, { count: runningCount })} `
        if (pendingCount > 0)
          statusMessage += `${t('import.pendingCount' as any, { count: pendingCount })} `

        // 显示详细记录信息
        if (statusData.length > 0) {
          const detailInfo = statusData.map((item: any) => {
            const platformName = getPlatformName(item.platform)
            const statusText = getImportStatusText(item.status)
            return `${platformName} - ${item.title || t('import.noTitle' as any)} - ${statusText}`
          }).join('\n')

          Modal.info({
            title: t('import.importRecords' as any),
            content: (
              <div>
                <div style={{ marginBottom: 16, fontWeight: 600 }}>
                  {statusMessage}
                </div>
                <div style={{ maxHeight: 400, overflow: 'auto' }}>
                  {statusData.map((item: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: 12,
                        padding: 12,
                        border: '1px solid #f0f0f0',
                        borderRadius: 6,
                        backgroundColor: item.status === 'success'
                          ? '#f6ffed'
                          : item.status === 'failed' ? '#fff2f0' : '#f0f9ff',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600 }}>
                          {getPlatformName(item.platform)}
                          {' '}
                          -
                          {item.title || t('import.noTitle' as any)}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          color: item.status === 'success'
                            ? '#52c41a'
                            : item.status === 'failed' ? '#ff4d4f' : '#1890ff',
                          backgroundColor: item.status === 'success'
                            ? '#f6ffed'
                            : item.status === 'failed' ? '#fff2f0' : '#f0f9ff',
                        }}
                        >
                          {getImportStatusText(item.status)}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                        <div>
                          {t('import.publishTime' as any)}
                          :
                          {' '}
                          {new Date(item.publishTime).toLocaleString()}
                        </div>
                        <div>
                          {t('import.mediaType' as any)}
                          :
                          {' '}
                          {item.mediaType === 'image' ? t('import.image' as any) : item.mediaType === 'video' ? t('import.video' as any) : t('import.article' as any)}
                        </div>
                        {item.desc && (
                          <div>
                            {t('import.desc' as any)}
                            :
                            {' '}
                            {item.desc}
                          </div>
                        )}
                        <div>
                          {t('import.interactionData' as any)}
                          :
                          {' '}
                          {t('import.views' as any)}
                          {' '}
                          {item.viewCount}
                          {' '}
                          |
                          {' '}
                          {t('import.likes' as any)}
                          {' '}
                          {item.likeCount}
                          {' '}
                          |
                          {' '}
                          {t('import.comments' as any)}
                          {' '}
                          {item.commentCount}
                          {' '}
                          |
                          {' '}
                          {t('import.shares' as any)}
                          {' '}
                          {item.shareCount}
                        </div>
                      </div>
                      {item.cover && (
                        <div style={{ marginTop: 8 }}>
                          <img
                            src={item.cover}
                            alt={t('import.cover' as any)}
                            style={{
                              width: 60,
                              height: 60,
                              objectFit: 'cover',
                              borderRadius: 4,
                              border: '1px solid #f0f0f0',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ),
            width: 800,
            okText: t('import.close' as any),
          })
        }
        else {
          message.info(t('import.noRecords' as any))
        }
      }
    }
    catch (e) {
      console.error('查询导入状态失败:', e)
      message.error(t('import.checkStatusFailed' as any))
    }
  }

  // 组列表项事件：PC端长按，移动端左滑
  function handleGroupItemEvents(item: any) {
    let timer: any = null
    let startX = 0
    let moved = false
    return {
      onPointerDown: (e: any) => {
        if (e.pointerType === 'touch') {
          startX = e.clientX
          moved = false
          const move = (ev: any) => {
            if (Math.abs(ev.clientX - startX) > 40) {
              setShowActionsId(item._id)
              moved = true
              window.removeEventListener('pointermove', move)
            }
          }
          window.addEventListener('pointermove', move)
          const up = () => {
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', up)
            if (!moved)
              setTimeout(() => setShowActionsId(null), 2000)
          }
          window.addEventListener('pointerup', up)
        }
        else {
          timer = setTimeout(() => {
            setShowActionsId(item._id)
          }, 700)
          const up = () => {
            clearTimeout(timer)
            window.removeEventListener('pointerup', up)
            setTimeout(() => setShowActionsId(null), 2000)
          }
          window.addEventListener('pointerup', up)
        }
      },
      onMouseLeave: () => {
        setTimeout(() => setShowActionsId(null), 500)
      },
      onMouseEnter: () => {
        setShowActionsId(item._id)
      },
    }
  }

  // 获取平台显示名称
  function getPlatformName(type: string) {
    if (lng === 'en') {
      return type
    }

    // 中文显示名称
    const platformNames: Record<string, string> = {
      tiktok: 'TikTok',
      youtube: 'YouTube',
      twitter: 'Twitter',
      bilibili: '哔哩哔哩',
      KWAI: '快手',
      douyin: '抖音',
      xhs: '小红书',
      wxSph: '微信视频号',
      wxGzh: '微信公众号',
      facebook: 'Facebook',
      instagram: 'Instagram',
      threads: 'Threads',
    }
    return platformNames[type] || type
  }

  // 处理离线账户头像点击
  function handleOfflineAvatarClick(account: any) {
    // 根据平台类型跳转到对应的授权页面
    const authUrls: Record<string, string> = {
      tiktok: '/accounts/plat/TikTokLogin',
      youtube: '/accounts/plat/YouTubeLogin',
      twitter: '/accounts/plat/TwitterLogin',
      bilibili: '/accounts/plat/BilibiliLogin',
      KWAI: '/accounts/plat/KwaiLogin',
      douyin: '/accounts/plat/DouyinLogin',
      xhs: '/accounts/plat/XhsLogin',
      wxSph: '/accounts/plat/WxSphLogin',
      wxGzh: '/accounts/plat/WxGzhLogin',
      facebook: '/accounts/plat/FacebookLogin',
      instagram: '/accounts/plat/InstagramLogin',
      threads: '/accounts/plat/ThreadsLogin',
    }

    const authUrl = authUrls[account.type]
    if (authUrl) {
      window.open(authUrl, '_blank')
    }
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
              {groupList.length === 0
                ? (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>
                        <FolderOpenOutlined />
                      </div>
                      <h3>{t('sidebar.noGroups')}</h3>
                      <p>{t('sidebar.noGroupsDesc')}</p>
                    </div>
                  )
                : (
                    <List
                      dataSource={groupList as any[]}
                      renderItem={(item: any) => (
                        <List.Item
                          className={styles.groupItem + (selectedGroup?._id === item._id ? ` ${styles.selected}` : '') + (showActionsId === item._id ? ` ${styles.showActions}` : '')}
                          onClick={() => setSelectedGroup(item as any)}
                          {...handleGroupItemEvents(item)}
                        >
                          <div className={styles.groupName} style={{ marginTop: 10, paddingLeft: 10 }}>{item.name || item.title}</div>
                          <div className={styles.descTypeInfo} style={{ marginBottom: 10, paddingLeft: 10, paddingRight: 10 }}>
                            <span>{item.desc || t('sidebar.noDesc')}</span>
                            <span className={styles.typeTag}>
                              {getMaterialTypeLabel(item.type)}
                            </span>
                          </div>
                          <div className={styles.groupActions}>
                            <span
                              className={styles.groupActionBtn}
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingGroup(item)
                                setEditGroupName(item.name || item.title || '')
                                setEditGroupModal(true)
                              }}
                            >
                              <EditOutlined />
                              {' '}
                              {t('sidebar.edit')}
                            </span>
                            <span
                              className={styles.groupActionBtn}
                              onClick={(e) => {
                                e.stopPropagation()
                                Modal.confirm({
                                  title: t('sidebar.deleteConfirm'),
                                  content: t('sidebar.deleteConfirmDesc', { name: item.name || item.title }),
                                  okText: t('sidebar.delete'),
                                  okType: 'danger',
                                  cancelText: t('batchGenerate.cancel'),
                                  onOk: async () => {
                                    try {
                                      await apiDeleteMaterialGroup(item._id)
                                      message.success(t('sidebar.deleteSuccess'))
                                      fetchGroupList()
                                    }
                                    catch {
                                      message.error(t('sidebar.deleteFailed'))
                                    }
                                  },
                                })
                              }}
                            >
                              <DeleteOutlined />
                              {' '}
                              {t('sidebar.delete')}
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
                  grid={{ gutter: [16, 16], column: 3 }}
                  dataSource={materialList}
                  renderItem={item => (
                    <List.Item>
                      <div className={styles.materialCard}>
                        <div
                          className={styles.cardMain}
                          onClick={() => { setDetailData(item); setDetailModal(true) }}
                        >
                          { (item.coverUrl || item.mediaList.length > 0) && (
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
                                src={getOssUrl(item.coverUrl || item.mediaList[0].url)}
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
                                {getMaterialTypeLabel(item.type)}
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
                              e.stopPropagation()
                              openEditMaterialModal(item)
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
          setCreateGroupModal(false)
          createGroupForm.resetFields()
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
            label={t('createGroup.type')}
            name="type"
            rules={[{ required: true, message: t('createGroup.typePlaceholder') }]}
            initialValue={PubType.ImageText}
          >
            <Select placeholder={t('createGroup.typePlaceholder')}>
              <Select.Option value={PubType.ImageText}>
                <FileTextOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                {t('createGroup.imageText')}
              </Select.Option>
              <Select.Option value={PubType.VIDEO}>
                <VideoCameraOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                {t('createGroup.video')}
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label={t('createGroup.desc')} name="desc">
            <TextArea
              rows={3}
              placeholder={t('createGroup.descPlaceholder')}
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 导入发布内容弹窗 */}
      <Modal
        open={importModal}
        title={t('import.title')}
        onOk={handleImportPublishItems}
        onCancel={() => {
          setImportModal(false)
          setSelectedAccount(null)
          setPublishList([])
          setSelectedPublishItems([])
        }}
        confirmLoading={importLoading}
        width={800}
        footer={[
          (
            <Button
              key="check-progress"
              onClick={() => checkImportStatus()}
              // disabled={selectedPublishItems.length === 0}
            >
              {t('import.checkProgress' as any)}
            </Button>
          ),
          (
            <Button
              key="cancel"
              onClick={() => {
                setImportModal(false)
                setSelectedAccount(null)
                setPublishList([])
                setSelectedPublishItems([])
              }}
            >
              {t('batchGenerate.cancel')}
            </Button>
          ),
          (
            <Button
              key="submit"
              type="primary"
              onClick={handleImportPublishItems}
              loading={importLoading}
              disabled={selectedPublishItems.length === 0}
            >
              {t('import.importSelected')}
            </Button>
          ),
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>{t('import.selectAccount')}</div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            maxHeight: 200,
            overflow: 'auto',
            padding: '8px',
          }}
          >
            {accountList.map((account) => {
              const isChoosed = selectedAccount?.id === account.id

              return (
                <div
                  key={account.id}
                  className={[
                    publishDialogStyles['publishDialog-con-acconts-item'],
                    isChoosed
                      ? publishDialogStyles['publishDialog-con-acconts-item--active']
                      : '',
                  ].join(' ')}
                  style={{
                    borderColor: isChoosed
                      ? '#1677ff'
                      : 'transparent',
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelectAccount(account)
                  }}
                >
                  <AvatarPlat
                    className={`${publishDialogStyles['publishDialog-con-acconts-item-avatar']} ${!isChoosed ? publishDialogStyles.disabled : ''}`}
                    account={account}
                    size="large"
                    disabled={!isChoosed}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {selectedAccount && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                {t('import.publishContent' as any, { nickname: selectedAccount.nickname })}
              </span>
              <span style={{ fontSize: 12, color: '#666' }}>
                {t('import.loadedCount' as any, { total: pagination.total, loaded: publishList.length })}
              </span>
            </div>
            <Spin spinning={publishListLoading}>
              <List
                bordered
                style={{ maxHeight: 300, overflow: 'auto' }}
                dataSource={publishList}
                renderItem={item => (
                  <List.Item
                    style={{
                      cursor: 'pointer',
                      background: selectedPublishItems.includes(item.postId) ? '#e6f4ff' : '#fff',
                      padding: '12px 16px',
                    }}
                    onClick={() => {
                      setSelectedPublishItems(prev =>
                        prev.includes(item.postId)
                          ? prev.filter(id => id !== item.postId)
                          : [...prev, item.postId],
                      )
                    }}
                  >
                    <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                      {item.thumbnail && (
                        <img
                          src={item.thumbnail}
                          alt="cover"
                          style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                          {item.content?.substring(0, 100)}
                          {item.content?.length > 100 ? '...' : ''}
                        </div>
                        <div style={{ fontSize: 12, color: '#999', display: 'flex', gap: 8 }}>
                          <span>{new Date(item.publishTime).toLocaleDateString()}</span>
                          <span>
                            •
                            {item.mediaType === 'image' ? t('import.image' as any) : item.mediaType === 'video' ? t('import.video' as any) : t('import.article' as any)}
                          </span>
                          <span>
                            •
                            {item.viewCount}
                            {' '}
                            {t('import.views' as any)}
                          </span>
                          <span>
                            •
                            {item.likeCount}
                            {' '}
                            {t('import.likes' as any)}
                          </span>
                          <span>
                            •
                            {item.commentCount}
                            {' '}
                            {t('import.comments' as any)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Spin>

            {/* 加载更多按钮 */}
            {pagination.hasMore && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Button
                  type="link"
                  loading={publishListLoading}
                  onClick={loadMorePosts}
                >
                  {t('import.loadMore' as any, { count: pagination.total - publishList.length })}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 创建素材弹窗 */}
      <Modal
        open={createModal}
        title={t('createMaterial.title')}
        onOk={handleCreateMaterial}
        onCancel={() => {
          setCreateModal(false)
          // 重置创建素材相关状态
          setSelectedMediaGroup(null)
          setMediaList([])
          setSelectedCover(null)
          setSelectedMaterials([])
          setSelectedCoverGroup(null)
          setSelectedVideoGroup(null)
          setCoverList([])
          setVideoList([])
          setMediaGroupModal(false)
          setCoverGroupModal(false)
          setVideoGroupModal(false)
          form.resetFields()
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
                      background: selectedMediaGroup?._id === item._id
                        ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                        : '#FAEFFC',
                      border: selectedMediaGroup?._id === item._id
                        ? '2px solid #667eea'
                        : '2px solid transparent',
                      padding: '20px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      minHeight: '100px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                    onClick={() => handleSelectMediaGroup(item)}
                    onMouseEnter={(e) => {
                      if (selectedMediaGroup?._id !== item._id) {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedMediaGroup?._id !== item._id) {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }
                    }}
                  >
                    <div style={{
                      fontSize: 24,
                      marginBottom: 8,
                      color: selectedMediaGroup?._id === item._id ? '#667eea' : '#bdc3c7',
                    }}
                    >
                      <FolderOpenOutlined />
                    </div>
                    <div style={{
                      fontWeight: 600,
                      fontSize: 16,
                      color: '#2c3e50',
                      marginBottom: 4,
                    }}
                    >
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
                      background: item.type === 'img'
                        ? '#52c41a'
                        : item.type === 'video' ? '#1890ff' : '#722ed1',
                      zIndex: 1,
                    }}
                    >
                      {item.type === 'img'
                        ? t('mediaGroupType.img')
                        : item.type === 'video' ? t('mediaGroupType.video') : t('mediaGroupType.mixed')}
                    </div>
                    {item.desc && (
                      <div style={{
                        fontSize: 12,
                        color: '#7f8c8d',
                        lineHeight: 1.4,
                        marginTop: 4,
                      }}
                      >
                        {item.desc}
                      </div>
                    )}
                    {/* 资源数量 */}
                    <div style={{
                      fontSize: 11,
                      color: '#95a5a6',
                      marginTop: 4,
                    }}
                    >
                      {item.mediaList.total || 0}
                      {' '}
                      {t('mediaCount')}
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
                        zIndex: 2,
                      }}
                      >
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
            title={t('createMaterial.selectCoverGroup')}
            onCancel={() => setCoverGroupModal(false)}
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
              dataSource={coverGroups}
              renderItem={item => (
                <List.Item>
                  <div
                    className={styles.mediaCard}
                    style={{
                      background: selectedCoverGroup?._id === item._id
                        ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                        : '#FAEFFC',
                      border: selectedCoverGroup?._id === item._id
                        ? '2px solid #667eea'
                        : '2px solid transparent',
                      padding: '20px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      minHeight: '100px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                    onClick={() => handleSelectCoverGroup(item)}
                    onMouseEnter={(e) => {
                      if (selectedCoverGroup?._id !== item._id) {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCoverGroup?._id !== item._id) {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }
                    }}
                  >
                    <div style={{
                      fontSize: 24,
                      marginBottom: 8,
                      color: selectedCoverGroup?._id === item._id ? '#667eea' : '#bdc3c7',
                    }}
                    >
                      <FolderOpenOutlined />
                    </div>
                    <div style={{
                      fontWeight: 600,
                      fontSize: 16,
                      color: '#2c3e50',
                      marginBottom: 4,
                    }}
                    >
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
                      zIndex: 1,
                    }}
                    >
                      {t('mediaGroupType.img')}
                    </div>
                    {item.desc && (
                      <div style={{
                        fontSize: 12,
                        color: '#7f8c8d',
                        lineHeight: 1.4,
                        marginTop: 4,
                      }}
                      >
                        {item.desc}
                      </div>
                    )}
                    {/* 资源数量 */}
                    <div style={{
                      fontSize: 11,
                      color: '#95a5a6',
                      marginTop: 4,
                    }}
                    >
                      {item.mediaCount || 0}
                      {' '}
                      {t('mediaCount')}
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
                        zIndex: 2,
                      }}
                      >
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
            title={t('createMaterial.selectVideoGroup')}
            onCancel={() => setVideoGroupModal(false)}
            footer={null}
            width={700}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#666', fontSize: 14 }}>
                {t('createMaterial.selectVideoGroupDesc')}
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
                      background: selectedVideoGroup?._id === item._id
                        ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                        : '#FAEFFC',
                      border: selectedVideoGroup?._id === item._id
                        ? '2px solid #667eea'
                        : '2px solid transparent',
                      padding: '20px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      minHeight: '100px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                    onClick={() => handleSelectVideoGroup(item)}
                    onMouseEnter={(e) => {
                      if (selectedVideoGroup?._id !== item._id) {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedVideoGroup?._id !== item._id) {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }
                    }}
                  >
                    <div style={{
                      fontSize: 24,
                      marginBottom: 8,
                      color: selectedVideoGroup?._id === item._id ? '#667eea' : '#bdc3c7',
                    }}
                    >
                      <VideoCameraOutlined />
                    </div>
                    <div style={{
                      fontWeight: 600,
                      fontSize: 16,
                      color: '#2c3e50',
                      marginBottom: 4,
                    }}
                    >
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
                      zIndex: 1,
                    }}
                    >
                      {t('mediaGroupType.video')}
                    </div>
                    {item.desc && (
                      <div style={{
                        fontSize: 12,
                        color: '#7f8c8d',
                        lineHeight: 1.4,
                        marginTop: 4,
                      }}
                      >
                        {item.desc}
                      </div>
                    )}
                    {/* 资源数量 */}
                    <div style={{
                      fontSize: 11,
                      color: '#95a5a6',
                      marginTop: 4,
                    }}
                    >
                      {item.mediaCount || 0}
                      {' '}
                      {t('mediaCount')}
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
                        zIndex: 2,
                      }}
                      >
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
                      if (selectedCover === media.url)
                        return
                      setSelectedMaterials(prev =>
                        prev.includes(media.url)
                          ? prev.filter(url => url !== media.url)
                          : [...prev, media.url],
                      )
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
                  {t('createMaterial.selectCoverGroup')}
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
                  {t('createMaterial.selectVideoGroup')}
                </Button>
              </div>
            )}

            {/* 封面选择区 */}
            {selectedCoverGroup && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 500 }}>
                    {t('createMaterial.selectCover')}
                  </div>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      setSelectedCoverGroup(null)
                      setCoverList([])
                      setSelectedCover(null)
                    }}
                  >
                    {t('createMaterial.reselectCoverGroup')}
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
                          message.warning(t('createMaterial.coverMustBeImage'))
                          return
                        }
                        setSelectedCover(media.url)
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
                    {t('createMaterial.selectVideo')}
                  </div>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      setSelectedVideoGroup(null)
                      setVideoList([])
                      setSelectedMaterials([])
                    }}
                  >
                    {t('createMaterial.reselectVideoGroup')}
                  </Button>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {videoList.map((media: any) => (
                    media.type === 'video'
                      ? (
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
                            onMouseEnter={e => (e.target as HTMLVideoElement).play()}
                            onMouseLeave={e => (e.target as HTMLVideoElement).pause()}
                          />
                        )
                      : (
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
                              message.warning(t('createMaterial.videoGroupOnly'))
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
          <Form.Item label={t('fields.title' as any)} name="title" rules={[{ required: true, message: t('validation.enterTitle' as any) }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('fields.description' as any)} name="desc">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item label={t('fields.location' as any)} name="location">
            <Input
              value={singleLocation.join(',')}
              onChange={(e) => {
                const val = e.target.value.split(',').map((v: string) => Number(v.trim()))
                setSingleLocation([val[0] || 0, val[1] || 0])
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
      {/* 批量生成草稿弹窗 */}
      <Modal
        open={batchModal}
        title={t('batchGenerate.title')}
        onOk={handleBatchMaterial}
        onCancel={() => setBatchModal(false)}
        confirmLoading={batchTaskLoading}
        footer={[
          <Button key="preview" onClick={handlePreviewMaterial} loading={previewLoading} type="default">{t('batchGenerate.preview')}</Button>,
          <Button key="submit" type="primary" onClick={handleBatchMaterial} loading={batchTaskLoading}>{t('batchGenerate.startTask')}</Button>,
          <Button key="cancel" onClick={() => setBatchModal(false)}>{t('batchGenerate.cancel')}</Button>,
        ]}
      >
        <Form form={batchForm} layout="vertical">
          <Form.Item label={t('batchGenerate.model')} name="model" rules={[{ required: true, message: t('batchGenerate.modelPlaceholder') }]}>
            <Select
              style={{ width: 200 }}
              loading={chatModelsLoading}
              options={chatModels.map((m: any) => ({ label: m?.description || m?.name, value: m?.name }))}
              placeholder={t('batchGenerate.modelPlaceholder')}
            />
          </Form.Item>
          <Form.Item label={t('batchGenerate.prompt')} name="prompt">
            <Input placeholder={t('batchGenerate.promptPlaceholder')} />
          </Form.Item>
          <Form.Item label={t('fields.title' as any)} name="title">
            <Input placeholder={t('batchGenerate.titlePlaceholder')} />
          </Form.Item>
          <Form.Item label={t('fields.description' as any)} name="desc">
            <TextArea rows={3} placeholder={t('batchGenerate.descPlaceholder')} />
          </Form.Item>
          <Form.Item label={t('batchGenerate.coverGroup')} name="coverGroup" rules={[{ required: true, message: t('batchGenerate.coverGroupPlaceholder') }]}>
            <Select
              options={mediaGroups.map((g: any) => ({ label: g.title, value: g._id }))}
              style={{ width: 200 }}
              onChange={v => setBatchCoverGroup(v)}
            />
          </Form.Item>
          <Form.Item label={t('batchGenerate.mediaGroups')} name="mediaGroups" rules={[{ required: true, message: t('batchGenerate.mediaGroupsPlaceholder') }]}>
            <Select
              mode="multiple"
              options={mediaGroups.map((g: any) => ({ label: g.title, value: g._id }))}
              style={{ width: 300 }}
              onChange={v => setBatchMediaGroups(v)}
            />
          </Form.Item>
          <Form.Item label={t('batchGenerate.num')} name="num" initialValue={4} rules={[{ required: true }]}>
            <InputNumber min={1} max={20} />
          </Form.Item>
          {/* <Form.Item label="地理位置" name="location">
            <Input value={batchLocation.join(',')} disabled />
          </Form.Item> */}
        </Form>
      </Modal>
      {/* 预览弹窗 */}
      <Modal
        open={previewModal}
        title={t('previewModal.title' as any)}
        onCancel={() => setPreviewModal(false)}
        footer={null}
        width={700}
      >
        <Spin spinning={previewLoading}>
          {!previewData
            ? (
                <div style={{ textAlign: 'center', color: '#888' }}>{t('batchGenerate.noPreview')}</div>
              )
            : (
                <Card title={previewData.title} bordered>
                  <div style={{ marginBottom: 8 }}>
                    <b>{t('detail.descLabel' as any)}</b>
                    {previewData.desc}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <b>{t('detail.typeLabel' as any)}</b>
                    {getMaterialTypeLabel(previewData.type)}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <b>{t('detail.coverLabel' as any)}</b>
                    <div style={{ marginTop: 4 }}>
                      {previewData.coverUrl && (
                        <img
                          src={getOssUrl(previewData.coverUrl)}
                          alt="cover"
                          style={{ width: '100%', maxWidth: 320, height: 120, objectFit: 'cover', borderRadius: 8, display: 'block' }}
                        />
                      )}
                    </div>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <b>{t('fields.location' as any)}</b>
                    {Array.isArray(previewData.location) ? previewData.location.join(', ') : ''}
                  </div>
                  <div>
                    <b>{t('detail.materialsLabel' as any)}</b>
                    {renderMediaContent(previewData.mediaList)}
                  </div>
                </Card>
              )}
        </Spin>
      </Modal>
      {/* 详情弹窗 */}
      <Modal
        open={detailModal}
        title={t('detail.title')}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={600}
      >
        {detailData && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <b>{t('detail.titleLabel' as any)}</b>
              {detailData.title}
            </div>
            <div style={{ marginBottom: 16 }}>
              <b>{t('detail.descLabel' as any)}</b>
              {detailData.desc}
            </div>
            <div style={{ marginBottom: 16 }}>
              <b>{t('detail.typeLabel' as any)}</b>
              {getMaterialTypeLabel(detailData.type)}
            </div>

            <div style={{ marginBottom: 16 }}>
              <b>{t('detail.coverLabel' as any)}</b>
              <div style={{ marginTop: 4 }}>
                {detailData.coverUrl && (

                  <img
                    src={getOssUrl(detailData.coverUrl)}
                    alt="cover"
                    style={{ maxWidth: 320, objectFit: 'cover', borderRadius: 8, display: 'block' }}
                  />

                )}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <b>{t('detail.materialsLabel' as any)}</b>
              {renderMediaContent(detailData.mediaList)}
            </div>
            <div style={{ marginBottom: 16 }}>
              <b>{t('detail.statusLabel' as any)}</b>
              <span style={{ color: detailData.status === 0 ? '#faad14' : '#52c41a' }}>
                {getMaterialStatusLabel(detailData.status)}
              </span>
            </div>
          </div>
        )}
      </Modal>
      {/* 编辑组名弹窗 */}
      <Modal
        open={editGroupModal}
        title={t('editGroup.title')}
        onOk={handleEditGroup}
        onCancel={() => setEditGroupModal(false)}
        confirmLoading={editLoading}
      >
        <Input
          placeholder={t('editGroup.namePlaceholder')}
          value={editGroupName}
          onChange={e => setEditGroupName(e.target.value)}
        />
      </Modal>

      {/* 编辑素材弹窗 */}
      <Modal
        open={editMaterialModal}
        title={t('editMaterial.title')}
        onOk={handleUpdateMaterial}
        onCancel={() => {
          setEditMaterialModal(false)
          setEditingMaterial(null)
          editMaterialForm.resetFields()
          // 重置编辑素材相关状态
          setEditMaterialSelectedGroup(null)
          setEditMaterialMediaList([])
          setEditMaterialSelectedCover(null)
          setEditMaterialSelectedMaterials([])
          setEditMaterialSelectedCoverGroup(null)
          setEditMaterialSelectedVideoGroup(null)
          setEditMaterialCoverList([])
          setEditMaterialVideoList([])
          setEditMaterialCoverGroupModal(false)
          setEditMaterialVideoGroupModal(false)
        }}
        confirmLoading={editMaterialLoading}
        width={700}
      >
        {/* 编辑素材：封面组选择弹窗 */}
        {selectedGroup?.type === PubType.VIDEO && (
          <Modal
            open={editMaterialCoverGroupModal}
            title={t('createMaterial.selectCoverGroup')}
            onCancel={() => setEditMaterialCoverGroupModal(false)}
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
              dataSource={editMaterialCoverGroups}
              renderItem={item => (
                <List.Item>
                  <div
                    className={styles.mediaCard}
                    style={{
                      background: editMaterialSelectedCoverGroup?._id === item._id
                        ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                        : '#FAEFFC',
                      border: editMaterialSelectedCoverGroup?._id === item._id
                        ? '2px solid #667eea'
                        : '2px solid transparent',
                      padding: '20px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      minHeight: '100px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                    onClick={() => handleEditMaterialSelectCoverGroup(item)}
                    onMouseEnter={(e) => {
                      if (editMaterialSelectedCoverGroup?._id !== item._id) {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (editMaterialSelectedCoverGroup?._id !== item._id) {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }
                    }}
                  >
                    <div style={{
                      fontSize: 24,
                      marginBottom: 8,
                      color: editMaterialSelectedCoverGroup?._id === item._id ? '#667eea' : '#bdc3c7',
                    }}
                    >
                      <FolderOpenOutlined />
                    </div>
                    <div style={{
                      fontWeight: 600,
                      fontSize: 16,
                      color: '#2c3e50',
                      marginBottom: 4,
                    }}
                    >
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
                      zIndex: 1,
                    }}
                    >
                      {t('mediaGroupType.img')}
                    </div>
                    {item.desc && (
                      <div style={{
                        fontSize: 12,
                        color: '#7f8c8d',
                        lineHeight: 1.4,
                        marginTop: 4,
                      }}
                      >
                        {item.desc}
                      </div>
                    )}
                    {/* 资源数量 */}
                    <div style={{
                      fontSize: 11,
                      color: '#95a5a6',
                      marginTop: 4,
                    }}
                    >
                      {item.mediaCount || 0}
                      {' '}
                      {t('mediaCount')}
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
                        zIndex: 2,
                      }}
                      >
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
            title={t('createMaterial.selectVideoGroup')}
            onCancel={() => setEditMaterialVideoGroupModal(false)}
            footer={null}
            width={700}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#666', fontSize: 14 }}>
                {t('createMaterial.selectVideoGroupDesc')}
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
                      background: editMaterialSelectedVideoGroup?._id === item._id
                        ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                        : '#FAEFFC',
                      border: editMaterialSelectedVideoGroup?._id === item._id
                        ? '2px solid #667eea'
                        : '2px solid transparent',
                      padding: '20px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      minHeight: '100px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                    onClick={() => handleEditMaterialSelectVideoGroup(item)}
                    onMouseEnter={(e) => {
                      if (editMaterialSelectedVideoGroup?._id !== item._id) {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (editMaterialSelectedVideoGroup?._id !== item._id) {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }
                    }}
                  >
                    <div style={{
                      fontSize: 24,
                      marginBottom: 8,
                      color: editMaterialSelectedVideoGroup?._id === item._id ? '#667eea' : '#bdc3c7',
                    }}
                    >
                      <VideoCameraOutlined />
                    </div>
                    <div style={{
                      fontWeight: 600,
                      fontSize: 16,
                      color: '#2c3e50',
                      marginBottom: 4,
                    }}
                    >
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
                      zIndex: 1,
                    }}
                    >
                      {t('mediaGroupType.video')}
                    </div>
                    {item.desc && (
                      <div style={{
                        fontSize: 12,
                        color: '#7f8c8d',
                        lineHeight: 1.4,
                        marginTop: 4,
                      }}
                      >
                        {item.desc}
                      </div>
                    )}
                    {/* 资源数量 */}
                    <div style={{
                      fontSize: 11,
                      color: '#95a5a6',
                      marginTop: 4,
                    }}
                    >
                      {item.mediaCount || 0}
                      {' '}
                      {t('mediaCount')}
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
                        zIndex: 2,
                      }}
                      >
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
            <div style={{ fontWeight: 500, marginBottom: 8 }}>{t('editMaterial.selectMediaGroup' as any)}</div>
            <List
              grid={{ gutter: 16, column: 2 }}
              dataSource={editMaterialMediaGroups}
              renderItem={item => (
                <List.Item>
                  <div
                    className={styles.mediaCard}
                    style={{
                      background: editMaterialSelectedGroup?._id === item._id
                        ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                        : '#FAEFFC',
                      border: editMaterialSelectedGroup?._id === item._id
                        ? '2px solid #667eea'
                        : '2px solid transparent',
                      padding: '20px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      minHeight: '100px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                    onClick={() => handleEditMaterialSelectGroup(item)}
                    onMouseEnter={(e) => {
                      if (editMaterialSelectedGroup?._id !== item._id) {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (editMaterialSelectedGroup?._id !== item._id) {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }
                    }}
                  >
                    <div style={{
                      fontSize: 24,
                      marginBottom: 8,
                      color: editMaterialSelectedGroup?._id === item._id ? '#667eea' : '#bdc3c7',
                    }}
                    >
                      <FolderOpenOutlined />
                    </div>
                    <div style={{
                      fontWeight: 600,
                      fontSize: 16,
                      color: '#2c3e50',
                      marginBottom: 4,
                    }}
                    >
                      {item.title}
                    </div>
                    {item.desc && (
                      <div style={{
                        fontSize: 12,
                        color: '#7f8c8d',
                        lineHeight: 1.4,
                      }}
                      >
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
                        fontSize: 12,
                      }}
                      >
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
                {t('editMaterial.selectCover' as any)}
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
                {t('editMaterial.selectMaterials' as any)}
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
                      if (editMaterialSelectedCover === media.url)
                        return
                      setEditMaterialSelectedMaterials(prev =>
                        prev.includes(media.url)
                          ? prev.filter(url => url !== media.url)
                          : [...prev, media.url],
                      )
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
                  {t('createMaterial.selectCoverGroup')}
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
                  {t('createMaterial.selectVideoGroup')}
                </Button>
              </div>
            )}

            {/* 封面选择区 */}
            {editMaterialSelectedCoverGroup && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 500 }}>
                    {t('createMaterial.selectCover')}
                  </div>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      setEditMaterialSelectedCoverGroup(null)
                      setEditMaterialCoverList([])
                      setEditMaterialSelectedCover(null)
                    }}
                  >
                    {t('createMaterial.reselectCoverGroup')}
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
                          message.warning(t('createMaterial.coverMustBeImage'))
                          return
                        }
                        setEditMaterialSelectedCover(media.url)
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
                    {t('createMaterial.selectVideo')}
                  </div>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      setEditMaterialSelectedVideoGroup(null)
                      setEditMaterialVideoList([])
                      setEditMaterialSelectedMaterials([])
                    }}
                  >
                    {t('createMaterial.reselectVideoGroup')}
                  </Button>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {editMaterialVideoList.map((media: any) => (
                    media.type === 'video'
                      ? (
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
                            onMouseEnter={e => (e.target as HTMLVideoElement).play()}
                            onMouseLeave={e => (e.target as HTMLVideoElement).pause()}
                          />
                        )
                      : (
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
                              message.warning(t('createMaterial.videoGroupOnly'))
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
          <Form.Item label={t('fields.title' as any)} name="title" rules={[{ required: true, message: t('validation.enterTitle' as any) }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('fields.description' as any)} name="desc">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item label={t('fields.location' as any)} name="location">
            <Input
              value={editMaterialLocation.join(',')}
              onChange={(e) => {
                const val = e.target.value.split(',').map((v: string) => Number(v.trim()))
                setEditMaterialLocation([val[0] || 0, val[1] || 0])
              }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* VIP 弹窗 */}
      <VipContentModal
        open={vipModalVisible}
        onClose={() => setVipModalVisible(false)}
      />
    </div>
  )
}
