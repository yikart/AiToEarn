/*
 * @Author: nevin
 * @Date: 2025-03-18 21:02:38
 * @LastEditTime: 2025-03-31 09:43:51
 * @LastEditors: nevin
 * @Description: 评论列表
 */
import { CommentData, icpGetCommentList, WorkData } from '@/icp/reply';
import { Avatar, Button, Card, Col, Modal, Row, Tooltip, Space, Typography } from 'antd';
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
    setPageInfo({
      count: 0,
      hasMore: false,
    });

    setAccountId(accountId);
    setWorkData(workData);
    await getCommentList(accountId, workData);
    setIsModalOpen(true);
  }

  useImperativeHandle(ref, () => ({
    init: init,
  }));

  function handleCancel() {
    setCommentList([]);
    setPageInfo({
      count: 0,
      hasMore: false,
    });
    setIsModalOpen(false);
  }

  /**
   * 获取评论列表
   */
  async function getCommentList(inAccountId: number, data: WorkData) {
    const res = await icpGetCommentList(inAccountId, data, pageInfo.pcursor);
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
        className="comment-list-modal"
      >
        <Row gutter={[24, 0]}>
          <Col span={6}>
            <div className="sticky top-4">
              {WorkDataDom()}
            </div>
          </Col>
          <Col span={18}>
            <div className="space-y-4">
              {commentList.map((item) => (
                <Card 
                  key={item.commentId} 
                  className="comment-card"
                  bodyStyle={{ padding: '16px' }}
                >
                  <div className="flex items-start gap-3">
                    <Avatar src={item.headUrl} size="large" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <Typography.Text strong>{item.nikeName}</Typography.Text>
                        <Tooltip title="回复">
                          <Button 
                            type="text" 
                            icon={<MessageOutlined />} 
                            onClick={() => openReplyComment(item)}
                            className="text-gray-500 hover:text-blue-500"
                          />
                        </Tooltip>
                      </div>
                      <Typography.Paragraph className="mb-0">
                        {item.content}
                      </Typography.Paragraph>
                      
                      {item.subCommentList.length > 0 && (
                        <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-100">
                          {item.subCommentList.map((subItem) => (
                            <div key={subItem.commentId} className="flex items-start gap-3">
                              <Avatar src={subItem.headUrl} size="small" />
                              <div>
                                <Typography.Text strong className="mr-2">
                                  {subItem.nikeName}
                                </Typography.Text>
                                <Typography.Text>
                                  {subItem.content}
                                </Typography.Text>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {commentList.length > 0 && (
                <div className="text-center mt-4">
                  <Button
                    type="link"
                    onClick={() => getCommentList(accountId, workData!)}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    加载更多
                  </Button>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Modal>

      <ReplyComment ref={Ref_ReplyComment} />
    </>
  );
});
export default Com;
