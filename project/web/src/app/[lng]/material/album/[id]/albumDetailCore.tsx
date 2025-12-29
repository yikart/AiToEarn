'use client'

import { PictureOutlined, PlayCircleOutlined, PlusOutlined, SoundOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Typography, Upload } from 'antd'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from '@/lib/toast'
import styles from './albumDetail.module.scss'

const { Title } = Typography

interface Material {
  id: string
  name: string
  url: string
  type: 'video' | 'img'
  createTime: string
}

interface AlbumDetailCoreProps {
  albumId: string
}

export function AlbumDetailCore({ albumId }: AlbumDetailCoreProps) {
  const router = useRouter()
  const [materials, setMaterials] = useState<Material[]>([])
  const [albumInfo, setAlbumInfo] = useState({
    name: '视频素材',
    type: 'video' as 'video' | 'img',
    count: 0,
  })

  useEffect(() => {
    // 这里应该调用API获取素材库信息和素材列表
    // 暂时使用模拟数据
    setMaterials([
      {
        id: '1',
        name: '示例视频1',
        url: 'https://example.com/video1.mp4',
        type: 'video',
        createTime: '2024-01-01',
      },
      // 更多素材...
    ])
  }, [albumId])

  const handleUpload = (file: File) => {
    // 这里应该调用API上传素材
    toast.success('上传成功')
    return false
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <PlayCircleOutlined />
      case 'img':
        return <PictureOutlined />
      case 'audio':
        return <SoundOutlined />
      default:
        return null
    }
  }

  return (
    <div className={styles.albumDetailContainer}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Title level={2}>{albumInfo.name}</Title>
          <span className={styles.typeTag}>
            {albumInfo.type === 'video' ? '视频' : '图片'}
          </span>
        </div>
        <Upload
          accept={albumInfo.type === 'video' ? 'video/*' : 'image/*'}
          showUploadList={false}
          beforeUpload={handleUpload}
        >
          <Button type="primary" icon={<PlusOutlined />}>
            上传素材
          </Button>
        </Upload>
      </div>

      <Row gutter={[24, 24]}>
        {materials.map(material => (
          <Col xs={24} sm={12} md={8} lg={6} key={material.id}>
            <Card
              hoverable
              cover={(
                <div className={styles.coverWrapper}>
                  <img alt={material.name} src={material.url} />
                  {material.type === 'video' && (
                    <div className={styles.videoIcon}>
                      <PlayCircleOutlined />
                    </div>
                  )}
                </div>
              )}
            >
              <Card.Meta
                title={material.name}
                description={(
                  <div className={styles.materialInfo}>
                    <span>{material.createTime}</span>
                    <span className={styles.typeIcon}>
                      {getTypeIcon(material.type)}
                    </span>
                  </div>
                )}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
