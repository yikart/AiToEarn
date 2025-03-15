/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-02-28 21:36:53
 * @LastEditors: nevin
 * @Description: 评论页面 reply
 */
import {
  icpCreatorList,
  icpGetCommentList,
  WorkData,
  CommentData,
} from '@/icp/reply';
import { Avatar, Button, Card, Col, Row } from 'antd';
import { useCallback, useRef, useState } from 'react';
import AccountSidebar from '../account/components/AccountSidebar/AccountSidebar';
import styles from './reply.module.scss';
import Meta from 'antd/es/card/Meta';
import ReplyWorks, { ReplyWorksRef } from './components/replyWorks';
import ReplyComment, { ReplyCommentRef } from './components/replyComment';

export default function Page() {
  const [wordList, setWordList] = useState<WorkData[]>([]);
  const [commentList, setCommentList] = useState<CommentData[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<number>(-1);

  const Ref_ReplyWorks = useRef<ReplyWorksRef>(null);
  const Ref_ReplyComment = useRef<ReplyCommentRef>(null);

  async function getCreatorList() {
    if (activeAccountId === -1) {
      return;
    }
    setWordList([]);

    const res = await icpCreatorList(activeAccountId, {
      pageNo: 1,
      pageSize: 10,
    });

    setWordList(res.list);
  }

  /**
   * 获取评论列表
   */
  async function getCommentList(dataId: string) {
    const res = await icpGetCommentList(activeAccountId, dataId, {});
    setCommentList(res.list);
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
                style={{ width: 200 }}
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
    </div>
  );
}
