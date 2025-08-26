"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { message, Popconfirm } from "antd";
import styles from "./album.module.scss";
import { createMedia, deleteMedia, getMediaList } from "@/api/media";
import { uploadToOss } from "@/api/oss";
import { getOssUrl } from "@/utils/oss";

interface Media {
  _id: string;
  name: string;
  url: string;
  type: 'video' | 'img';
  description?: string;
  title: string;
  desc: string;
}

interface MediaGroup {
  _id: string;
  title: string;
  desc: string;
  type: 'video' | 'img';
}

export default function AlbumPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const albumId = params.id as string;
  
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [groupInfo, setGroupInfo] = useState<MediaGroup | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const [previewMedia, setPreviewMedia] = useState<Media | null>(null);

  useEffect(() => {
    // 从 URL 参数获取组信息
    const title = searchParams.get('title') || '';
    const type = searchParams.get('type') as 'video' | 'img' || 'video';
    const desc = searchParams.get('desc') || '';
    
    if (title) {
      setGroupInfo({
        _id: albumId,
        title,
        type,
        desc
      });
    }
    
    fetchMediaList();
  }, [currentPage, albumId, searchParams]);

  const fetchMediaList = async () => {
    try {
      setLoading(true);
      const response:any = await getMediaList(albumId, currentPage, pageSize);
      if (response?.data?.list) {
        setMediaList(response.data.list);
      } else {
        setMediaList([]);
      }
    } catch (error) {
      message.error('获取媒体资源列表失败');
      setMediaList([]);
    } finally {
      setLoading(false);
    }
  };

  // 根据资源组类型获取允许的文件类型
  const getAcceptTypes = () => {
    if (!groupInfo) return "image/*,video/*,audio/*";
    
    switch (groupInfo.type) {
      case 'video':
        return "video/*";
      case 'img':
        return "image/*";
      default:
        return "image/*,video/*";
    }
  };

  // 验证文件类型是否匹配资源组类型
  const validateFileType = (file: File): boolean => {
    if (!groupInfo) return true;
    
    const fileType = file.type;
    switch (groupInfo.type) {
      case 'video':
        return fileType.startsWith('video/');
      case 'img':
        return fileType.startsWith('image/');
      default:
        return true;
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!validateFileType(file)) {
          const typeMap = {
      'video': '视频',
      'img': '图片'
    };
      message.error(`此资源组只允许上传${typeMap[groupInfo!.type]}文件`); 
      event.target.value = ''; // 清空文件选择
      return;
    }

    try {
      const url = await uploadToOss(file);
      
      await createMedia({
        groupId: albumId,
        type: file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'img' : 'img',  // 音频暂时不支持     
        url,
        title: file.name,
        desc: ''
      });

      message.success('上传成功');
      fetchMediaList();
    } catch (error) {
      message.error('上传失败');
    }
  };

  const handleDelete = async (mediaId: string) => {
    try {
      await deleteMedia(mediaId);
      message.success('删除成功');
      fetchMediaList();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleAIGenerate = () => {
    router.push(`/material/ai-generate`);
  };

  // 获取资源类型显示文本
  const getTypeText = () => {
    if (!groupInfo) return '媒体资源';
    
    const typeMap = {
      'video': '视频资源',
      'img': '图片资源'
    };
    return typeMap[groupInfo.type];
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{groupInfo ? `${groupInfo.title} - ${getTypeText()}` : '媒体资源'}</h2>
        <div className={styles.headerActions}>
          <label className={styles.uploadButton} onClick={handleAIGenerate}>
              AI生成素材
          </label>
          
          <label className={styles.uploadButton}>
            <input
              type="file"
              accept={getAcceptTypes()}
              onChange={handleUpload}
              style={{ display: 'none' }}
            />
            <span>上传{groupInfo ? getTypeText().replace('资源', '') : '资源'}</span>
          </label>
          
        </div>

        
      </div>

      <div className={styles.mediaGrid}>
        {mediaList.length > 0 ? (
          mediaList.map((media) => (
            <div key={media._id} className={styles.mediaCard}>
              <div className={styles.mediaWrapper} onClick={() => setPreviewMedia(media)}>
                {media.type === 'video' ? (
                  <video src={getOssUrl(media.url)} />
                ) : media.type === 'img' ? (
                  <img alt={media.title} src={getOssUrl(media.url)} />
                ) : (
                  <audio src={getOssUrl(media.url)} />
                )}
                <div className={styles.mediaActions}>
                  <Popconfirm
                    title="确定要删除这个媒体资源吗？"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      handleDelete(media._id);
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
              <div className={styles.mediaInfo}>
                <h3>{media.title}</h3>
                <p>{media.desc}</p>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <h3>暂无媒体资源</h3>
            <p>点击上方按钮上传资源</p>
          </div>
        )}
      </div>

      {previewMedia && (
        <div className={styles.modal} onClick={() => setPreviewMedia(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{previewMedia.title}</h3>
              <button onClick={() => setPreviewMedia(null)}>×</button>
            </div>
            <div className={styles.previewContent}>
              {previewMedia.type === 'video' ? (
                <video src={getOssUrl(previewMedia.url)} controls autoPlay />
              ) : previewMedia.type === 'img' ? (
                <img alt={previewMedia.title} src={getOssUrl(previewMedia.url)} />
              ) : (
                <audio src={getOssUrl(previewMedia.url)} controls autoPlay />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 