/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-03-25 14:17:27
 * @LastEditors: nevin
 * @Description: 评论页面 reply
 */
import { icpCreatorList, WorkData, icpCreateCommentList } from '@/icp/reply';
import { Button, Col, message, Row } from 'antd';
import { useCallback, useRef, useState } from 'react';
import AccountSidebar from '../account/components/AccountSidebar/AccountSidebar';
import styles from './reply.module.scss';
import ReplyWorks, { ReplyWorksRef } from './components/replyWorks';
import AddAutoRun, { AddAutoRunRef } from './components/addAutoRun';
import CommentList, { CommentListRef } from './components/commentList';
import { SendChannelEnum } from '@@/UtilsEnum';

export default function Page() {
  const [wordList, setWordList] = useState<WorkData[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<number>(-1);
  const Ref_ReplyWorks = useRef<ReplyWorksRef>(null);
  const Ref_AddAutoRun = useRef<AddAutoRunRef>(null);
  const Ref_CommentList = useRef<CommentListRef>(null);

  // 注册监听
  (() => {
    window.ipcRenderer.on(
      SendChannelEnum.CommentRelyProgress,
      (
        e,
        args: {
          tag: string;
          status: -1 | 0 | 1;
          error?: any;
        },
      ) => {
        message.info(`收到评论通知--${args.status}---${args.tag}`);
      },
    );
  })();

  async function getCreatorList(accountId: number) {
    if (accountId === -1) return;
    setWordList([]);
    const res = await icpCreatorList(accountId);
    setWordList(res.list);
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
    <div className={styles.reply}>
      <Row>
        <Col span={4}>
          <AccountSidebar
            activeAccountId={activeAccountId}
            onAccountChange={useCallback((info) => {
              setActiveAccountId(info.id);
              getCreatorList(info.id);
            }, [])}
          />
        </Col>
        <Col span={20}>
          <div>
            {wordList.map((item) => (
              <div key={item.dataId}>
                <img alt="example" src={item.coverUrl} />
                <p>{item.title}</p>
                <Button type="primary" onClick={() => openCommentList(item)}>
                  评论列表
                </Button>

                <Button
                  type="primary"
                  onClick={() => {
                    openReplyWorks(item);
                  }}
                >
                  评论作品
                </Button>
                <Button
                  type="primary"
                  onClick={() => {
                    createCommentList(item);
                  }}
                >
                  一键AI评论
                </Button>

                <Button
                  type="primary"
                  onClick={() => {
                    openAddAutoRun(item);
                  }}
                >
                  创建自动任务
                </Button>
              </div>
            ))}
          </div>
        </Col>
      </Row>

      <ReplyWorks ref={Ref_ReplyWorks} />
      <AddAutoRun ref={Ref_AddAutoRun} />
      <CommentList ref={Ref_CommentList} />
    </div>
  );
}
