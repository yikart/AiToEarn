"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input, Modal, Popconfirm, Select, message } from "antd";
import { useTransClient } from "@/app/i18n/client";
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
  previewMedia?: {
    type: 'video' | 'img';
    url: string;
  } | null;
}

// 视频预览组件 - 由于 CORS 问题，直接显示预览框
const VideoThumbnail = ({ videoUrl, className, onLoad }: { 
  videoUrl: string; 
  className?: string; 
  onLoad?: (thumbnail: string) => void;
}) => {
  // 直接显示视频预览框，不尝试加载视频（避免 CORS 问题）
  return (
    <div className={`${className} ${styles.videoPreview}`}>
      <div className={styles.videoPreviewContent}>
        <VideoCameraOutlined className={styles.videoPreviewIcon} />
        <div className={styles.videoPreviewText}>视频预览</div>
        <div className={styles.videoPreviewPlayButton}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M8 5v14l11-7z" fill="currentColor"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export const MaterialPageCore = () => {
  const router = useRouter();
  const { t } = useTransClient("material");
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
          
          // 查找第一个视频或图片作为预览
          let previewMedia = null;
          if (mediaList && mediaList.list.length > 0) {
            // 优先查找视频，如果没有视频则使用图片
            previewMedia = mediaList.list.find(media => media.type === 'video') || mediaList.list[0];
            console.log('Found preview media for group:', group.title, previewMedia);
          }
          
          const processedGroup = {
            ...group,
            // 使用找到的预览媒体作为封面
            cover: previewMedia ? getOssUrl(previewMedia.url) : group.cover,
            // 使用 mediaList 的 total 作为资源数量
            count: mediaList ? mediaList.total : group.count,
            // 保存预览媒体的类型和URL信息
            previewMedia: previewMedia ? {
              type: previewMedia.type,
              url: previewMedia.url
            } : null
          };
          
          return processedGroup;
        });
        setGroups(processedGroups);
        setTotal(response.data.total);
      }
    } catch (error) {
      message.error(t('mediaManagement.getListFailed'));
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
      message.success(t('mediaManagement.createSuccess'));
      fetchGroups();
      setIsModalVisible(false);
      setNewGroupTitle("");
      setNewGroupDesc("");
    } catch (error) {
      message.error(t('mediaManagement.createFailed'));
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
              await deleteMediaGroup(groupId);
      message.success(t('mediaManagement.deleteSuccess'));
      fetchGroups();
    } catch (error) {
      message.error(t('mediaManagement.deleteFailed'));
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
      message.success(t('mediaManagement.updateSuccess'));
      fetchGroups();
      setIsEditModalVisible(false);
      setEditingGroup(null);
      setNewGroupTitle("");
      setNewGroupDesc("");
    } catch (error) {
      message.error(t('mediaManagement.updateFailed'));
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
    // 如果有预览媒体，优先显示预览媒体
    if (group.previewMedia) {
      console.log('Using preview media:', group.previewMedia);
      if (group.previewMedia.type === 'video') {
        const videoUrl = getOssUrl(group.previewMedia.url);
        console.log('Video URL:', videoUrl);
        return (
          <div className={styles.coverContent}>
            <VideoThumbnail 
              videoUrl={videoUrl}
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
              src={getOssUrl(group.previewMedia.url)} 
              className={styles.coverImage}
            />
            <div className={styles.imageTypeIcon}>
              <PictureOutlined />
            </div>
          </div>
        );
      }
    }

    // 如果没有预览媒体但有 mediaList，尝试使用第一个媒体
    if (group.mediaList?.list && group.mediaList.list.length > 0) {
      const firstMedia = group.mediaList.list[0];
      console.log('Using first media from mediaList:', firstMedia);
      
      if (firstMedia.type === 'video') {
        const videoUrl = getOssUrl(firstMedia.url);
        console.log('Video URL from mediaList:', videoUrl);
        return (
          <div className={styles.coverContent}>
            <VideoThumbnail 
              videoUrl={videoUrl}
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
              src={getOssUrl(firstMedia.url)} 
              className={styles.coverImage}
            />
            <div className={styles.imageTypeIcon}>
              <PictureOutlined />
            </div>
          </div>
        );
      }
    }
    
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
          ) : (
            <img 
              alt={group.title} 
              src={group.cover} 
              className={styles.coverImage}
            />
          )}
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
              videoUrl={getOssUrl(firstMedia.url)}
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
              src={getOssUrl(firstMedia.url)} 
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
        <h3>{t('mediaManagement.title')}</h3>
        <div className={styles.headerActions}>
          <button 
            className={styles.aiGenerateButton}
            onClick={() => router.push('/material/ai-generate?tab=videoGeneration')}
          >
            <RobotOutlined />
            <span>{t('mediaManagement.aiVideoGenerate')}</span>
          </button>
          <button 
            className={styles.createButton}
            onClick={() => setIsModalVisible(true)}
          >
            <PlusOutlined />
            <span>{t('mediaManagement.createGroup')}</span>
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
                    title={t('mediaManagement.deleteConfirm')}
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      handleDeleteGroup(group._id);
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                    okText={t('mediaManagement.delete')}
                    cancelText={t('mediaManagement.cancel')}
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
                    {group.count}{t('mediaManagement.resources')}
                  </span>
                </div>
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{group.title}</h3>
                <div className={styles.albumInfo}>
                  <p className={styles.description}>{group.desc || t('mediaManagement.noDescription')}</p>
                  <div className={styles.typeTag}>
                    {group.type === 'video' ? (
                      <>
                        <VideoCameraOutlined />
                        <span>{t('mediaManagement.video')}</span>
                      </>
                    ) : (
                      <>
                        <PictureOutlined />
                        <span>{t('mediaManagement.image')}</span>
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
          <h3>{t('mediaManagement.noGroups')}</h3>
          <p>{t('mediaManagement.noGroupsDesc')}</p>
          <button 
            className={styles.emptyCreateButton}
            onClick={() => setIsModalVisible(true)}
          >
            <PlusOutlined />
            {t('mediaManagement.createNow')}
          </button>
        </div>
      )}

      {/* Modal components */}
      <Modal
        title={t('mediaManagement.createGroup')}
        open={isModalVisible}
        onOk={handleCreateGroup}
        onCancel={() => {
          setIsModalVisible(false);
          setNewGroupTitle("");
          setNewGroupDesc("");
          setNewGroupType('video');
        }}
        okText={t('mediaManagement.create')}
        cancelText={t('mediaManagement.cancel')}
        confirmLoading={loading}
      >
        <div className={styles.form}>
          <div className={styles.formGroup}>
            <label>{t('mediaManagement.groupName')}</label>
            <Input
              value={newGroupTitle}
              onChange={(e) => setNewGroupTitle(e.target.value)}
              placeholder={t('mediaManagement.groupNamePlaceholder')}
            />
          </div>
          <div className={styles.formGroup}>
            <label>{t('mediaManagement.description')}</label>
            <Input.TextArea
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              placeholder={t('mediaManagement.descriptionPlaceholder')}
              rows={3}
            />
          </div>
          <div className={styles.formGroup}>
            <label>{t('mediaManagement.type')}</label>
            <Select
              value={newGroupType}
              onChange={(value) => setNewGroupType(value)}
              style={{ width: '100%' }}
            >
              <Select.Option value="video">{t('mediaManagement.video')}</Select.Option>
              <Select.Option value="img">{t('mediaManagement.image')}</Select.Option>
            </Select>
          </div>
        </div>
      </Modal>

      <Modal
        title={t('mediaManagement.editGroup')}
        open={isEditModalVisible}
        onOk={handleUpdateGroup}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingGroup(null);
        }}
        okText={t('mediaManagement.save')}
        cancelText={t('mediaManagement.cancel')}
        confirmLoading={loading}
      >
        {editingGroup && (
          <div className={styles.form}>
            <div className={styles.formGroup}>
              <label>{t('mediaManagement.groupName')}</label>
              <Input
                value={editingGroup.title}
                onChange={(e) => setEditingGroup({
                  ...editingGroup,
                  title: e.target.value
                })}
                placeholder={t('mediaManagement.groupNamePlaceholder')}
              />
            </div>
            <div className={styles.formGroup}>
              <label>{t('mediaManagement.description')}</label>
              <Input.TextArea
                value={editingGroup.desc}
                onChange={(e) => setEditingGroup({
                  ...editingGroup,
                  desc: e.target.value
                })}
                placeholder={t('mediaManagement.descriptionPlaceholder')}
                rows={3}
              />
            </div>
            <div className={styles.formGroup}>
              <label>{t('mediaManagement.type')}</label>
              <Select
                value={editingGroup.type}
                onChange={(value) => setEditingGroup({
                  ...editingGroup,
                  type: value
                })}
                style={{ width: '100%' }}
              >
                <Select.Option value="video">{t('mediaManagement.video')}</Select.Option>
                <Select.Option value="img">{t('mediaManagement.image')}</Select.Option>
              </Select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}; 