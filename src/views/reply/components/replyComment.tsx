import { toolsApi } from '@/api/tools';
import { CommentData, icpReplyComment } from '@/icp/reply';
import { SendOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Tooltip } from 'antd';
import { forwardRef, useImperativeHandle, useState } from 'react';
import logoAi from '@/assets/logoAi.png';

export interface ReplyCommentRef {
  init: (accountId: number, inInfo: CommentData) => Promise<void>;
}

interface FormData {
  content: string;
}

const Com = forwardRef<ReplyCommentRef>((props: any, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountId, setAccountId] = useState<number>(0);
  const [commentData, setCommentData] = useState<CommentData | null>(null);
  const [form] = Form.useForm<FormData>();
  async function init(accountId: number, inInfo: CommentData) {
    setAccountId(accountId);
    setCommentData(inInfo);
    setIsModalOpen(true);
  }

  useImperativeHandle(ref, () => ({
    init: init,
  }));

  function handleCancel() {
    setIsModalOpen(false);
  }

  /**
   * 回复评论
   */
  async function replyComment(content: string) {
    const res = await icpReplyComment(
      accountId,
      commentData!.commentId,
      content,
      {
        dataId: commentData!.dataId,
        comment: commentData!.data,
      },
    );
    console.log('----- res', res);
  }

  async function onFinish(values: FormData) {
    await replyComment(values.content);
    console.log('Success:', values);
  }

  async function onFinishFailed(errorInfo: any) {
    console.log('Failed:', errorInfo);
  }

  async function getAiContent() {
    if (!commentData?.content) return;
    const res = await toolsApi.apiReviewAiRecover({
      content: commentData?.content,
    });

    form.setFieldsValue({
      content: res,
    });
  }

  return (
    <>
      <Modal
        title={null}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={400}
      >
        <div className="p-5">
          <Form
            form={form}
            name="basic"
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            initialValues={{ remember: true }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
          >
            <Form.Item
              label="内容"
              name="content"
              rules={[{ required: true, message: '请输入评论!' }]}
            >
              <Input />
            </Form.Item>

            <p className="text-right">
              <Tooltip title="获取AI建议">
                <img
                  src={logoAi}
                  alt="logo"
                  width={40}
                  onClick={getAiContent}
                />
              </Tooltip>

              <Tooltip title="发送">
                <Button
                  shape="circle"
                  htmlType="submit"
                  icon={<SendOutlined />}
                />
              </Tooltip>
            </p>
          </Form>
        </div>
      </Modal>
    </>
  );
});
export default Com;
