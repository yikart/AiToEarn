"use client";

import React, { useState, useEffect } from "react";
import { Tabs, Card, Button, List, Tag, message, Spin, Empty, Modal, Input, Row, Col, Image, Tooltip } from "antd";
import { CheckOutlined, ClockCircleOutlined, PlayCircleOutlined, UploadOutlined, EyeOutlined } from "@ant-design/icons";
import { useTransClient } from "@/app/i18n/client";
import { useUserStore } from "@/store/user";
import { 
  apiGetTaskOpportunityList, 
  apiGetUserTaskList, 
  apiAcceptTask, 
  apiSubmitTask,
  TaskOpportunity,
  UserTask
} from "@/api/task";
import { apiCreatePublish } from "@/api/plat/publish";
import { AccountPlatInfoMap, PlatType } from "@/app/config/platConfig";
import { getOssUrl } from "@/utils/oss";
// import { getAppDownloadConfig, getTasksRequiringApp } from "@/app/config/appDownloadConfig";
// import DownloadAppModal from "@/components/common/DownloadAppModal";
import styles from "./taskPageCore.module.scss";

const { TabPane } = Tabs;

export default function TaskPageCore() {
  const { t } = useTransClient("common");
  const token = useUserStore((state) => state.token);
  
  // 如果未登录，显示登录提示
  if (!token) {
    return (
      <div className={styles.taskPage}>
        <div className={styles.header}>
          <h1>任务中心</h1>
          <p>请先登录以查看任务</p>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Empty description="请先登录" />
        </div>
      </div>
    );
  }
  
  // 状态管理
  const [activeTab, setActiveTab] = useState("pending"); // pending: 待接受, accepted: 已接受
  const [pendingTasks, setPendingTasks] = useState<TaskOpportunity[]>([]);
  const [acceptedTasks, setAcceptedTasks] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskOpportunity | null>(null);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);
  
  // 下载App弹窗状态 - 暂时注释
  // const [downloadAppVisible, setDownloadAppVisible] = useState(false);
  // const [downloadAppConfig, setDownloadAppConfig] = useState({
  //   platform: "",
  //   appName: "",
  //   downloadUrl: "",
  //   qrCodeUrl: "" as string | undefined
  // });

  // 获取待接受任务列表
  const fetchPendingTasks = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await apiGetTaskOpportunityList({ page: 1, pageSize: 20 });
      if (response && response.data) {
        setPendingTasks(response.data.list || []);
      } else {
        setPendingTasks([]);
      }
    } catch (error) {
      console.error("获取待接受任务失败:", error);
      message.error("获取待接受任务失败");
      setPendingTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // 获取已接受任务列表
  const fetchAcceptedTasks = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await apiGetUserTaskList({ page: 1, pageSize: 20 });
      if (response && response.data) {
        setAcceptedTasks(response.data.list || []);
      } else {
        setAcceptedTasks([]);
      }
    } catch (error) {
      console.error("获取已接受任务失败:", error);
      message.error("获取已接受任务失败");
      setAcceptedTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // 接受任务
  const handleAcceptTask = async (task: any ) => {
    // 暂时简化，直接接受任务
    await doAcceptTask(task);
    
    // TODO: 添加平台限制检查
    // if (!task.accountTypes || task.accountTypes.length === 0) {
    //   // 没有账号类型限制，直接接取任务
    //   await doAcceptTask(task);
    //   return;
    // }

    // // 检查需要App操作的平台
    // const appRequiredPlatforms = getTasksRequiringApp(task.accountTypes);
    
    // if (appRequiredPlatforms.length > 0) {
    //   // 有需要App操作的平台，显示第一个平台的下载提示
    //   const firstPlatform = appRequiredPlatforms[0];
    //   const config = getAppDownloadConfig(firstPlatform);
      
    //   if (config) {
    //     setDownloadAppConfig({
    //       platform: config.platform,
    //       appName: config.appName,
    //       downloadUrl: config.downloadUrl,
    //       qrCodeUrl: config.qrCodeUrl
    //     });
    //     setDownloadAppVisible(true);
    //     return;
    //   }
    // }
    
    // // 其他任务类型正常接取
    // await doAcceptTask(task);
  };

  // 执行接受任务
  const doAcceptTask = async (task: TaskOpportunity) => {
    try {
      const response = await apiAcceptTask(task.id);
      if (response && response.code === 0) {
        message.success("接受任务成功！");
        // 刷新任务列表
        fetchPendingTasks();
        fetchAcceptedTasks();
        // 切换到已接受任务标签
        setActiveTab("accepted");
      } else {
        message.error("接受任务失败");
      }
    } catch (error) {
      message.error("接受任务失败");
      console.error("接受任务失败:", error);
    }
  };

  // 提交任务
  const handleSubmitTask = async (userTask: UserTask) => {
    setSelectedTask(userTask as any);
    setSubmissionUrl("");
    setSubmitModalVisible(true);
  };

  // 确认提交任务
  const confirmSubmitTask = async () => {
    if (!selectedTask || !submissionUrl.trim()) {
      message.error("请输入提交链接");
      return;
    }

    try {
      setSubmittingTaskId(selectedTask.id);
      
      // 先发布任务
      const publishResponse = await apiCreatePublish({
        flowId: selectedTask.id,
        type: 'video' as any, // 根据任务类型设置
        accountId: selectedTask.accountId,
        accountType: selectedTask.accountType as any,
        desc: `任务提交: ${selectedTask.taskId}`,
        title: `任务提交`,
        topics: [],
        option: {}
      });

      if (publishResponse && publishResponse.code === 0) {
        // 发布成功后提交任务
        const submitResponse = await apiSubmitTask(selectedTask.id, submissionUrl);
        if (submitResponse && submitResponse.code === 0) {
          message.success("任务提交成功！");
          setSubmitModalVisible(false);
          fetchAcceptedTasks();
        } else {
          message.error("任务提交失败");
        }
      } else {
        message.error("发布任务失败");
      }
    } catch (error) {
      message.error("任务提交失败");
      console.error("任务提交失败:", error);
    } finally {
      setSubmittingTaskId(null);
    }
  };

  // 获取平台显示名称
  const getPlatformName = (type: string) => {
    const platformNames: Record<string, string> = {
      'tiktok': 'TikTok',
      'youtube': 'YouTube', 
      'twitter': 'Twitter',
      'bilibili': '哔哩哔哩',
      'KWAI': '快手',
      'douyin': '抖音',
      'xhs': '小红书',
      'wxSph': '微信视频号',
      'wxGzh': '微信公众号',
      'facebook': 'Facebook',
      'instagram': 'Instagram',
      'threads': 'Threads',
      'pinterest': 'Pinterest',
    };
    return platformNames[type] || type;
  };

  // 获取任务类型显示名称
  const getTaskTypeName = (type: string) => {
    const taskTypeNames: Record<string, string> = {
      'video': '视频',
      'article': '图文',
      'article2': '纯文字',
    };
    return taskTypeNames[type] || type;
  };

  // 格式化时间
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  // 获取任务状态标签
  const getTaskStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      'pending': { color: 'orange', text: '待接受' },
      'accepted': { color: 'blue', text: '已接受' },
      'completed': { color: 'green', text: '已完成' },
      'rejected': { color: 'red', text: '已拒绝' },
    };
    return statusMap[status] || { color: 'default', text: status };
  };

  useEffect(() => {
    // if (token) {
    //   fetchPendingTasks();
    //   fetchAcceptedTasks();
    // }
  }, [token]);

  return (
    <div className={styles.taskPage}>
      {/* <div className={styles.header}>
        <h1>任务中心</h1>
        <p>接受任务，完成任务，获得奖励</p>
      </div> */}

      {/* <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className={styles.tabs}
      >
        <TabPane 
          tab={
            <span>
              <ClockCircleOutlined />
              待接受任务
            </span>
          } 
          key="pending"
        >
          <Spin spinning={loading}>
            {pendingTasks.length > 0 ? (
              <List
                dataSource={pendingTasks}
                renderItem={(task: any) => (
                  <List.Item>
                    <Card className={styles.taskCard}>
                      <div className={styles.taskHeader}>
                        <h3>{task.title}</h3>
                        <Tag color="orange">待接受</Tag>
                      </div>
                      <div className={styles.taskContent}>
                        <p><strong>描述：</strong>
                          {task.description ? (
                            <div dangerouslySetInnerHTML={{ __html: task.description }} />
                          ) : (
                            <span>暂无描述</span>
                          )}
                        </p>
                        <p><strong>奖励：</strong>¥{task.reward || 0}</p>
                        <p><strong>任务类型：</strong>
                          <Tag color="blue" style={{ marginLeft: '4px' }}>
                            {getTaskTypeName(task.type || 'video')}
                          </Tag>
                        </p>
                        {task.accountTypes && task.accountTypes.length > 0 && (
                          <p><strong>账号类型：</strong>
                            {task.accountTypes.map((type: string) => (
                              <Tag key={type} style={{ marginLeft: '4px' }}>
                                {getPlatformName(type)}
                              </Tag>
                            ))}
                          </p>
                        )}
                        
                        {task.materials && task.materials.length > 0 && (
                          <div style={{ marginTop: '16px' }}>
                            <p><strong>任务素材：</strong></p>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {task.materials.map((material: any, index: number) => (
                                <div key={index} style={{ 
                                  border: '1px solid #e8e8e8', 
                                  borderRadius: '8px', 
                                  padding: '8px',
                                  maxWidth: '200px'
                                }}>
                                  <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                                    {material.title}
                                  </div>
                                  {material.coverUrl && (
                                    <img
                                      src={getOssUrl(material.coverUrl)}
                                      alt="cover"
                                      style={{
                                        width: '100%',
                                        height: '100px',
                                        objectFit: 'cover',
                                        borderRadius: '4px',
                                        marginBottom: '4px'
                                      }}
                                    />
                                  )}
                                  <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.3' }}>
                                    {material.desc?.substring(0, 50)}{material.desc?.length > 50 ? '...' : ''}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={styles.taskActions}>
                        <Button 
                          type="primary" 
                          onClick={() => handleAcceptTask(task)}
                          icon={<CheckOutlined />}
                        >
                          接受任务
                        </Button>
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无待接受任务" />
            )}
          </Spin>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <PlayCircleOutlined />
              已接受任务
            </span>
          } 
          key="accepted"
        >
          <Spin spinning={loading}>
            {acceptedTasks.length > 0 ? (
              <List
                dataSource={acceptedTasks}
                renderItem={(task: any) => (
                  <List.Item>
                    <Card className={styles.taskCard}>
                      <div className={styles.taskHeader}>
                        <h3>{task.taskId}</h3>
                        <Tag color={getTaskStatusTag(task.status).color}>
                          {getTaskStatusTag(task.status).text}
                        </Tag>
                      </div>
                      <div className={styles.taskContent}>
                        <p><strong>账号类型：</strong>
                          <Tag color="blue" style={{ marginLeft: '4px' }}>
                            {getPlatformName(task.accountType)}
                          </Tag>
                        </p>
                        <p><strong>奖励：</strong>¥{task.reward}</p>
                        <p><strong>保持时间：</strong>{task.keepTime}秒</p>
                        {task.submissionUrl && (
                          <p><strong>提交链接：</strong>
                            <a href={task.submissionUrl} target="_blank" rel="noopener noreferrer">
                              {task.submissionUrl}
                            </a>
                          </p>
                        )}
                      </div>
                      <div className={styles.taskActions}>
                        {task.status === 'accepted' && (
                          <Button 
                            type="primary" 
                            onClick={() => handleSubmitTask(task)}
                            icon={<UploadOutlined />}
                          >
                            提交任务
                          </Button>
                        )}
                        {task.submissionUrl && (
                          <Tooltip title="查看提交内容">
                            <Button 
                              icon={<EyeOutlined />}
                              onClick={() => window.open(task.submissionUrl, '_blank')}
                            >
                              查看
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无已接受任务" />
            )}
          </Spin>
        </TabPane>
      </Tabs> */}

      {/* 提交任务弹窗 */}
      {/* <Modal
        title="提交任务"
        open={submitModalVisible}
        onCancel={() => setSubmitModalVisible(false)}
        onOk={confirmSubmitTask}
        confirmLoading={submittingTaskId !== null}
        okText="确认提交"
        cancelText="取消"
      >
        <div style={{ marginBottom: '16px' }}>
          <label>提交链接：</label>
          <Input
            value={submissionUrl}
            onChange={(e) => setSubmissionUrl(e.target.value)}
            placeholder="请输入任务完成后的链接"
            style={{ marginTop: '8px' }}
          />
        </div>
        <p style={{ color: '#666', fontSize: '12px' }}>
          请确保您已经完成了任务要求，并提供了正确的提交链接。
        </p>
      </Modal> */}

      {/* 下载App提示弹窗 */}
      {/* <DownloadAppModal
        visible={downloadAppVisible}
        onClose={() => setDownloadAppVisible(false)}
        platform={downloadAppConfig.platform}
        appName={downloadAppConfig.appName}
        downloadUrl={downloadAppConfig.downloadUrl}
        qrCodeUrl={downloadAppConfig.qrCodeUrl}
      /> */}
    </div>
  );
}
