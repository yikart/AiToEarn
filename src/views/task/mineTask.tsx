/*
 * @Author: nevin
 * @Date: 2025-02-27 19:37:08
 * @LastEditTime: 2025-03-02 22:40:53
 * @LastEditors: nevin
 * @Description: 我的任务列表
 */
import { Button, Card, Empty, Spin } from 'antd';
import { useState, useEffect, useRef } from 'react';
import { taskApi } from '@/api/task';
import { UserTask, UserTaskStatus } from '@/api/types/task';
import { Task, TaskDataInfo } from '@@/types/task';
import MineTaskInfo, { MineTaskInfoRef } from './components/mineInfo';
import { WithdrawRef } from './components/withdraw';
import Withdraw from './components/withdraw';
import styles from './mineTask.module.scss';


import bindTaskImg from '@/assets/task/binds.png';
import checkTaskImg from '@/assets/task/waits.png';
import publishTaskImg from '@/assets/task/fabu.png';
import rewardTaskImg from '@/assets/task/jiesuan.png';
import qr1 from '@/assets/task/qr1.png';
import qr2 from '@/assets/task/qr2.png';


const UserTaskStatusNameMap = new Map<UserTaskStatus, string>([
  [UserTaskStatus.DODING, '进行中'],
  [UserTaskStatus.PENDING, '待审核'],
  [UserTaskStatus.APPROVED, '已通过'],
  [UserTaskStatus.REJECTED, '已拒绝'],
  [UserTaskStatus.COMPLETED, '已完成'],
  [UserTaskStatus.CANCELLED, '已取消'],
  [UserTaskStatus.PENDING_REWARD, '待发放奖励'],
  [UserTaskStatus.REWARDED, '已发放奖励'],
]);

export default function Page() {
  const [taskList, setTaskList] = useState<UserTask<Task<TaskDataInfo>>[]>([]);
  const [pageInfo, setPageInfo] = useState({
    pageSize: 10,
    pageNo: 1,
    totalCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      setLoading(true);
      try {
        const tasks = await taskApi.getMineTaskList(pageInfo);
        setTaskList(tasks.items);
        setPageInfo(prev => ({
          ...prev,
          totalCount: tasks.totalCount,
        }));
      } catch (error) {
        console.error('获取任务列表失败', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, []);

  const Ref_MineTaskInfo = useRef<MineTaskInfoRef>(null);
  const Ref_Withdraw = useRef<WithdrawRef>(null);

  async function withdraw(task: UserTask<Task<TaskDataInfo>>) {
    Ref_Withdraw.current?.init(task);
  }

  // 渲染空状态
  const renderEmptyState = () => {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyText}>
          <h3>接单前请务必先浏览《接单须知与常见问题解答》</h3>
          <p>所有关于接单的秘诀都在这里，请不要错过</p>
        </div>
        
        <div className={styles.guideContainer}>
          <div className={styles.guideStep}>
            <h4>接单前完成以下步骤，接单快人一步</h4>
            
            <div className={styles.qrCodeContainer}>
              <div className={styles.qrCodeItem}>
                <div className={styles.qrCodeWrapper}>
                  <img src={qr1} alt="扫码加入账号招募群" className={styles.qrCode} />
                </div>
                <p className={styles.qrCodeText}>扫码加入账号招募群</p>
                <p className={styles.qrCodeSubtext}>不可在群内天打扰他人</p>
              </div>
              
              <div className={styles.qrCodeItem}>
                <div className={styles.qrCodeWrapper}>
                  <img src={qr2} alt="扫码开启更多权益" className={styles.qrCode} />
                </div>
                <p className={styles.qrCodeText}>扫码开启更多权益</p>
                <p className={styles.qrCodeSubtext}>手机发文付打款通知</p>
              </div>
            </div>
          </div>
          
          <div className={styles.processContainer}>
            <h4 className={styles.processTitle}>接单流程</h4>
            
            <div className={styles.processSteps}>
              <div className={styles.processStep}>
                <div className={styles.processIcon}>
                  <img src={bindTaskImg} alt="前往管理中心绑定账号" className={styles.stepIcon} />
                </div>
                <p className={styles.stepText}>前往管理中心绑定账号</p>
              </div>
              
              <div className={styles.processDivider}></div>
              
              <div className={styles.processStep}>
                <div className={styles.processIcon}>
                  <img src={checkTaskImg} alt="等待平台验证通过" className={styles.stepIcon} />
                </div>
                <p className={styles.stepText}>等待平台验证通过</p>
              </div>
              
              <div className={styles.processDivider}></div>
              
              <div className={styles.processStep}>
                <div className={styles.processIcon}>
                  <img src={publishTaskImg} alt="一键发文" className={styles.stepIcon} />
                </div>
                <p className={styles.stepText}>一键发文</p>
              </div>
              
              <div className={styles.processDivider}></div>
              
              <div className={styles.processStep}>
                <div className={styles.processIcon}>
                  <img src={rewardTaskImg} alt="成功发文等待结算" className={styles.stepIcon} />
                </div>
                <p className={styles.stepText}>成功发文等待结算</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.mineTaskContainer}>
      <MineTaskInfo ref={Ref_MineTaskInfo} />
      <Withdraw ref={Ref_Withdraw} />
      
      {loading ? (
        <div className={styles.loadingContainer}>
          <Spin size="large" />
        </div>
      ) : taskList.length > 10 ? (
        <div className={styles.taskGrid}>
          {taskList.map((task) => (
            <Card
              key={task.id}
              className={styles.taskCard}
              title={
                <div className={styles.cardTitle}>
                  <span>{task.taskId.title}</span>
                  <span className={styles.taskStatus}>
                    {UserTaskStatusNameMap.get(task.status)}
                  </span>
                </div>
              }
            >
              <div className={styles.cardContent}>
                <div className={styles.taskInfo}>
                  <p className={styles.taskDescription}>{task.taskId.description}</p>
                  <div className={styles.taskDetails}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>接受时间:</span>
                      <span className={styles.detailValue}>{task.createTime}</span>
                    </div>
                    {task.submissionTime && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>提交时间:</span>
                        <span className={styles.detailValue}>{task.submissionTime}</span>
                      </div>
                    )}
                    {task.rewardTime && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>完成时间:</span>
                        <span className={styles.detailValue}>{task.rewardTime}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className={styles.taskActions}>
                  {task.status === UserTaskStatus.DODING && (
                    <Button
                      type="primary"
                      className={styles.actionButton}
                      onClick={() => Ref_MineTaskInfo.current?.init(task)}
                    >
                      去完成
                    </Button>
                  )}

                  {task.status === UserTaskStatus.APPROVED && (
                    <Button 
                      type="primary" 
                      className={styles.actionButton}
                      onClick={() => withdraw(task)}
                    >
                      提现
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        renderEmptyState()
      )}
    </div>
  );
}
