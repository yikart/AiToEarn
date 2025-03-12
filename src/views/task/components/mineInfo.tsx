/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:35
 * @LastEditTime: 2025-03-03 18:05:09
 * @LastEditors: nevin
 * @Description: 用户任务信息
 */
import { Button, Modal, Form, Input, Upload, message, Tag, Divider, Space, Tooltip } from 'antd';
import {
  Task,
  TaskProduct,
  TaskPromotion,
  TaskStatusName,
  TaskTypeName,
  TaskVideo,
} from '@@/types/task';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { taskApi } from '@/api/task';
import { UserTask, UserTaskStatus } from '@/api/types/task';
import styles from './mineInfo.module.scss';
import { 
  UploadOutlined, 
  LinkOutlined, 
  QrcodeOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  PictureOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const FILE_BASE_URL = import.meta.env.VITE_APP_FILE_HOST;
const VITE_APP_URL = import.meta.env.VITE_APP_URL;

export interface MineTaskInfoRef {
  init: (
    inData: UserTask<Task<TaskProduct | TaskPromotion | TaskVideo>>,
  ) => Promise<void>;
}

// 可以提交的任务状态
const SUBMITTABLE_STATUSES = [
  UserTaskStatus.DODING,
  UserTaskStatus.REJECTED
];

const Com = forwardRef<MineTaskInfoRef>((props: any, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mineTaskInfo, setMineTaskInfo] = useState<UserTask<
    Task<TaskProduct | TaskPromotion | TaskVideo>
  > | null>();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  async function init(
    inData: UserTask<Task<TaskProduct | TaskPromotion | TaskVideo>>,
  ) {
    setMineTaskInfo(inData);
    setIsModalOpen(true);
    
    // 重置表单
    form.resetFields();
    setFileList([]);
    
    // 如果有已提交的数据，填充表单
    if (inData.submissionUrl || inData.qrCodeScanResult || inData.screenshotUrls?.length) {
      form.setFieldsValue({
        submissionUrl: inData.submissionUrl || '',
        qrCodeScanResult: inData.qrCodeScanResult || '',
      });
      
      if (inData.screenshotUrls?.length) {
        const initialFileList = inData.screenshotUrls.map((url, index) => ({
          uid: `-${index}`,
          name: `截图${index + 1}.jpg`,
          status: 'done',
          url: url.startsWith('http') ? url : `${FILE_BASE_URL}/${url}`,
        }));
        setFileList(initialFileList);
      }
    }
  }

  useImperativeHandle(ref, () => ({
    init: init,
  }));

  async function taskDone() {
    if (!mineTaskInfo) return;
    
    try {
      await form.validateFields();
      const values = form.getFieldsValue();
      
      setSubmitting(true);
      
      // 处理截图文件
      const screenshotUrls = fileList
        .filter(file => file.status === 'done')
        .map(file => file.url || file.response?.url);
      
      const doneInfo = {
        submissionUrl: values.submissionUrl,
        qrCodeScanResult: values.qrCodeScanResult,
        screenshotUrls,
      };
      
      const res = await taskApi.taskDone(mineTaskInfo.id, doneInfo);
      
      setMineTaskInfo({
        ...mineTaskInfo,
        status: res.status, // 更新为待审核
        ...doneInfo, // 更新提交的信息
      });
      
      message.success('任务提交成功！');
      setIsModalOpen(false);
    } catch (error) {
      console.error('提交任务失败', error);
      message.error('提交任务失败，请检查表单并重试');
    } finally {
      setSubmitting(false);
    }
  }

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  
  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '暂无日期';
    return dayjs(dateString).format('YYYY/MM/DD HH:mm');
  };
  
  // 判断任务是否可提交
  const canSubmitTask = () => {
    if (!mineTaskInfo) return false;
    return SUBMITTABLE_STATUSES.includes(mineTaskInfo.status as UserTaskStatus);
  };
  
  // 处理上传图片变化
  const handleUploadChange = ({ fileList }: any) => {
    setFileList(fileList);
  };
  
  // 上传前检查
  const beforeUpload = (file: any) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件!');
    }
    
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片大小不能超过5MB!');
    }
    
    return isImage && isLt5M;
  };

  return (
    <Modal
      title={null}
      open={isModalOpen}
      onCancel={handleCancel}
      footer={null}
      width={800}
      destroyOnClose
      className={styles.taskInfoModal}
    >
      {mineTaskInfo ? (
        <div className={styles.taskInfoContainer}>
          <div className={styles.taskInfoHeader}>
            <h2 className={styles.taskTitle}>
              {mineTaskInfo.taskId?.title || '未知任务'}
              <span className={styles.taskId}>
                订单号: {mineTaskInfo._id}
              </span>
            </h2>
            <Tag 
              color={mineTaskInfo.status === UserTaskStatus.DODING ? 'processing' : 
                    mineTaskInfo.status === UserTaskStatus.PENDING ? 'warning' :
                    mineTaskInfo.status === UserTaskStatus.APPROVED ? 'success' :
                    mineTaskInfo.status === UserTaskStatus.REJECTED ? 'error' : 'default'}
              className={styles.statusTag}
            >
              {mineTaskInfo.status === UserTaskStatus.DODING ? '进行中' : 
               mineTaskInfo.status === UserTaskStatus.PENDING ? '待审核' :
               mineTaskInfo.status === UserTaskStatus.APPROVED ? '已通过' :
               mineTaskInfo.status === UserTaskStatus.REJECTED ? '已拒绝' : '未知状态'}
            </Tag>
          </div>
          
          <div className={styles.taskInfoContent}>
            <div className={styles.taskDetails}>
              <div className={styles.taskDetail}>
                <ClockCircleOutlined className={styles.detailIcon} />
                <span className={styles.detailLabel}>接单时间:</span>
                <span className={styles.detailValue}>{formatDate(mineTaskInfo.createTime)}</span>
              </div>
              
              <div className={styles.taskDetail}>
                <FileTextOutlined className={styles.detailIcon} />
                <span className={styles.detailLabel}>任务类型:</span>
                <span className={styles.detailValue}>
                  {TaskTypeName.get(mineTaskInfo.taskId?.type) || '未知类型'}
                </span>
              </div>
              
              <div className={styles.taskDetail}>
                <DollarOutlined className={styles.detailIcon} />
                <span className={styles.detailLabel}>任务奖励:</span>
                <span className={styles.detailValue}>¥{mineTaskInfo.taskId?.reward || 5}</span>
              </div>
            </div>
            
            <Divider />
            
            <div className={styles.taskDescription}>
              <h3 className={styles.sectionTitle}>任务描述</h3>
              <div 
                className={styles.descriptionContent}
                dangerouslySetInnerHTML={{ __html: mineTaskInfo.taskId?.description || '暂无描述' }}
              />
            </div>
            
            <Divider />
            
            <div className={styles.submissionSection}>
              <h3 className={styles.sectionTitle}>
                提交任务
                {!canSubmitTask() && (
                  <Tooltip title="当前任务状态不允许提交">
                    <InfoCircleOutlined className={styles.infoIcon} />
                  </Tooltip>
                )}
              </h3>
              
              <Form
                form={form}
                layout="vertical"
                disabled={!canSubmitTask() || submitting}
              >
                <Form.Item
                  name="submissionUrl"
                  label="提交链接"
                  rules={[{ required: true, message: '请输入提交链接' }]}
                >
                  <Input 
                    placeholder="请输入任务完成后的链接" 
                    prefix={<LinkOutlined />} 
                  />
                </Form.Item>
                
                <Form.Item
                  name="qrCodeScanResult"
                  label="二维码扫描结果"
                  rules={[{ required: false, message: '请输入二维码扫描结果' }]}
                >
                  <Input 
                    placeholder="请输入二维码扫描结果（如有）" 
                    prefix={<QrcodeOutlined />} 
                  />
                </Form.Item>
                
                <Form.Item
                  name="screenshotUrls"
                  label="任务截图"
                  rules={[{ required: true, message: '请上传任务截图' }]}
                >
                  <Upload
                    listType="picture-card"
                    fileList={fileList}
                    onChange={handleUploadChange}
                    beforeUpload={beforeUpload}
                    action={VITE_APP_URL+"/oss/upload/permanent"}
                    multiple
                    maxCount={5}
                  >
                    {fileList.length >= 5 ? null : (
                      <div>
                        <PictureOutlined />
                        <div style={{ marginTop: 8 }}>上传截图</div>
                      </div>
                    )}
                  </Upload>
                </Form.Item>
                
                <div className={styles.uploadTips}>
                  <p>提示：</p>
                  <ul>
                    <li>请上传清晰的任务完成截图，最多5张</li>
                    <li>图片格式支持JPG、PNG，单张大小不超过5MB</li>
                    <li>截图应包含任务完成的关键信息，如发布内容、评论等</li>
                  </ul>
                </div>
              </Form>
            </div>
          </div>
          
          <div className={styles.taskInfoFooter}>
            <Space>
              <Button onClick={handleCancel}>
                关闭
              </Button>
              {canSubmitTask() && (
                <Button 
                  type="primary" 
                  onClick={taskDone}
                  loading={submitting}
                >
                  提交任务
                </Button>
              )}
            </Space>
          </div>
        </div>
      ) : (
        <div className={styles.noDataContainer}>暂无任务信息</div>
      )}
    </Modal>
  );
});

export default Com;
