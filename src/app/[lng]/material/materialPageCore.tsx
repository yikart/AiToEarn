"use client";

import { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Button, Modal, Input, Select } from "antd";
import { useRouter } from "next/navigation";
import { PlusOutlined, PlayCircleOutlined } from "@ant-design/icons";
import styles from "./styles/material.module.scss";

const { Title } = Typography;
const { Option } = Select;

interface Album {
  id: string;
  name: string;
  cover: string;
  count: number;
  type: 'video' | 'image' | 'audio';
  isCustom?: boolean;
}

export const MaterialPageCore = () => {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([
    {
      id: "1",
      name: "视频素材",
      cover: "https://t9.baidu.com/it/u=4049930541,3060541868&fm=3031&app=3031&size=r3,4&q=100&n=0&g=11n&f=JPEG&fmt=auto&maxorilen2heic=2000000?s=5180DD1D4F1048C20269D5D303005030",
      count: 10,
      type: 'video'
    },
    {
      id: "2",
      name: "图片素材",
      cover: "https://t9.baidu.com/it/u=355272986,883798233&fm=3031&app=3031&size=r3,4&q=100&n=0&g=11n&f=JPEG&fmt=auto&maxorilen2heic=2000000?s=BDD04B977503EEF04CA566E90300702E",
      count: 20,
      type: 'image'
    },
    {
      id: "3",
      name: "音频素材",
      cover: "https://t9.baidu.com/it/u=3718371372,4045138797&fm=3031&app=3031&size=r3,4&q=100&n=0&g=11n&f=JPEG&fmt=auto&maxorilen2heic=2000000?s=BAA10F8E985263FD7899495E0300E0E6",
      count: 15,
      type: 'audio'
    }
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumType, setNewAlbumType] = useState<'video' | 'image' | 'audio'>('video');

  const handleAlbumClick = (albumId: string) => {
    router.push(`/material/album/${albumId}`);
  };

  const handleCreateAlbum = () => {
    if (!newAlbumName) return;
    
    const newAlbum: Album = {
      id: Date.now().toString(),
      name: newAlbumName,
      cover: "https://t9.baidu.com/it/u=4049930541,3060541868&fm=3031&app=3031&size=r3,4&q=100&n=0&g=11n&f=JPEG&fmt=auto&maxorilen2heic=2000000?s=5180DD1D4F1048C20269D5D303005030",
      count: 0,
      type: newAlbumType,
      isCustom: true
    };

    setAlbums([...albums, newAlbum]);
    setIsModalVisible(false);
    setNewAlbumName("");
  };

  return (
    <div className={styles.materialContainer}>
      <div className={styles.header}>
        <Title level={2}>素材库</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          创建素材库
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        {albums.map((album) => (
          <Col xs={24} sm={12} md={8} lg={6} key={album.id}>
            <Card
              hoverable
              cover={
                <div className={styles.coverWrapper}>
                  <img alt={album.name} src={album.cover} />
                  {album.type === 'video' && (
                    <div className={styles.videoIcon}>
                      <PlayCircleOutlined />
                    </div>
                  )}
                </div>
              }
              onClick={() => handleAlbumClick(album.id)}
            >
              <Card.Meta
                title={album.name}
                description={
                  <div className={styles.albumInfo}>
                    <span>{album.type === 'video' ? '视频' : album.type === 'image' ? '图片' : '音频'}</span>
                    <span>共 {album.count} 个素材</span>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title="创建素材库"
        open={isModalVisible}
        onOk={handleCreateAlbum}
        onCancel={() => setIsModalVisible(false)}
      >
        <div className={styles.createForm}>
          <Input
            placeholder="请输入素材库名称"
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          <Select
            value={newAlbumType}
            onChange={(value) => setNewAlbumType(value)}
            style={{ width: '100%' }}
          >
            <Option value="video">视频素材</Option>
            <Option value="image">图片素材</Option>
            <Option value="audio">音频素材</Option>
          </Select>
        </div>
      </Modal>
    </div>
  );
}; 