/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-02-28 21:36:53
 * @LastEditors: nevin
 * @Description: 评论页面 reply
 */
import {
  icpCreateComment,
  icpCreatorList,
  icpGetCommentList,
  icpReplyComment,
  WorkData,
  CommentData,
} from '@/icp/reply';
import { Avatar, Button, Card, Col, Row } from 'antd';
import { useCallback, useState } from 'react';
import AccountSidebar from '../account/components/AccountSidebar/AccountSidebar';
import styles from './reply.module.scss';
import Meta from 'antd/es/card/Meta';

export default function Page() {
  const [wordList, setWordList] = useState<WorkData[]>([]);
  const [commentList, setCommentList] = useState<CommentData[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<number>(-1);

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
   * 创建评论
   */
  async function createComment(dataId: string) {
    const res = await icpCreateComment(activeAccountId, dataId, '真不错');
    console.log('----- res', res);
  }

  /**
   * 回复评论
   */
  async function replyComment(
    commentId: string,
    option: {
      dataId?: string; // 作品ID
      data: any; // 辅助数据,原数据
    },
  ) {
    const res = await icpReplyComment(
      activeAccountId,
      commentId,
      '真不错',
      option,
    );
    console.log('----- res', res);
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
                      createComment(item.dataId);
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
                actions={[<Button type="primary">回复</Button>]}
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
    </div>
  );
}
