"use client";

import { useEffect, useState } from "react";
import { Modal, Input, Select, message, Popconfirm } from "antd";
import { useRouter } from "next/navigation";
import styles from "./styles/material.module.scss";
import { createMediaGroup, deleteMediaGroup, getMediaGroupList, updateMediaGroupInfo } from "@/api/media";

const { Option } = Select;
const { TextArea } = Input;

interface MediaGroup {
  _id: string;
  title: string;
  desc: string;
  cover: string;
  count: number;
  type: 'video' | 'img' | 'audio';
}

export const MaterialPageCore = () => {
  const router = useRouter();
  const [groups, setGroups] = useState<MediaGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupType, setNewGroupType] = useState<'video' | 'img' | 'audio'>('video');
  const [editingGroup, setEditingGroup] = useState<MediaGroup | null>(null);

  useEffect(() => {
    fetchGroups();
  }, [currentPage]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response:any = await getMediaGroupList(currentPage, pageSize);
      if (response?.data) {
        setGroups(response.data.list);
        setTotal(response.data.total);
      }
    } catch (error) {
      message.error('获取媒体资源组列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupClick = (groupId: string) => {
    router.push(`/material/album/${groupId}`);
  };

  const handleCreateGroup = async () => {
    if (!newGroupTitle) return;
    
    try {
      await createMediaGroup({
        title: newGroupTitle,
        desc: newGroupDesc,
        type: newGroupType
      });
      message.success('创建媒体资源组成功');
      fetchGroups();
      setIsModalVisible(false);
      setNewGroupTitle("");
      setNewGroupDesc("");
    } catch (error) {
      message.error('创建媒体资源组失败');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await deleteMediaGroup(groupId);
      message.success('删除媒体资源组成功');
      fetchGroups();
    } catch (error) {
      message.error('删除媒体资源组失败');
    }
  };

  const handleEditGroup = async () => {
    if (!editingGroup || !newGroupTitle) return;
    
    try {
      await updateMediaGroupInfo(editingGroup._id, {
        title: newGroupTitle,
        desc: newGroupDesc,
        type: newGroupType
      });
      message.success('更新媒体资源组成功');
      fetchGroups();
      setIsEditModalVisible(false);
      setEditingGroup(null);
      setNewGroupTitle("");
      setNewGroupDesc("");
    } catch (error) {
      message.error('更新媒体资源组失败');
    }
  };

  const showEditModal = (group: MediaGroup) => {
    setEditingGroup(group);
    setNewGroupTitle(group.title);
    setNewGroupDesc(group.desc);
    setNewGroupType(group.type);
    setIsEditModalVisible(true);
  };

  return (
    <div className={styles.materialContainer}>
      <div className={styles.header}>
        <h2>媒体资源组</h2>
        <button 
          className={styles.createButton}
          onClick={() => setIsModalVisible(true)}
        >
          <span>创建媒体资源组</span>
        </button>
      </div>

      {groups.length > 0 ? (
        <div className={styles.mediaGrid}>
          {groups.map((group) => (
            <div key={group._id} className={styles.mediaCard} onClick={() => handleGroupClick(group._id)}>
              <div className={styles.coverWrapper}>
                <img alt={group.title} src={group.cover} />
                {group.type === 'video' && (
                  <div className={styles.videoIcon}>
                    <span>▶</span>
                  </div>
                )}
                <div className={styles.cardActions}>
                  <button 
                    className={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      showEditModal(group);
                    }}
                  >
                    编辑
                  </button>
                  <Popconfirm
                    title="确定要删除这个媒体资源组吗？"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      handleDeleteGroup(group._id);
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                    okText="确定"
                    cancelText="取消"
                  >
                    <button 
                      className={`${styles.actionButton} ${styles.delete}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      删除
                    </button>
                  </Popconfirm>
                </div>
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{group.title}</h3>
                <div className={styles.albumInfo}>
                  <div>{group.desc}</div>
                  <div>
                    <span>{group.type === 'video' ? '视频' : group.type === 'img' ? '图片' : ''}</span>
                    <span>共 {group.count} 个资源</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyContainer}>
          <h3>暂无媒体资源组</h3>
          <p>点击上方按钮创建媒体资源组</p>
          
        </div>
      )}

      <Modal
        title="创建媒体资源组"
        open={isModalVisible}
        onOk={handleCreateGroup}
        onCancel={() => {
          setIsModalVisible(false);
          setNewGroupTitle("");
          setNewGroupDesc("");
        }}
      >
        <div className={styles.createForm}>
          <Input
            placeholder="请输入媒体资源组标题"
            value={newGroupTitle}
            onChange={(e) => setNewGroupTitle(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          <TextArea
            placeholder="请输入媒体资源组描述"
            value={newGroupDesc}
            onChange={(e) => setNewGroupDesc(e.target.value)}
            rows={4}
            style={{ marginBottom: 16 }}
          />
          <Select
            value={newGroupType}
            onChange={(value) => setNewGroupType(value)}
            style={{ width: '100%' }}
          >
            <Option value="video">视频资源</Option>
            <Option value="img">图片资源</Option>
            <Option value="audio">音频资源</Option>
          </Select>
        </div>
      </Modal>

      <Modal
        title="编辑媒体资源组"
        open={isEditModalVisible}
        onOk={handleEditGroup}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingGroup(null);
          setNewGroupTitle("");
          setNewGroupDesc("");
        }}
      >
        <div className={styles.createForm}>
          <Input
            placeholder="请输入媒体资源组标题"
            value={newGroupTitle}
            onChange={(e) => setNewGroupTitle(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          <TextArea
            placeholder="请输入媒体资源组描述"
            value={newGroupDesc}
            onChange={(e) => setNewGroupDesc(e.target.value)}
            rows={4}
            style={{ marginBottom: 16 }}
          />
          <Select
            value={newGroupType}
            onChange={(value) => setNewGroupType(value)}
            style={{ width: '100%' }}
          >
            <Option value="video">视频资源</Option>
            <Option value="img">图片资源</Option>
            <Option value="audio">音频资源</Option>
          </Select>
        </div>
      </Modal>
    </div>
  );
}; 