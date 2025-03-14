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
} from '@/icp/reply';
import { Button } from 'antd';
import { useCallback, useState } from 'react';
import AccountSidebar from '../account/components/AccountSidebar/AccountSidebar';
import styles from './reply.module.scss';

export default function Page() {
  const [wordList, setWordList] = useState<WorkData[]>([]);
  const [commentList, setComment] = useState<WorkData[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<number>(-1);

  async function getCreatorList() {
    const res = await icpCreatorList(4, {
      pageNo: 1,
      pageSize: 10,
    });
    setWordList(res.list);
  }

  /**
   * 获取评论列表
   */
  async function getCommentList(dataId: string) {
    const res = await icpGetCommentList(activeAccountId, dataId);
    setWordList(res.list);
    console.log('----- res', res);
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
      <div>
        <AccountSidebar
          activeAccountId={activeAccountId}
          onAccountChange={useCallback((info) => {
            console.log('----- info', info);

            setActiveAccountId(info.id);
            getCreatorList();
          }, [])}
        />
      </div>
      <div>
        <div>
          {wordList.map((item) => (
            <div key={item.dataId}>
              {item.title}
              <Button
                type="primary"
                onClick={() => getCommentList(item.dataId)}
              >
                获取评论列表
              </Button>

              <Button
                type="primary"
                onClick={() => {
                  createComment(item.dataId);
                }}
              >
                评论作品
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div>
          {commentList.map((item) => (
            <div key={item.dataId}>
              <p> {item.title}</p>
              <p>
                <Button
                  type="primary"
                  // onClick={() => replyComment(item.dataId)}
                >
                  回复该评论
                </Button>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
