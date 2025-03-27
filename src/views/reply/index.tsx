/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-03-25 16:01:56
 * @LastEditors: nevin
 * @Description: 评论页面 reply
 */
import { icpCreatorList, WorkData } from '@/icp/reply';
import { Button, Col, Row, Tabs, Tooltip } from 'antd';
import { useCallback, useRef, useState } from 'react';
import AccountSidebar from '../account/components/AccountSidebar/AccountSidebar';
import ReplyWorks, { ReplyWorksRef } from './components/replyWorks';
import AddAutoRun, { AddAutoRunRef } from './components/addAutoRun';
import CommentList, { CommentListRef } from './components/commentList';
import {
  AliwangwangOutlined,
  CommentOutlined,
  FieldTimeOutlined,
  MenuUnfoldOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import styles from './reply.module.scss';
import AutoRun from './autoRun';
import OneKeyReply, { OneKeyReplyRef } from './components/oneKeyReply';

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
  const Ref_ReplyWorks = useRef<ReplyWorksRef>(null);
  const Ref_AddAutoRun = useRef<AddAutoRunRef>(null);
  const Ref_CommentList = useRef<CommentListRef>(null);
  const Ref_OneKeyReply = useRef<OneKeyReplyRef>(null);

  async function getCreatorList(accountId: number) {
    if (accountId === -1) return;
    const res = await icpCreatorList(accountId, pageInfo.pcursor);
    setPageInfo(res.pageInfo);
    setWordList([...wordList, ...res.list]);
  }

  /**
   * 打开作品评论
   * @param data
   */
  function openReplyWorks(data: WorkData) {
    Ref_ReplyWorks.current?.init(activeAccountId, data);
  }

  /**
   * 打开评论列表
   * @param data
   */
  function openCommentList(data: WorkData) {
    Ref_CommentList.current?.init(activeAccountId, data);
  }

  /**
   * 打开创建自动任务
   * @param data
   */
  function openAddAutoRun(data: WorkData) {
    Ref_AddAutoRun.current?.init(activeAccountId, data.dataId);
  }

  return (
    <div className={styles.account}>
      <AccountSidebar
        activeAccountId={activeAccountId}
        onAccountChange={useCallback((info) => {
          setWordList([]);
          setActiveAccountId(info.id);
          getCreatorList(info.id);
        }, [])}
      />

      <div className="m-4">
        <Tabs defaultActiveKey="1">
          <Tabs.TabPane tab="作品列表" key="1">
            {/* 测试---- */}
            <Button
              onClick={() => {
                window.ipcRenderer.invoke('ICP_REPLY_TEST_NOTICE');
              }}
            >
              测试
            </Button>
            {/* 测试---- */}

            {activeAccountId === -1 ? (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
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
                              <Col span={8}>
                                <Tooltip title="评论列表">
                                  <MenuUnfoldOutlined
                                    onClick={() => openCommentList(item)}
                                  />
                                </Tooltip>
                              </Col>
                              <Col span={8}>
                                <Tooltip title="评论作品">
                                  <CommentOutlined
                                    onClick={() => openReplyWorks(item)}
                                  />
                                </Tooltip>
                              </Col>
                            </Row>

                            <Row justify="space-evenly">
                              <Col span={8}>
                                <Tooltip title="一键评论">
                                  <AliwangwangOutlined
                                    onClick={() =>
                                      Ref_OneKeyReply.current?.init(
                                        activeAccountId,
                                        item,
                                      )
                                    }
                                  />
                                </Tooltip>
                              </Col>
                              <Col span={8}>
                                <Tooltip title="自动评论">
                                  <FieldTimeOutlined
                                    onClick={() => openAddAutoRun(item)}
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
                {wordList.length > 0 && (
                  <p>
                    <Button
                      type="link"
                      onClick={() => getCreatorList(activeAccountId)}
                    >
                      加载更多
                    </Button>
                  </p>
                )}
              </div>
            )}
          </Tabs.TabPane>
          <Tabs.TabPane tab="自动任务" key="2">
            <div style={{ width: '100%' }}>
              <AutoRun />
            </div>
          </Tabs.TabPane>
        </Tabs>
      </div>

      <ReplyWorks ref={Ref_ReplyWorks} />
      <AddAutoRun ref={Ref_AddAutoRun} />
      <CommentList ref={Ref_CommentList} />
      <OneKeyReply ref={Ref_OneKeyReply} />
    </div>
  );
}
