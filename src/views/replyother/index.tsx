/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-03-20 21:28:52
 * @LastEditors: nevin
 * @Description: 评论页面 reply
 */
import {
  icpCreatorList,
  icpGetCommentListByOther,
  icpGetSecondCommentListByOther,
  WorkData,
  CommentData,
  icpCreateCommentList,
} from '@/icp/replyother';
import { Avatar, Button, Card, Col, Row, message } from 'antd';
import { useCallback, useRef, useState } from 'react';
import AccountSidebar from '../account/components/AccountSidebar/AccountSidebar';
import styles from './reply.module.scss';
import Meta from 'antd/es/card/Meta';
import ReplyWorks, { ReplyWorksRef } from './components/replyWorks';
import ReplyComment, { ReplyCommentRef } from './components/replyComment';
import AddAutoRun, { AddAutoRunRef } from './components/addAutoRun';
import { icpDianzanDyOther, icpShoucangDyOther } from '@/icp/replyother';
import { commentApi } from '@/api/comment';

export default function Page() {
  const [wordList, setWordList] = useState<WorkData[]>([]);
  const [commentList, setCommentList] = useState<CommentData[]>([]);
  const [secondCommentList, setSecondCommentList] = useState<any[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<number>(-1);
  const Ref_ReplyWorks = useRef<ReplyWorksRef>(null);
  const Ref_AddAutoRun = useRef<AddAutoRunRef>(null);
  const Ref_ReplyComment = useRef<ReplyCommentRef>(null);

  async function getCreatorList(thisid: any) {
    setWordList([]);
    if (activeAccountId === -1) {
      return;
    }
    const thisida = thisid ? thisid : activeAccountId;
    console.log('------ getCreatorList thisida', thisida);
    const res = await icpCreatorList(thisida);
    console.log('------ icpCreatorList', res);
    setWordList(res.list);
  }

  async function getFwqCreatorList() {
    setWordList([]);
    const res = await commentApi.runCommentSearchNotesTask(
      'xhs_comments',
      '美妆',
    );
    console.log('------ getFwqCreatorList', res);
    // setWordList(res.list);
    const list = await commentApi.getCommentSearchNotes(
      'xhs_comments',
      '414381229d04c46cb39f97a5a0b7f9eb',
    );
    console.log('------ getCommentSearchNotes', list);
  }

  /**
   * 获取评论列表
   */
  async function getCommentList(dataId: string) {
    // 7483006686274374962  7478960244136086784
    const res = await icpGetCommentListByOther(
      activeAccountId,
      // '7480598266392972596',
      {
        dataId: '67dfda09000000000903912c',
        option: {
          xsec_token: '111',
        },
      },
    );
    console.log('------ icpGetCommentList', res);

    setCommentList(res.list);
  }

  /**
   * 获取二级评论列表
   */
  async function getSecondCommentList(item: any) {
    const res = await icpGetSecondCommentListByOther(
      activeAccountId,
      // '7480598266392972596',
      item,
      item.data.id,
      item.data.sub_comment_cursor,
    );
    console.log('------ icpGetCommentList', res);

    setSecondCommentList(res.list);
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

  /**
   * 点赞
   */
  async function dianzanFunc(data: WorkData) {
    console.log('------ dianzanFunc', data);
    // const res = await icpDianzanDyOther(activeAccountId, '7485806097282993419'); // 抖音
    const res = await icpDianzanDyOther(
      activeAccountId,
      '67e386fc000000001201fa38',
    );
    console.log('----- res', res);
    if (res.status_code == 0 || res.data.code == 0) {
      message.success('点赞成功');
    } else {
      message.error('点赞失败');
    }
  }

  /**
   * 收藏
   */
  async function shoucangFunc(data: WorkData) {
    console.log('------ shoucangFunc', data);
    // const res = await icpShoucangDyOther(activeAccountId, '7485806097282993419'); // 抖音
    const res = await icpShoucangDyOther(
      activeAccountId,
      '67e386fc000000001201fa38',
    );
    console.log('----- res', res);
    if (res.status_code == 0 || res.data.code == 0) {
      message.success('收藏成功');
    } else {
      message.error('收藏失败');
    }
  }

  return (
    <div className={styles.reply}>
      <Row>
        <Col span={4}>
          <AccountSidebar
            activeAccountId={activeAccountId}
            onAccountChange={useCallback(
              (info) => {
                console.log('------ onAccountChange', info);
                if (info.type == 'xhs') {
                  setActiveAccountId(info.id);
                  // getFwqCreatorList();
                  getCreatorList(info.id);
                } else {
                  setActiveAccountId(info.id);
                  getCreatorList(info.id);
                }
              },
              [getCreatorList],
            )}
          />
        </Col>
        <Col span={8}>
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
                      dianzanFunc(item);
                    }}
                  >
                    点赞
                  </Button>,
                  <Button
                    type="primary"
                    onClick={() => {
                      shoucangFunc(item);
                    }}
                  >
                    收藏
                  </Button>,

                  // <Button
                  //   type="primary"
                  //   onClick={() => {
                  //     createCommentList(item);
                  //   }}
                  // >
                  //   一键AI评论
                  // </Button>,
                  // <Button
                  //   type="primary"
                  //   onClick={() => {
                  //     openAddAutoRun(item);
                  //   }}
                  // >
                  //   创建自动任务
                  // </Button>,
                ]}
              >
                <Meta title={item.title} />
              </Card>
            ))}
          </div>
        </Col>
        <Col span={6}>
          <div>
            {commentList.map((item) => (
              <Card
                key={item.commentId}
                style={{ width: 300 }}
                actions={[
                  <Button type="primary" onClick={() => openReplyComment(item)}>
                    回复
                  </Button>,
                  <Button
                    type="primary"
                    onClick={() => getSecondCommentList(item)}
                  >
                    {item.data.sub_comment_has_more ? '二级评论' : '无'}
                  </Button>,
                ]}
              >
                {item.content}
                {item.subCommentList.map((subItem) => (
                  <div key={subItem.commentId}>
                    {subItem.content}
                    <Meta
                      avatar={<Avatar src={subItem.headUrl} />}
                      description={subItem.nikeName}
                    />
                  </div>
                ))}
                <Meta
                  avatar={<Avatar src={item.headUrl} />}
                  description={item.nikeName}
                />
              </Card>
            ))}
          </div>
        </Col>

        <Col span={6}>
          <div>
            {secondCommentList.map((item) => (
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
                {item.subCommentList.map((subItem: any) => (
                  <div key={subItem.commentId}>
                    {subItem.content}
                    <Meta
                      avatar={<Avatar src={subItem.headUrl} />}
                      description={subItem.nikeName}
                    />
                  </div>
                ))}
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
