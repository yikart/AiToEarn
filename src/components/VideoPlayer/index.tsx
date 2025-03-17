import React, { useState, useRef, useEffect } from 'react';
import { Modal } from 'antd';
import styles from './videoPlayer.module.scss';

interface VideoPlayerProps {
  videoUrl: string;
  visible: boolean;
  onClose: () => void;
  title?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, visible, onClose, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // 当模态框关闭时暂停视频
    if (!visible && videoRef.current) {
      videoRef.current.pause();
    }
  }, [visible]);

  return (
    <Modal
      title={title || '视频播放'}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      destroyOnClose
      className={styles.videoModal}
    >
      <div className={styles.videoContainer}>
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          autoPlay
          className={styles.videoPlayer}
        />
      </div>
    </Modal>
  );
};

export default VideoPlayer; 