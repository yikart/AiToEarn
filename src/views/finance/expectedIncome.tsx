import { Card, List, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { taskApi } from '@/api/task';
import { UserTask, UserTaskStatus } from '@/api/types/task';
import { Task, TaskDataInfo } from 'commont/types/task';

const { Text } = Typography;

export default function ExpectedIncome() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<UserTask<Task<TaskDataInfo>>[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const getExpectedIncomeList = async () => {
    try {
      setLoading(true);
      const params = {
        pageSize: pagination.pageSize,
        pageNo: pagination.current,
        status: UserTaskStatus.APPROVED
      };
      const res = await taskApi.getMineTaskList(params);
      console.log('getExpectedIncomeList', 'res', res);
      setList(res.items || []);
      setPagination(prev => ({
        ...prev,
        current: res.meta.currentPage || 1,
        pageSize: res.meta.itemsPerPage || 10,
        total: res.meta.totalItems || 0
      }));
    } catch (error) {
      console.error('获取预计收入列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getExpectedIncomeList();
  }, [pagination.current]);

  return (
    <Card title="预计收入列表" bordered={false}>
      <List
        loading={loading}
        dataSource={list}
        pagination={{
          ...pagination,
          onChange: (page) => {
            setPagination(prev => ({ ...prev, current: page }));
          },
        }}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Text key="amount" type="secondary">
                金额: ¥{(typeof item.taskId === 'string' ? 0 : item.taskId.reward)?.toFixed(2)}
              </Text>,
            ]}
          >
            <List.Item.Meta
              title={
                <div className="flex items-center">
                  <Text>
                    {typeof item.taskId === 'string' 
                      ? '未知任务' 
                      : item.taskId.title || '未知任务'}
                  </Text>
                  <Tag color="processing" className="ml-2">
                    已批准
                  </Tag>
                </div>
              }
              description={
                <div>
                  <Text type="secondary">
                    任务ID: {typeof item.taskId === 'string' ? item.taskId : item.taskId.id}
                  </Text>
                  <br />
                  <Text type="secondary">
                    创建时间: {new Date(item.createTime).toLocaleString()}
                  </Text>
                  {item.verificationNote && (
                    <>
                      <br />
                      <Text type="warning" className="text-orange-500">
                        审核建议: {item.verificationNote}
                      </Text>
                    </>
                  )}
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
} 