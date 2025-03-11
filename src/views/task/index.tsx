/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-02-28 21:36:53
 * @LastEditors: nevin
 * @Description: 任务页面
 */
import { useState } from 'react';
import {
  ShoppingCartOutlined,
  ShareAltOutlined,
  VideoCameraOutlined,
  HistoryOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import styles from './task.module.scss';

// 导入现有的任务组件
import CarTask from './carTask';
import PopTask from './popTask';
import VideoTask from './videoTask';
import MineTask from './mineTask';

// 任务类型定义
interface Task {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  likes: number;
  views: number;
  level: string;
}

export default function Task() {
  // 当前选中的任务类型
  const [activeTab, setActiveTab] = useState('car');

  // 渲染对应的任务内容
  const renderTaskContent = () => {
    switch (activeTab) {
      case 'car':
        return <CarTask />;
      case 'pop':
        return <PopTask />;
      case 'video':
        return <VideoTask />;
      case 'mine':
        return <MineTask />;
      default:
        return <CarTask />;
    }
  };

  return (
    <div className={styles.taskPageContainer}>
      {/* 顶部导航栏 */}
      <div className={styles.taskHeader}>
        <div className={styles.taskHeaderLeft}>
          <div
            className={`${styles.taskButton} ${activeTab === 'car' ? styles.activeTaskButton : ''}`}
            onClick={() => setActiveTab('car')}
          >
            <ShoppingCartOutlined />
            <span>挂车市场任务</span>
          </div>
          <div
            className={`${styles.taskButton} ${activeTab === 'pop' ? styles.activeTaskButton : ''}`}
            onClick={() => setActiveTab('pop')}
          >
            <ShareAltOutlined />
            <span>推广任务</span>
          </div>
          <div
            className={`${styles.taskButton} ${activeTab === 'video' ? styles.activeTaskButton : ''}`}
            onClick={() => setActiveTab('video')}
          >
            <VideoCameraOutlined />
            <span>视频任务</span>
          </div>
          <div
            className={`${styles.taskButton} ${activeTab === 'mine' ? styles.activeTaskButton : ''}`}
            onClick={() => setActiveTab('mine')}
          >
            <HistoryOutlined />
            <span>已参与过任务</span>
          </div>
        </div>
        <div className={styles.taskHeaderRight}>
          <div className={styles.withdrawText}>
            <WalletOutlined />
            <span>提现</span>
          </div>
        </div>
      </div>

      {/* 任务内容 */}
      <div className={styles.taskContent}>{renderTaskContent()}</div>
    </div>
  );
}
