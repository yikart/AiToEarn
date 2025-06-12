"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { message } from "antd";
import styles from "./album.module.scss";
import { createMedia, deleteMedia, getMediaList, updateMediaInfo } from "@/api/media";
import { uploadToOss } from "@/api/oss";
import { getOssUrl } from "@/utils/oss";

interface Media {
  id: string;
  name: string;
  url: string;
  type: 'video' | 'img' | 'audio';
  description?: string;
  title: string;
  desc: string;
}

export default function AlbumPage() {
  const params = useParams();
  const albumId = params.id as string;
  
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [previewMedia, setPreviewMedia] = useState<Media | null>(null);

  useEffect(() => {
    fetchMediaList();
  }, [currentPage, albumId]);

  const fetchMediaList = async () => {
    try {
      setLoading(true);
      const response:any = await getMediaList(currentPage, pageSize);
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

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadToOss(file);
      
      await createMedia({
        groupId: albumId,
        type: file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'img' : 'audio',
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
    if (!confirm('确定要删除吗？')) return;
    
    try {
      await deleteMedia(mediaId);
      message.success('删除成功');
      fetchMediaList();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingMedia) return;

    const formData = new FormData(event.currentTarget);
    const values = {
      title: formData.get('title') as string,
      desc: formData.get('desc') as string
    };

    try {
      await updateMediaInfo(editingMedia.id, values);
      message.success('更新成功');
      setEditingMedia(null);
      fetchMediaList();
    } catch (error) {
      message.error('更新失败');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>媒体资源</h2>
        <label className={styles.uploadButton}>
          <input
            type="file"
            accept="image/*,video/*,audio/*"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
          <span>上传资源</span>
        </label>
      </div>

      <div className={styles.mediaGrid}>
        {mediaList.length > 0 ? (
          mediaList.map((media) => (
            <div key={media.id} className={styles.mediaCard}>
              <div className={styles.mediaWrapper} onClick={() => setPreviewMedia(media)}>
                {media.type === 'video' ? (
                  <video src={getOssUrl(media.url)} />
                ) : media.type === 'img' ? (
                  <img alt={media.title} src={getOssUrl(media.url)} />
                ) : (
                  <audio src={getOssUrl(media.url)} />
                )}
                <div className={styles.mediaActions}>
                  <button
                    className={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingMedia(media);
                    }}
                  >
                    编辑
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.delete}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(media.id);
                    }}
                  >
                    删除
                  </button>
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
            {previewMedia.type === 'video' ? (
              <video src={getOssUrl(previewMedia.url)} controls autoPlay />
            ) : previewMedia.type === 'img' ? (
              <img alt={previewMedia.title} src={getOssUrl(previewMedia.url)} />
            ) : (
              <audio src={getOssUrl(previewMedia.url)} controls autoPlay />
            )}
          </div>
        </div>
      )}

      {editingMedia && (
        <div className={styles.modal} onClick={() => setEditingMedia(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>编辑媒体信息</h3>
              <button onClick={() => setEditingMedia(null)}>×</button>
            </div>
            <form className={styles.form} onSubmit={handleEditSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="title">标题</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  defaultValue={editingMedia.title}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="desc">描述</label>
                <textarea
                  id="desc"
                  name="desc"
                  defaultValue={editingMedia.desc}
                />
              </div>
              <button type="submit" className={styles.submitButton}>
                保存
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 