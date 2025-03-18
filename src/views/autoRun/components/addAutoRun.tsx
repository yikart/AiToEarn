import { AutoRunType, ipcCreateAutoRun } from '@/icp/autoRun';
import { Button, Form, Input, Modal, Select } from 'antd';
import { forwardRef, useImperativeHandle, useState } from 'react';
const { Option } = Select;

export interface AddAutoRunRef {
  init: (accountId: number) => Promise<void>;
}

interface FormData {
  // '周期类型 天 day-22 (例:每天22时) 周 week-2 (例:每周周二,周日0) 月 month-22 (例:每月22号)',
  cycleType: string;
  type: AutoRunType;
}

const Com = forwardRef<AddAutoRunRef>((props: any, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountId, setAccountId] = useState<number>(0);
  const [form] = Form.useForm<FormData>();
  async function init(accountId: number) {
    setAccountId(accountId);
    setIsModalOpen(true);
  }

  useImperativeHandle(ref, () => ({
    init: init,
  }));

  function handleCancel() {
    setIsModalOpen(false);
  }

  async function onFinish(values: FormData) {
    const res = await ipcCreateAutoRun({
      accountId,
      ...values,
    });
    console.log('-------- res', res);

    console.log('Success:', values);
  }

  async function onFinishFailed(errorInfo: any) {
    console.log('Failed:', errorInfo);
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
            label="重复周期类型"
            name="cycleType"
            rules={[{ required: true, message: '重复周期类型!' }]}
          >
            <p>
              周期类型 天 day-22 例:每天22时 周 week-2 例:每周周二,周日0 月
              month-22 例:每月22号
            </p>
            <Input />
          </Form.Item>

          <Form.Item name="gender" label="类型" rules={[{ required: true }]}>
            <Select placeholder="选择任务类型" allowClear>
              <Option value={AutoRunType.ReplyComment}>自动回复评论</Option>
            </Select>
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button type="primary" htmlType="submit">
              提交
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
});
export default Com;
