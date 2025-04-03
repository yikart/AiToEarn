/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-03-25 16:01:56
 * @LastEditors: nevin
 * @Description: 互动页面 interaction
 */
import { WorkData } from '@/icp/reply';
import { Button, Col, Popconfirm, Row, Tabs, Tooltip } from 'antd';
import { useCallback, useRef, useState } from 'react';
import AccountSidebar from '../account/components/AccountSidebar/AccountSidebar';
import {
  AliwangwangOutlined,
  FieldTimeOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import InteractionOneKey, {
  InteractionOneKeyRef,
} from './components/oneKeyInteraction';
import { getCommentSearchNotes, icpInteractionOneData } from '@/icp/replyother';

export default function Page() {
  const [wordList, setWordList] = useState<WorkData[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<number>(-1);
  const [pageInfo, setPageInfo] = useState<{
    count: number;
    hasMore: boolean;
    pcursor?: string;
  }>({
    count: 0,
    hasMore: false,
  });
  const Ref_InteractionOneKey = useRef<InteractionOneKeyRef>(null);

  async function getCreatorList(accountId: number) {
    const res = await getCommentSearchNotes(accountId, '英雄杀道一', {
      ...pageInfo,
      postFirstId: '',
    });

    console.log('---- res  ----', res);

    setWordList(res.list);
  }

  /**
   * 单个作品互动
   */
  async function interactionOneData(works: WorkData) {
    const res = await icpInteractionOneData(activeAccountId, works, {
      commentContent: '不错啊!点赞点赞!',
    });
    console.log('----- res ---', res);
  }

  /**
   * TODO:打开创建自动任务
   * @param data
   */
  function openAddAutoRun(data: WorkData) {}

  return (
    <div>
      <AccountSidebar
        activeAccountId={activeAccountId}
        onAccountChange={useCallback((info) => {
          setWordList([]);
          setActiveAccountId(info.id);
          getCreatorList(info.id);
        }, [])}
      />

      <div className="w-full p-4 text-gray-500">
        <Tabs defaultActiveKey="1" className="w-full">
          <Tabs.TabPane tab="作品列表" key="1">
            <Popconfirm
              title="确认进行一键互动"
              onConfirm={(e?: React.MouseEvent<HTMLElement>) => {
                Ref_InteractionOneKey.current?.init(activeAccountId, wordList);
              }}
              okText="是"
              cancelText="否"
            >
              <AliwangwangOutlined />
            </Popconfirm>

            {activeAccountId === -1 ? (
              <div className="flex items-center justify-center h-[300px]">
                <Tooltip title="请先在左侧侧边栏选择账户">
                  <QuestionCircleOutlined className="mr-2 text-3xl" />
                </Tooltip>
                请选择账户
              </div>
            ) : (
              <div className="grid grid-cols-5 p-4 account-con bg-slate-300">
                {wordList.map((item) => (
                  <div
                    className="bg-white w-[200px] h-[200px] border border-gray-300 p-4 rounded-lg hover:shadow-lg transition-shadow duration-300 m-4"
                    key={item.dataId}
                  >
                    <Row>
                      <Col span={12}>
                        <div className="w-[100px] h-[200px]">
                          <img
                            alt="example"
                            src={item.coverUrl}
                            className="object-cover w-full h-full rounded"
                          />
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="flex flex-col h-full">
                          <p className="mb-2">{item.title || '无标题'}</p>
                          <div className="w-full mt-auto">
                            <Row justify="space-evenly">
                              <Col span={8}></Col>
                              <Col span={8}></Col>
                            </Row>

                            <Row justify="space-evenly">
                              <Col span={8}>
                                <Tooltip title="一键评论"></Tooltip>
                              </Col>
                              <Col span={8}>
                                <Tooltip title="自动评论">
                                  <FieldTimeOutlined
                                    onClick={() => interactionOneData(item)}
                                  />
                                </Tooltip>
                              </Col>
                            </Row>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                ))}
              </div>
            )}

            {wordList.length > 0 && (
              <p className="text-center">
                <Button
                  type="link"
                  onClick={() => getCreatorList(activeAccountId)}
                >
                  加载更多
                </Button>
              </p>
            )}
          </Tabs.TabPane>
          <Tabs.TabPane tab="自动任务" key="2">
            <div style={{ width: '100%' }}></div>
          </Tabs.TabPane>
        </Tabs>
      </div>

      <InteractionOneKey ref={Ref_InteractionOneKey} />
    </div>
  );
}
