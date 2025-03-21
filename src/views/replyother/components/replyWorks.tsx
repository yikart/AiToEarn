import { toolsApi } from '@/api/tools';
import { icpCreateComment, WorkData } from '@/icp/reply';
import { Button, Form, Input, Modal } from 'antd';
import { forwardRef, useImperativeHandle, useState } from 'react';

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
        title={null}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
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

          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button type="primary" onClick={getAiContent}>
              AI建议
            </Button>

            <Button type="primary" htmlType="submit">
              提交评论
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
});
export default Com;
