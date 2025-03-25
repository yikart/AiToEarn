/*
 * @Author: nevin
 * @Date: 2025-03-18 21:02:38
 * @LastEditTime: 2025-03-25 14:28:36
 * @LastEditors: nevin
 * @Description: 评论列表
 */
import { CommentData, icpGetCommentList, WorkData } from '@/icp/reply';
import { Avatar, Button, Card, Col, Modal, Row } from 'antd';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import Meta from 'antd/es/card/Meta';
import ReplyComment, { ReplyCommentRef } from './replyComment';

export interface CommentListRef {
  init: (accountId: number, workData: WorkData) => Promise<void>;
}

const Com = forwardRef<CommentListRef>((props: any, ref) => {
  const [commentList, setCommentList] = useState<CommentData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountId, setAccountId] = useState<number>(0);
  const [workData, setWorkData] = useState<WorkData | null>(null);
  const Ref_ReplyComment = useRef<ReplyCommentRef>(null);

  async function init(accountId: number, workData: WorkData) {
    setAccountId(accountId);
    setWorkData(workData);
    setIsModalOpen(true);
  }

  useImperativeHandle(ref, () => ({
    init: init,
  }));

  function handleCancel() {
    setIsModalOpen(false);
  }

  /**
   * 获取评论列表
   */
  async function getCommentList(dataId: string) {
    const res = await icpGetCommentList(accountId, dataId);
    setCommentList(res.list);
  }

  /**
   * 打开评论回复
   * @param data
   */
  function openReplyComment(data: CommentData) {
    Ref_ReplyComment.current?.init(accountId, data);
  }

  /**
   *
   * @param param0
   * @returns
   */
  function WorkDataDom() {
    if (!workData) return <div>数据有误</div>;

    return (
      <Card
        style={{ width: 200 }}
        cover={<img alt="example" src={workData.coverUrl} />}
      >
        <Button type="primary" onClick={() => getCommentList(workData.dataId)}>
          评论列表
        </Button>
        <Meta title={workData.title} />
      </Card>
    );
  }

  return (
    <>
      <Modal
        title="评论列表"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={1200}
      >
        <Row>
          <Col span={6}>{WorkDataDom()}</Col>

          <Col span={18}>
            {commentList.map((item) => (
              <Card key={item.commentId}>
                <p>
                  <Avatar src={item.headUrl} />
                  {/* <p>{item.nikeName}</p> */}
                  {item.content}
                  <Button type="primary" onClick={() => openReplyComment(item)}>
                    回复
                  </Button>
                </p>
                {item.subCommentList.map((subItem) => (
                  <p key={subItem.commentId}>
                    <Avatar src={subItem.headUrl} />
                    {subItem.content}
                  </p>
                ))}
              </Card>
            ))}
          </Col>
        </Row>
      </Modal>

      <ReplyComment ref={Ref_ReplyComment} />
    </>
  );
});
export default Com;
