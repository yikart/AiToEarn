/*
 * @Author: nevin
 * @Date: 2025-03-03 10:00:00
 * @LastEditTime: 2025-03-03 10:00:00
 * @LastEditors: nevin
 * @Description: 互动任务组件
 */
import { Card, List, Typography, Button, Space, Tag } from 'antd';
import { CommentOutlined, LikeOutlined, ShareAltOutlined } from '@ant-design/icons';
import styles from './task.module.scss';

const { Title, Text } = Typography;

export default function InteractionTask() {
  // 模拟互动任务数据
  const interactionTasks = [
    {
      id: '1',
      title: '评论互动任务',
      content: '对指定文章进行有意义的评论和互动...',
      price: 30,
      comments: 500,
      shares: 200,
      level: '初级',
    },
    {
      id: '2',
      title: '点赞分享任务',
      content: '对指定内容进行点赞和分享...',
      price: 20,
      comments: 300,
      shares: 150,
      level: '初级',
    },
  ];

  return (
    <div className={styles.taskList}>
      <List
        grid={{ gutter: 16, column: 3 }}
        dataSource={interactionTasks}
        renderItem={(item) => (
          <List.Item>
            <Card
              className={styles.taskCard}
              cover={
                <div className={styles.taskImage}>
                  <CommentOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
                </div>
              }
              actions={[
                <Space key="comments">
                  <CommentOutlined />
                  <Text>{item.comments}</Text>
                </Space>,
                <Space key="shares">
                  <ShareAltOutlined />
                  <Text>{item.shares}</Text>
                </Space>,
                <Button type="primary" key="join">
                  参与任务
                </Button>,
              ]}
            >
              <Card.Meta
                title={
                  <div className={styles.taskTitle}>
                    <Title level={5}>{item.title}</Title>
                    <Tag color="green">{item.level}</Tag>
                  </div>
                }
                description={
                  <div className={styles.taskInfo}>
                    <Text type="secondary">{item.content}</Text>
                    <div className={styles.taskPrice}>
                      <Text strong>¥{item.price}</Text>
                    </div>
                  </div>
                }
              />
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
} 