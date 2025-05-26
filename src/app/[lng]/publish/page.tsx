"use client";

import { useState } from 'react';
import { Button, Tabs } from 'antd';
import styles from './publish.module.css';
import PublishList from './components/PublishList';
import DraftList from './components/DraftList';
import CreatePublish from './components/CreatePublish';
import { PubType, PublishType } from '@/types/publish';

export default function PublishPage() {
  const [activeTab, setActiveTab] = useState('1');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [createType, setCreateType] = useState<PublishType>(PubType.VIDEO);

  const handleCreateClick = (type: PublishType) => {
    setCreateType(type);
    setIsCreateModalVisible(true);
  };

  const items = [
    {
      key: '1',
      label: '发布列表',
      children: <PublishList />,
    },
    {
      key: '2',
      label: '草稿箱',
      children: <DraftList />,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>内容发布</h1>
        <div className={styles.actions}>
          <Button 
            type="primary" 
            onClick={() => handleCreateClick(PubType.IMAGE_TEXT)}
            className={styles.createButton}
          >
            创建图文发布
          </Button>
          <Button 
            type="primary" 
            onClick={() => handleCreateClick(PubType.VIDEO)}
            className={styles.createButton}
          >
            创建视频发布
          </Button>
          <Button 
            type="primary" 
            onClick={() => handleCreateClick(PubType.ARTICLE)}
            className={styles.createButton}
          >
            创建文章发布
          </Button>
        </div>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={items}
        className={styles.tabs}
      />

      <CreatePublish
        visible={isCreateModalVisible}
        type={createType}
        onClose={() => setIsCreateModalVisible(false)}
      />
    </div>
  );
} 