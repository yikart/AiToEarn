/*
 * @Author: nevin
 * @Date: 2025-03-18 21:02:38
 * @LastEditTime: 2025-03-25 14:28:36
 * @LastEditors: nevin
 * @Description: 评论列表
 */
import { CommentData, icpGetCommentList, WorkData } from '@/icp/reply';
import { Avatar, Button, Card, Col, Modal, Row, Tooltip } from 'antd';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import Meta from 'antd/es/card/Meta';
import ReplyComment, { ReplyCommentRef } from './replyComment';
import { MessageOutlined } from '@ant-design/icons';

export interface CommentListRef {
  init: (accountId: number, workData: WorkData) => Promise<void>;
}

const Com = forwardRef<CommentListRef>((props: any, ref) => {
  const [commentList, setCommentList] = useState<CommentData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountId, setAccountId] = useState<number>(0);
  const [workData, setWorkData] = useState<WorkData | null>(null);
  const Ref_ReplyComment = useRef<ReplyCommentRef>(null);
  const [pageInfo, setPageInfo] = useState<{
    count: number;
    hasMore: boolean;
    pcursor?: string;
  }>({
    count: 0,
    hasMore: false,
  });

  async function init(accountId: number, workData: WorkData) {
    setCommentList([]);
    setAccountId(accountId);
    setWorkData(workData);
    setIsModalOpen(true);
    await getCommentList(workData);
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
  async function getCommentList(data: WorkData) {
    const res = await icpGetCommentList(accountId, data, pageInfo.pcursor);
    if (!res) return;

    setPageInfo(res.pageInfo);
    setCommentList([...commentList, ...res.list]);
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
              <Card key={item.commentId} className="mb-3">
                <p>
                  <Avatar src={item.headUrl} />
                  {/* <p>{item.nikeName}</p> */}
                  {item.content}
                  &nbsp;&nbsp;
                  <Tooltip title="回复">
                    <MessageOutlined onClick={() => openReplyComment(item)} />
                  </Tooltip>
                </p>
                <div className="ml-6">
                  {item.subCommentList.map((subItem) => (
                    <p key={subItem.commentId}>
                      <Avatar src={subItem.headUrl} />
                      &nbsp;&nbsp;
                      {subItem.content}
                    </p>
                  ))}
                </div>
              </Card>
            ))}

            {commentList.length > 0 && (
              <p>
                <Button type="link" onClick={() => getCommentList(workData!)}>
                  加载更多
                </Button>
              </p>
            )}
          </Col>
        </Row>
      </Modal>

      <ReplyComment ref={Ref_ReplyComment} />
    </>
  );
});
export default Com;
