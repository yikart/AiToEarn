import { toolsApi } from '@/api/tools';
import { icpCreateComment, WorkData } from '@/icp/reply';
import { Button, Form, Input, Modal, Tooltip } from 'antd';
import { forwardRef, useImperativeHandle, useState } from 'react';
import logoAi from '@/assets/logoAi.png';
import { SendOutlined } from '@ant-design/icons';
import '../reply.module.scss';

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
    const res = await icpCreateComment(accountId, workData!.dataId, content);
    console.log('----- res', res);
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
              label="评论"
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
