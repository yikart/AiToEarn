/*
 * @Author: nevin
 * @Date: 2025-03-03 10:00:00
 * @LastEditTime: 2025-03-03 10:00:00
 * @LastEditors: nevin
 * @Description: 文章任务组件
 */
import { Card, List, Typography, Button, Space, Tag, Spin, Image, Progress, Tooltip, Modal, Descriptions } from 'antd';
import { FileTextOutlined, ClockCircleOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import styles from './task.module.scss';
import { useState, useEffect, useRef } from 'react';
import { taskApi } from '@/api/task';
import { TaskArticle, TaskType, TaskVideo } from '@@/types/task';
import dayjs from 'dayjs';
import { TaskInfoRef } from './components/popInfo';
// import TaskInfo from './components/articleInfo';
import ChooseAccountModule from '@/views/publish/components/ChooseAccountModule/ChooseAccountModule';
import { PubType } from '@@/publish/PublishEnum';
import { AccountType } from '@@/AccountEnum';
import { usePubStroe } from '@/store/pubStroe';
import { useAccountStore } from '@/store/commont';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import {
  icpCreateImgTextPubRecord,
  icpCreatePubRecord,
  icpPubImgText,
} from '@/icp/publish';

// 导入平台图标
import KwaiIcon from '../../assets/svgs/account/ks.svg';
import WxSphIcon from '../../assets/svgs/account/wx-sph.svg';
import XhsIcon from '../../assets/svgs/account/xhs.svg';
import DouyinIcon from '../../assets/svgs/account/douyin.svg';

const { Title, Text } = Typography;

const FILE_BASE_URL = import.meta.env.VITE_APP_FILE_HOST;

// 平台配置
const platformConfig = {
  KWAI: {
    name: '快手',
    icon: KwaiIcon,
    color: '#FF4D4F'
  },
  wxSph: {
    name: '微信视频号',
    icon: WxSphIcon,
    color: '#07C160'
  },
  xhs: {
    name: '小红书',
    icon: XhsIcon,
    color: '#FF2442'
  },
  douyin: {
    name: '抖音',
    icon: DouyinIcon,
    color: '#000000'
  }
};

export default function ArticleTask() {
  const [loading, setLoading] = useState(false);
  const [taskList, setTaskList] = useState<any[]>([]);
  const [pageInfo, setPageInfo] = useState({
    pageNo: 1,
    pageSize: 10,
    totalCount: 0,
  });
  const [hasMore, setHasMore] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [chooseAccountOpen, setChooseAccountOpen] = useState(false);
  const [accountListChoose, setAccountListChoose] = useState<any[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [pubProgressModuleOpen, setPubProgressModuleOpen] = useState(false);
  const navigate = useNavigate();

  const Ref_TaskInfo = useRef<TaskInfoRef>(null);

  async function getTaskList(isLoadMore = false) {
    setLoading(true);
    try {
      const res = await taskApi.getTaskList<any>({
        ...pageInfo,
        type: TaskType.ARTICLE,
      });

      if (isLoadMore) {
        setTaskList((prev) => [...prev, ...res.items]);
      } else {
        setTaskList(res.items);
      }

      setPageInfo((prev) => ({
        ...prev,
        totalCount: (res as any).totalCount,
      }));

      setHasMore(pageInfo.pageNo * pageInfo.pageSize < (res as any).totalCount);
    } catch (error) {
      console.error('获取任务列表失败', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getTaskList();
  }, []);

  const formatDate = (date: string) => {
    return dayjs(date).format('YYYY-MM-DD HH:mm');
  };

  const getPlatformTags = (accountTypes: string[]) => {
    return accountTypes.map(type => {
      const platform = platformConfig[type as keyof typeof platformConfig];
      if (!platform) return null;
      
      return (
        <Tooltip key={type} title={platform.name}>
          <div
            className={styles.platformIconWrapper}
            style={{ backgroundColor: platform.color }}
          >
            <img
              src={platform.icon}
              className={styles.platformIcon}
              alt={platform.name}
            />
          </div>
        </Tooltip>
      );
    });
  };

  const handleJoinTask = (task: any) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  const handleCompleteTask = async () => {
    if (!selectedTask) return;
    setModalVisible(false);
    setChooseAccountOpen(true);
    
    // try {
    //   // 调用完成任务API
    //   await taskApi.taskDone(selectedTask._id, {
    //     // 这里需要根据实际API要求添加必要的参数
    //     // 例如：截图、链接等
    //   });
    //   // 更新任务状态
    //   setTaskList(prev => prev.map(task => 
    //     task._id === selectedTask._id ? { ...task, isAccepted: true } : task
    //   ));
    //   setModalVisible(false);
    // } catch (error) {
    //   console.error('完成任务失败', error);
    // }
  };

  useEffect(() => {
    console.log('accountListChoose', accountListChoose);
    if (accountListChoose.length > 0) {
      pubCore();
    }
  }, [accountListChoose]);

    // 在组件内添加一个新的状态来存储任务记录
    const [taskRecord, setTaskRecord] = useState<{
      _id: string;
      createTime: string;
      isFirstTimeSubmission: boolean;
      status: string;
      taskId: string;
    } | null>(null);


    /**
   * 接受任务
   */
    async function taskApply() {
      if (!selectedTask) return;
  
      try {
        const res: any = await taskApi.taskApply<TaskVideo>(selectedTask?._id);
        // 存储任务记录信息
        if (res.code === 0 && res.data) {
          setTaskRecord(res.data);
          message.success('任务接受成功！');
          
          handleCompleteTask();
  
        } else {
          message.error(res.msg || '接受任务失败，请稍后再试?');
        }
      } catch (error) {
        message.error('接受任务失败，请稍后再试');
      }
    }


    /**
   * 完成任务
   */
    async function taskDone() {
      console.log('完成任务', selectedTask);
      if (!selectedTask || !taskRecord) {
        message.error('任务信息不完整，无法完成任务');
        return;
      }
  
      try {
        // 使用任务记录的 ID 而不是任务 ID
        const res = await taskApi.taskDone(taskRecord._id, {
          submissionUrl: selectedTask.title,
          screenshotUrls: [selectedTask.dataInfo?.imageList?.[0] || ''],
          qrCodeScanResult: selectedTask.title,
        });
        message.success('任务发布成功！');
        refreshTaskList();
      } catch (error) {
        message.error('完成任务失败，请稍后再试');
      }
    }

  const pubCore = async () => {
    if (!selectedTask) return;
    
    setPubProgressModuleOpen(true);
    setLoading(true);
    const err = () => {
      setLoading(false);
      message.error('网络繁忙，请稍后重试！');
    };

    // 创建一级记录
    const recordRes = await icpCreatePubRecord({
      title: selectedTask.title,
      desc: selectedTask.description.replace(/<[^>]+>/g, ''),
      type: PubType.ImageText,
      coverPath: FILE_BASE_URL + (selectedTask.dataInfo?.imageList?.[0] || ''),
    });
    if (!recordRes) return err();

    let pubList = [];
    if (selectedTask.dataInfo?.imageList?.length > 1) {
      pubList = selectedTask.dataInfo?.imageList.map((v: string) => FILE_BASE_URL + v);
    }

    console.log('pubList', pubList);
    console.log(accountListChoose);

    for (const account of accountListChoose) {
      
      // 创建二级记录
      await icpCreateImgTextPubRecord({
        title: selectedTask.title,
        desc: selectedTask.description.replace(/<[^>]+>/g, ''),
        type: account.type,
        accountId: account.id,
        pubRecordId: recordRes.id,
        publishTime: new Date(),
        coverPath: FILE_BASE_URL + (selectedTask.dataInfo?.imageList?.[0] || ''),
        imagesPath: pubList,
      });
    }

    const okRes = await icpPubImgText(recordRes.id);

    if (okRes.length > 0) {
      taskDone();
    }


    setLoading(false);
    setPubProgressModuleOpen(false);
    usePubStroe.getState().clearImgTextPubSave();
    const successList = okRes.filter((v) => v.code === 1);
    useAccountStore.getState().notification!.open({
      message: '发布结果',
      description: (
        <>
          一共发布 {okRes.length} 条数据，成功 {successList.length} 条，失败{' '}
          {okRes.length - successList.length} 条
        </>
      ),
      showProgress: true,
      actions: [
        <Button
          key="view"
          type="primary"
          size="small"
          onClick={() => {
            navigate('/publish/pubRecord');
          }}
        >
          查看发布记录
        </Button>
      ],
      key: Date.now(),
    });
  };

  // 刷新任务列表的函数
  const refreshTaskList = () => {
    setPageInfo({
      pageSize: 10,
      pageNo: 1,
      totalCount: 0,
    });
    getTaskList();
  };

  return (
    <div className={styles.taskList}>
      {/* <TaskInfo ref={Ref_TaskInfo} onTaskApplied={refreshTaskList} /> */}

      <ChooseAccountModule
        open={chooseAccountOpen}
        onClose={() => !downloading && setChooseAccountOpen(false)}
        platChooseProps={{
          choosedAccounts: accountListChoose,
          pubType: PubType.ImageText,
          allowPlatSet: new Set(
            ["KWAI", "wxSph", "xhs", "douyin"]
          ) as any,
        }}
        onPlatConfirm={async (aList) => {
          console.log('账号:', aList);
          setAccountListChoose(aList);
          setChooseAccountOpen(false);
          // setTimeout(async () => {
            // await pubCore();
          // }, 2000);
        }}
      />

      <Spin spinning={loading}>
        <List
          grid={{ gutter: 16, column: 3 }}
          dataSource={taskList}
          renderItem={(item) => (
            <List.Item>
              <Card
                className={styles.taskCard}
                cover={
                  <div className={styles.taskImage}>
                    {item.dataInfo?.imageList?.[0] ? (
                      <Image
                        src={`${FILE_BASE_URL}/${item.dataInfo.imageList[0]}`}
                        alt={item.title}
                        preview={false}
                        style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                      />
                    ) : (
                      <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                    )}
                  </div>
                }
                actions={[
                  <Space key="recruits">
                    <UserOutlined />
                    <Text>{item.currentRecruits}/{item.maxRecruits}</Text>
                  </Space>,
                  <Space key="time">
                    <ClockCircleOutlined />
                    <Text>{item.keepTime}分钟</Text>
                  </Space>,
                  <Button 
                    type="primary" 
                    key="join" 
                    disabled={item.isAccepted}
                    onClick={() => handleJoinTask(item)}
                  >
                    {item.isAccepted ? '已参与' : '参与任务'}
                  </Button>,
                ]}
              >
                <Card.Meta
                  title={
                    <div className={styles.taskTitle}>
                      <Title level={5}>{item.title}</Title>
                      <Space>
                        <Tag color="green">¥{item.reward}</Tag>
                        <Space size={4}>
                          {getPlatformTags(item.accountTypes)}
                        </Space>
                      </Space>
                    </div>
                  }
                  description={
                    <div className={styles.taskInfo}>
                      <div className={styles.taskProgress}>
                        <Progress 
                          percent={Math.round((item.currentRecruits / item.maxRecruits) * 100)} 
                          size="small" 
                          showInfo={false}
                        />
                      </div>
                      <Text type="secondary">
                        {item.description.replace(/<[^>]+>/g, '')}
                      </Text>
                      <div className={styles.taskDeadline}>
                        <Text type="secondary">截止时间：{formatDate(item.deadline)}</Text>
                      </div>
                    </div>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      </Spin>

      <Modal
        title="任务详情"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            取消
          </Button>,
          <Button 
            key="complete" 
            type="primary" 
            icon={<CheckCircleOutlined />}
            onClick={taskApply}
          >
            一键完成
          </Button>
        ]}
        width={600}
      >
        {selectedTask && (
          <div className={styles.taskDetail}>
            <Descriptions column={1}>
              <Descriptions.Item label="任务标题">{selectedTask.title}</Descriptions.Item>
              <Descriptions.Item label="任务描述">
                <div dangerouslySetInnerHTML={{ __html: selectedTask.description }} />
              </Descriptions.Item>
              <Descriptions.Item label="任务奖励">¥{selectedTask.reward}</Descriptions.Item>
              <Descriptions.Item label="任务时长">{selectedTask.keepTime}分钟</Descriptions.Item>
              <Descriptions.Item label="开始时间">{formatDate(selectedTask.createTime)}</Descriptions.Item>
              <Descriptions.Item label="截止时间">{formatDate(selectedTask.deadline)}</Descriptions.Item>
              <Descriptions.Item label="参与人数">
                {selectedTask.currentRecruits}/{selectedTask.maxRecruits}
              </Descriptions.Item>
              <Descriptions.Item label="支持平台">
                <Space size={4}>
                  {getPlatformTags(selectedTask.accountTypes)}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
} 