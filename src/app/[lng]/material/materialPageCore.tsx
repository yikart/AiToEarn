"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input, Modal, Popconfirm, Select, message } from "antd";
import { 
  PlusOutlined, 
  VideoCameraOutlined, 
  PictureOutlined,
  FolderOutlined,
  EditOutlined,
  DeleteOutlined,
  RobotOutlined
} from "@ant-design/icons";
import styles from "./styles/material.module.scss";
import { createMediaGroup, getMediaGroupList, deleteMediaGroup, updateMediaGroupInfo } from "@/api/media";
import { getOssUrl } from "@/utils/oss";

const { Option } = Select;
const { TextArea } = Input;

interface MediaGroup {
  _id: string;
  title: string;
  desc: string;
  cover: string;
  count: number;
  type: 'video' | 'img';
  mediaList?: {
    list: Array<{
      _id: string;
      url: string;
      type: 'video' | 'img';
    }>;
    total: number;
  };
}

// 视频第一帧提取组件
const VideoThumbnail = ({ videoUrl, className, onLoad }: { 
  videoUrl: string; 
  className?: string; 
  onLoad?: (thumbnail: string) => void;
}) => {
  const [thumbnail, setThumbnail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;

    const extractFrame = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
      setThumbnail(thumbnailUrl);
      setLoading(false);
      onLoad?.(thumbnailUrl);
    };

    const handleLoadedData = () => {
      video.currentTime = 0.1; // 获取0.1秒处的帧
    };

    const handleSeeked = () => {
      extractFrame();
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('seeked', handleSeeked);
    
    video.load();

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [videoUrl, onLoad]);

  return (
    <>
      <video
        ref={videoRef}
        src={videoUrl}
        style={{ display: 'none' }}
        muted
        preload="metadata"
        crossOrigin="anonymous"
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {!loading && thumbnail && (
        <img 
          src={thumbnail} 
          alt="Video thumbnail" 
          className={className}
        />
      )}
    </>
  );
};

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
  const [newGroupType, setNewGroupType] = useState<'video' | 'img'>('video');
  const [editingGroup, setEditingGroup] = useState<MediaGroup | null>(null);

  useEffect(() => {
    fetchGroups();
  }, [currentPage]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
              const response:any = await getMediaGroupList(currentPage, pageSize);
      if (response?.data) {
        // 处理每个组的封面和资源数量
        const processedGroups = response.data.list.map((group: MediaGroup) => {
          const mediaList = group.mediaList;
          return {
            ...group,
            // 使用 mediaList 中第一张图片作为封面，如果没有则使用原封面
            cover: mediaList && mediaList.list.length > 0 
              ? getOssUrl(mediaList.list[0].url) 
              : group.cover,
            // 使用 mediaList 的 total 作为资源数量
            count: mediaList ? mediaList.total : group.count
          };
        });
        setGroups(processedGroups);
        setTotal(response.data.total);
      }
    } catch (error) {
      message.error('获取媒体资源组列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupClick = (group: MediaGroup) => {
    // 通过 URL 参数传递组信息
    const params = new URLSearchParams({
      title: group.title,
      type: group.type,
      desc: group.desc
    });
    router.push(`/material/album/${group._id}?${params.toString()}`);
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

  const handleUpdateGroup = async () => {
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

  // 获取封面图片或图标
  const getCoverDisplay = (group: MediaGroup) => {
    // 如果有封面图片，显示图片
    if (group.cover && group.cover !== '') {
      return (
        <div className={styles.coverContent}>
          {group.type === 'video' ? (
            <div className={styles.videoTypeIcon}>
              <VideoCameraOutlined />
              <VideoThumbnail 
              videoUrl={group.cover}
              className={styles.coverImage}
            />
            </div>
          ):
          (
            <img 
            alt={group.title} 
            src={group.cover} 
            className={styles.coverImage}
          />
          )
          
          }
          
          
        </div>
      );
    }
    
    // 如果mediaList存在且有内容，显示第一个媒体
    if (group.mediaList?.list && group.mediaList.list.length > 0) {
      const firstMedia = group.mediaList.list[0];
      
      if (firstMedia.type === 'video') {
        return (
          <div className={styles.coverContent}>
            <VideoThumbnail 
              videoUrl={firstMedia.url}
              className={styles.coverImage}
            />
            <div className={styles.videoTypeIcon}>
              <VideoCameraOutlined />
            </div>
          </div>
        );
      } else {
        return (
          <div className={styles.coverContent}>
            <img 
              alt={group.title} 
              src={firstMedia.url} 
              className={styles.coverImage}
            />
            <div className={styles.imageTypeIcon}>
              <PictureOutlined />
            </div>
          </div>
        );
      }
    }
    
    // 否则显示类型图标
    return (
      <div className={styles.iconCover}>
        {group.type === 'video' ? (
          <VideoCameraOutlined className={styles.typeIcon} />
        ) : (
          <PictureOutlined className={styles.typeIcon} />
        )}
      </div>
    );
  };

  return (
    <div className={styles.materialContainer}>
      <div className={styles.header}>
        <h3>媒体资源管理</h3>
        <div className={styles.headerActions}>
          <button 
            className={styles.aiGenerateButton}
            onClick={() => router.push('/material/ai-generate?tab=videoGeneration')}
          >
            <RobotOutlined />
            <span>AI视频生成</span>
          </button>
          <button 
            className={styles.createButton}
            onClick={() => setIsModalVisible(true)}
          >
            <PlusOutlined />
            <span>创建媒体资源组</span>
          </button>
        </div>
      </div>

      {groups.length > 0 ? (
        <div className={styles.mediaGrid}>
          {groups.map((group) => (
            <div key={group._id} className={styles.mediaCard} onClick={() => handleGroupClick(group)}>
              <div className={styles.coverWrapper}>
                {getCoverDisplay(group)}
                <div className={styles.cardActions}>
                  <button 
                    className={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      showEditModal(group);
                    }}
                  >
                    <EditOutlined />
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
                      <DeleteOutlined />
                    </button>
                  </Popconfirm>
                </div>
                <div className={styles.resourceBadge}>
                  <span className={styles.badgeText}>
                    {group.count} 个资源
                  </span>
                </div>
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{group.title}</h3>
                <div className={styles.albumInfo}>
                  <p className={styles.description}>{group.desc || '暂无描述'}</p>
                  <div className={styles.typeTag}>
                    {group.type === 'video' ? (
                      <>
                        <VideoCameraOutlined />
                        <span>视频</span>
                      </>
                    ) : (
                      <>
                        <PictureOutlined />
                        <span>图片</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyContainer}>
          <div className={styles.emptyIcon}>
            <FolderOutlined />
          </div>
          <h3>暂无媒体资源组</h3>
          <p>创建您的第一个媒体资源组，开始管理您的素材</p>
          <button 
            className={styles.emptyCreateButton}
            onClick={() => setIsModalVisible(true)}
          >
            <PlusOutlined />
            立即创建
          </button>
        </div>
      )}

      {/* Modal components */}
      <Modal
        title="创建媒体资源组"
        open={isModalVisible}
        onOk={handleCreateGroup}
        onCancel={() => {
          setIsModalVisible(false);
          setNewGroupTitle("");
          setNewGroupDesc("");
          setNewGroupType('video');
        }}
        okText="创建"
        cancelText="取消"
        confirmLoading={loading}
      >
        <div className={styles.form}>
          <div className={styles.formGroup}>
            <label>资源组名称</label>
            <Input
              value={newGroupTitle}
              onChange={(e) => setNewGroupTitle(e.target.value)}
              placeholder="请输入资源组名称"
            />
          </div>
          <div className={styles.formGroup}>
            <label>描述</label>
            <Input.TextArea
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              placeholder="请输入描述（可选）"
              rows={3}
            />
          </div>
          <div className={styles.formGroup}>
            <label>类型</label>
            <Select
              value={newGroupType}
              onChange={(value) => setNewGroupType(value)}
              style={{ width: '100%' }}
            >
              <Select.Option value="video">视频</Select.Option>
              <Select.Option value="img">图片</Select.Option>
            </Select>
          </div>
        </div>
      </Modal>

      <Modal
        title="编辑媒体资源组"
        open={isEditModalVisible}
        onOk={handleUpdateGroup}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingGroup(null);
        }}
        okText="保存"
        cancelText="取消"
        confirmLoading={loading}
      >
        {editingGroup && (
          <div className={styles.form}>
            <div className={styles.formGroup}>
              <label>资源组名称</label>
              <Input
                value={editingGroup.title}
                onChange={(e) => setEditingGroup({
                  ...editingGroup,
                  title: e.target.value
                })}
                placeholder="请输入资源组名称"
              />
            </div>
            <div className={styles.formGroup}>
              <label>描述</label>
              <Input.TextArea
                value={editingGroup.desc}
                onChange={(e) => setEditingGroup({
                  ...editingGroup,
                  desc: e.target.value
                })}
                placeholder="请输入描述（可选）"
                rows={3}
              />
            </div>
            <div className={styles.formGroup}>
              <label>类型</label>
              <Select
                value={editingGroup.type}
                onChange={(value) => setEditingGroup({
                  ...editingGroup,
                  type: value
                })}
                style={{ width: '100%' }}
              >
                <Select.Option value="video">视频</Select.Option>
                <Select.Option value="img">图片</Select.Option>
              </Select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}; 