import React, { useState } from 'react';
import { Card, Input, Button, Progress, message, List, Space, Typography } from 'antd';
import { SendOutlined, HistoryOutlined, DeleteOutlined } from '@ant-design/icons';
import EnhancedCard from '../EnhancedCard';
import styles from './aiCommentManager.module.scss';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface CommentRecord {
  id: string;
  subject: string;
  prompt: string;
  result: string;
  timestamp: number;
}

const AiCommentManager: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentResult, setCurrentResult] = useState('');
  const [history, setHistory] = useState<CommentRecord[]>([]);

  const handleGenerate = async () => {
    if (!subject.trim()) {
      message.warning('请输入评论主旨');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setCurrentResult('');

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // 调用AI生成评论API (需要通过electron ipc)
      const result = await window.ipcRenderer.invoke('ai-generate-comment', {
        subject: subject.trim(),
        prompt: prompt.trim() || '请为以下内容生成一条友善、自然的评论',
        max: 100
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (result) {
        setCurrentResult(result);
        
        // 添加到历史记录
        const newRecord: CommentRecord = {
          id: Date.now().toString(),
          subject: subject.trim(),
          prompt: prompt.trim() || '默认提示词',
          result,
          timestamp: Date.now()
        };
        
        setHistory(prev => [newRecord, ...prev.slice(0, 9)]); // 保留最近10条
        message.success('评论生成成功！');
      } else {
        message.error('评论生成失败，请重试');
      }
    } catch (error) {
      console.error('生成评论失败:', error);
      message.error('评论生成失败，请重试');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const handleCopyResult = () => {
    if (currentResult) {
      navigator.clipboard.writeText(currentResult);
      message.success('已复制到剪贴板');
    }
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    message.success('删除成功');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className={styles.aiCommentManager}>
      <Title level={3} className={styles.title}>AI评论管理</Title>
      
      <div className={styles.content}>
        <div className={styles.inputSection}>
          <EnhancedCard className={styles.inputCard}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Text strong>评论主旨</Text>
                <Input
                  placeholder="请输入评论的主要内容或话题"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isGenerating}
                  className={styles.input}
                />
              </div>
              
              <div>
                <Text strong>提示词</Text>
                <TextArea
                  placeholder="请输入生成评论的提示词（可选，留空使用默认提示词）"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isGenerating}
                  rows={3}
                  className={styles.textarea}
                />
              </div>
              
              {isGenerating && (
                <div className={styles.progressSection}>
                  <Text>正在生成评论...</Text>
                  <Progress 
                    percent={progress} 
                    strokeColor={{
                      '0%': '#667eea',
                      '100%': '#764ba2',
                    }}
                    className={styles.progress}
                  />
                </div>
              )}
              
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleGenerate}
                loading={isGenerating}
                size="large"
                className={styles.generateBtn}
              >
                {isGenerating ? '生成中...' : '生成评论'}
              </Button>
            </Space>
          </EnhancedCard>
        </div>

        <div className={styles.resultSection}>
          {currentResult && (
            <EnhancedCard className={styles.resultCard}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Text strong>生成结果</Text>
                <div className={styles.resultContent}>
                  <Text>{currentResult}</Text>
                </div>
                <Button onClick={handleCopyResult} className={styles.copyBtn}>
                  复制结果
                </Button>
              </Space>
            </EnhancedCard>
          )}
        </div>

        <div className={styles.historySection}>
          <EnhancedCard className={styles.historyCard}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div className={styles.historyHeader}>
                <HistoryOutlined />
                <Text strong>评论历史</Text>
              </div>
              
              {history.length === 0 ? (
                <Text type="secondary">暂无评论记录</Text>
              ) : (
                <List
                  dataSource={history}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button
                          type="text"
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteHistory(item.id)}
                          size="small"
                        >
                          删除
                        </Button>
                      ]}
                      className={styles.historyItem}
                    >
                      <div className={styles.historyContent}>
                        <div className={styles.historyMeta}>
                          <Text strong>主旨:</Text> <Text>{item.subject}</Text>
                          <br />
                          <Text type="secondary">{formatTime(item.timestamp)}</Text>
                        </div>
                        <div className={styles.historyResult}>
                          <Text>{item.result}</Text>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              )}
            </Space>
          </EnhancedCard>
        </div>
      </div>
    </div>
  );
};

export default AiCommentManager;