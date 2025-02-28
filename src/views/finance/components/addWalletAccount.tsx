/*
 * @Author: nevin
 * @Date: 2025-02-27 20:44:31
 * @LastEditTime: 2025-02-28 22:29:24
 * @LastEditors: nevin
 * @Description: 添加账户 addWalletAccount
 */
import { Button, Form, Input, Modal, Select } from 'antd';
import { forwardRef, useImperativeHandle, useState } from 'react';

export interface AddWalletAccountRef {
  init: () => Promise<void>;
}

import {
  CreateUserWalletAccountParams,
  WalletAccountType,
} from '@/api/types/userWalletAccount';
import { financeApi } from '@/api/finance';

const Com = forwardRef<AddWalletAccountRef>((props: any, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm<CreateUserWalletAccountParams>();

  async function init() {
    // form表单重置
    form.resetFields();

    setIsModalOpen(true);
  }

  useImperativeHandle(ref, () => ({ init: init }));

  /**
   * 提交
   */
  async function submit() {
    const values = await form.validateFields();

    // 创建
    const res = await financeApi.createUserWalletAccount(values);
    console.log('----- rres', res);

    // 创建成功后向父组件发送成功事件
    props.onSuccess?.(res);

    setIsModalOpen(false);
  }

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const onFinish = (values: CreateUserWalletAccountParams) => {
    console.log('Success:', values);
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <>
      <Modal
        title="新建账户"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={submit}>
            提交
          </Button>,
        ]}
      >
        <Form
          name="basic"
          form={form}
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item
            label="真实姓名"
            name="userName"
            rules={[{ required: true, message: '请输入真实姓名!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="身份证号"
            name="cardNum"
            rules={[{ required: true, message: '请输入身份证号!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="绑定的手机号"
            name="phone"
            rules={[{ required: true, message: '请输入绑定的手机号!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="类型"
            name="type"
            rules={[{ required: true, message: '请选择类型!' }]}
          >
            <Select>
              <Select.Option value={WalletAccountType.ZFB}>
                支付宝
              </Select.Option>
              <Select.Option value={WalletAccountType.WX_PAY}>
                微信支付
              </Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
});

export default Com;
