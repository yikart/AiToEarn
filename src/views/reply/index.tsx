/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-03-21 22:53:09
 * @LastEditors: nevin
 * @Description: 评论页面 reply
 */
import {
  icpCreatorList,
  icpGetCommentList,
  WorkData,
  CommentData,
  icpCreateCommentList,
} from '@/icp/reply';
import { Avatar, Button, Card, Col, Row } from 'antd';
import { useCallback, useRef, useState } from 'react';
import AccountSidebar from '../account/components/AccountSidebar/AccountSidebar';
import styles from './reply.module.scss';
import Meta from 'antd/es/card/Meta';
import ReplyWorks, { ReplyWorksRef } from './components/replyWorks';
import ReplyComment, { ReplyCommentRef } from './components/replyComment';
import AddAutoRun, { AddAutoRunRef } from './components/addAutoRun';

export default function Page() {
  const [wordList, setWordList] = useState<WorkData[]>([]);
  const [commentList, setCommentList] = useState<CommentData[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<number>(-1);
  const Ref_ReplyWorks = useRef<ReplyWorksRef>(null);
  const Ref_AddAutoRun = useRef<AddAutoRunRef>(null);
  const Ref_ReplyComment = useRef<ReplyCommentRef>(null);

  async function getCreatorList() {
    if (activeAccountId === -1) {
      return;
    }
    setWordList([]);

    const res = await icpCreatorList(activeAccountId);

    setWordList(res.list);
  }

  /**
   * 获取评论列表
   */
  async function getCommentList(dataId: string) {
    const res = await icpGetCommentList(activeAccountId, dataId);
    console.log('------ res', res);

    setCommentList(res.list);
  }

  /**
   * 一键AI评论
   */
  async function createCommentList(data: WorkData) {
    const res = await icpCreateCommentList(activeAccountId, data.dataId);
    console.log('------ res', res);
  }

  /**
   * 打开作品评论
   * @param data
   */
  function openReplyWorks(data: WorkData) {
    Ref_ReplyWorks.current?.init(activeAccountId, data);
  }

  /**
   * 打开评论回复
   * @param data
   */
  function openReplyComment(data: CommentData) {
    Ref_ReplyComment.current?.init(activeAccountId, data);
  }

  /**
   * 打开创建自动任务
   * @param data
   */
  function openAddAutoRun(data: WorkData) {
    Ref_AddAutoRun.current?.init(activeAccountId, data.dataId);
  }

  return (
    <div className={styles.reply}>
      <Row>
        <Col span={4}>
          <AccountSidebar
            activeAccountId={activeAccountId}
            onAccountChange={useCallback(
              (info) => {
                setActiveAccountId(info.id);
                getCreatorList();
              },
              [getCreatorList],
            )}
          />
        </Col>
        <Col span={10}>
          <div>
            {wordList.map((item) => (
              <Card
                key={item.dataId}
                style={{ width: 500 }}
                cover={<img alt="example" src={item.coverUrl} />}
                actions={[
                  <Button
                    type="primary"
                    onClick={() => getCommentList(item.dataId)}
                  >
                    评论列表
                  </Button>,
                  <Button
                    type="primary"
                    onClick={() => {
                      openReplyWorks(item);
                    }}
                  >
                    评论作品
                  </Button>,
                  <Button
                    type="primary"
                    onClick={() => {
                      createCommentList(item);
                    }}
                  >
                    一键AI评论
                  </Button>,
                  <Button
                    type="primary"
                    onClick={() => {
                      openAddAutoRun(item);
                    }}
                  >
                    创建自动任务
                  </Button>,
                ]}
              >
                <Meta title={item.title} />
              </Card>
            ))}
          </div>
        </Col>
        <Col span={10}>
          <div>
            {commentList.map((item) => (
              <Card
                key={item.commentId}
                style={{ width: 300 }}
                actions={[
                  <Button type="primary" onClick={() => openReplyComment(item)}>
                    回复
                  </Button>,
                ]}
              >
                {item.content}
                {/* {item.subCommentList.map((subItem) => (
                  <div key={subItem.commentId}>
                    {subItem.content}
                    <Meta
                      avatar={<Avatar src={subItem.headUrl} />}
                      description={subItem.nikeName}
                    />
                  </div>
                ))} */}
                <Meta
                  avatar={<Avatar src={item.headUrl} />}
                  description={item.nikeName}
                />
              </Card>
            ))}
          </div>
        </Col>
      </Row>

      <ReplyWorks ref={Ref_ReplyWorks} />
      <ReplyComment ref={Ref_ReplyComment} />
      <AddAutoRun ref={Ref_AddAutoRun} />
    </div>
  );
}
