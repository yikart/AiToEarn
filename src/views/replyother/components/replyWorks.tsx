import { toolsApi } from '@/api/tools';
import { icpCreateComment, WorkData } from '@/icp/replyother';
import { Button, Form, Input, message, Modal, Tooltip, Space } from 'antd';
import { forwardRef, useImperativeHandle, useState } from 'react';
import logoAi from '@/assets/logoAi.png';
import { SendOutlined } from '@ant-design/icons';

export interface ReplyWorksRef {
  init: (accountId: number, inWorkData: WorkData) => Promise<void>;
}

interface FormData {
  content: string;
}

const Com = forwardRef<ReplyWorksRef>((props: any, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountId, setAccountId] = useState<number>(0);
  const [workData, setWorkData] = useState<WorkData | null>(null);
  const [form] = Form.useForm<FormData>();

  async function init(accountId: number, inWorkData: WorkData) {
    setAccountId(accountId);
    console.log('------ init-inWorkData', inWorkData);
    setWorkData(inWorkData);
    setIsModalOpen(true);
  }

  useImperativeHandle(ref, () => ({
    init: init,
  }));

  function handleCancel() {
    setIsModalOpen(false);
  }

  /**
   * 创建评论
   */
  async function createComment(content: string) {
    const res = await icpCreateComment(
      accountId,
      workData!.dataId,
      // '67d624a2000000001d02c637',
      content,
      workData!.authorId,
    );
    console.log('----- res', res);
    if (
      res.status_code == 0 ||
      res.data.code == 0 ||
      res.data.visionAddComment?.commentId
    ) {
      message.success('评论成功');
      setIsModalOpen(false);
      form.resetFields();
    } else {
      message.error('评论失败');
    }
  }

  async function onFinish(values: FormData) {
    createComment(values.content);
  }

  async function onFinishFailed(errorInfo: any) {
    console.log('Failed:', errorInfo);
  }

  async function getAiContent() {
    if (!workData?.coverUrl) return;
    const res = await toolsApi.apiReviewImgAi({
      imgUrl: workData?.coverUrl,
    });

    console.log('----- res', res);

    form.setFieldsValue({
      content: res,
    });
  }

  return (
    <>
      <Modal
        title="作品评论"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={500}
        className="reply-works-modal"
      >
        <div className="p-6">
          <Form
            form={form}
            name="basic"
            layout="vertical"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
          >
            <Form.Item
              label="评论内容"
              name="content"
              rules={[{ required: true, message: '请输入评论!' }]}
            >
              <Input.TextArea rows={4} />
            </Form.Item>

            <div className="flex justify-end items-center gap-4">
              <Tooltip title="获取AI建议">
                <img
                  src={logoAi}
                  alt="logo"
                  width={32}
                  onClick={getAiContent}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Tooltip>

              <Tooltip title="发送">
                <Button
                  type="primary"
                  shape="circle"
                  htmlType="submit"
                  icon={<SendOutlined />}
                  className="flex items-center justify-center"
                />
              </Tooltip>
            </div>
          </Form>
        </div>
      </Modal>
    </>
  );
});
export default Com;
