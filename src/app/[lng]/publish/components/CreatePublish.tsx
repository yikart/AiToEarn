"use client";

import { useState, useEffect } from "react";
import { Modal, Form, Input, Button, message, DatePicker, Select } from "antd";
import { createPublishApi } from "@/api/publish";
import type { PublishParams } from "@/api/publish";
import { useAccountStore } from "@/store/account";
import { PubType, PublishType, PubStatus } from "@/types/publish";
import dayjs from "dayjs";

const { Option } = Select;

interface CreatePublishProps {
  visible: boolean;
  type: PublishType;
  onClose: () => void;
}

export default function CreatePublish({
  visible,
  type,
  onClose,
}: CreatePublishProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { accountList, accountInit } = useAccountStore();

  useEffect(() => {
    if (visible) {
      accountInit();
    }
  }, [visible, accountInit]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const params: PublishParams = {
        type,
        title: values.title,
        desc: values.desc,
        accountId: values.accountId,
        videoPath: values.videoPath,
        timingTime: values.timingTime
          ? dayjs(values.timingTime).toISOString()
          : undefined,
        coverPath: values.coverPath,
        commonCoverPath: values.commonCoverPath,
        publishTime: values.publishTime
          ? dayjs(values.publishTime).toISOString()
          : undefined,
        status: values.status || PubStatus.UNPUBLISH,
      };

      const response = await createPublishApi(params);
      if (response?.code === 0) {
        message.success("创建成功");
        onClose();
        form.resetFields();
      } else {
        message.error(response?.msg || "创建失败");
      }
    } catch (error) {
      message.error("创建失败");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case PubType.VIDEO:
        return "视频";
      case PubType.ARTICLE:
        return "文章";
      case PubType.IMAGE_TEXT:
        return "图文";
      default:
        return "";
    }
  };

  return (
    <Modal
      title={`创建${getTitle()}发布`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="accountId"
          label="选择账户"
          rules={[{ required: true, message: "请选择账户" }]}
        >
          <Select placeholder="请选择账户">
            {accountList.map((account) => (
              <Option key={account.id} value={account.id}>
                {account.nickname} ({account.type})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: "请输入标题" }]}
        >
          <Input placeholder="请输入标题" />
        </Form.Item>

        <Form.Item
          name="desc"
          label="描述"
          rules={[{ required: true, message: "请输入描述" }]}
        >
          <Input.TextArea rows={4} placeholder="请输入描述" />
        </Form.Item>

        {type === PubType.VIDEO && (
          <>
            <Form.Item
              name="videoPath"
              label="视频路径"
              rules={[{ required: true, message: "请输入视频路径" }]}
            >
              <Input placeholder="请输入视频路径" />
            </Form.Item>

            <Form.Item
              name="coverPath"
              label="封面路径"
              rules={[{ required: true, message: "请输入封面路径" }]}
            >
              <Input placeholder="请输入封面路径" />
            </Form.Item>

            <Form.Item name="commonCoverPath" label="通用封面路径">
              <Input placeholder="请输入通用封面路径" />
            </Form.Item>
          </>
        )}

        {type === PubType.IMAGE_TEXT && (
          <Form.Item
            name="imagePath"
            label="图片路径"
            rules={[{ required: true, message: "请输入图片路径" }]}
          >
            <Input placeholder="请输入图片路径" />
          </Form.Item>
        )}

        <Form.Item
          name="status"
          label="发布状态"
          initialValue={PubStatus.UNPUBLISH}
        >
          <Select placeholder="请选择发布状态">
            <Option value={PubStatus.UNPUBLISH}>未发布</Option>
            <Option value={PubStatus.RELEASED}>已发布</Option>
            <Option value={PubStatus.FAIL}>发布失败</Option>
            <Option value={PubStatus.PART_SUCCESS}>部分成功</Option>
          </Select>
        </Form.Item>

        <Form.Item name="timingTime" label="定时发布时间">
          <DatePicker
            showTime
            placeholder="请选择定时发布时间"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item name="publishTime" label="发布时间">
          <DatePicker
            showTime
            placeholder="请选择发布时间"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            提交
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
