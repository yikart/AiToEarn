"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Form, Input, Modal, Select, Table, message, Popconfirm } from "antd";
import { useTransClient } from "@/app/i18n/client";
import { useParams } from "next/navigation";
import { useUserStore } from "@/store/user";
import {
  createUserWalletAccount,
  deleteUserWalletAccount,
  getUserWalletAccountList,
  updateUserWalletAccount,
  EMAIL_REGEX,
  UserWalletAccount,
  UserWalletAccountCreateDto,
} from "@/api/userWalletAccount";

const { Option } = Select;

export default function WalletPage() {
  const { t } = useTransClient("wallet");
  const { lng } = useParams();
  const { userInfo } = useUserStore();

  const [list, setList] = useState<UserWalletAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const [form] = Form.useForm<UserWalletAccountCreateDto>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserWalletAccount | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const columns = useMemo(
    () => [
      { 
        title: t("columns.userName"), 
        dataIndex: "userName", 
        key: "userName",
        width: 100,
        ellipsis: true
      },
      { 
        title: t("columns.mail"), 
        dataIndex: "mail", 
        key: "mail",
        width: 150,
        ellipsis: true,
        responsive: ['md'] as any
      },
      { 
        title: t("columns.account"), 
        dataIndex: "account", 
        key: "account",
        width: 120,
        ellipsis: true
      },
      { 
        title: t("columns.type"), 
        dataIndex: "type", 
        key: "type", 
        width: 80,
        render: (v: string) => (v === "ZFB" ? t("types.ZFB") : t("types.WX_PAY"))
      },
      { 
        title: t("columns.phone"), 
        dataIndex: "phone", 
        key: "phone",
        width: 120,
        ellipsis: true,
        responsive: ['lg'] as any
      },
      { 
        title: t("columns.cardNum"), 
        dataIndex: "cardNum", 
        key: "cardNum",
        width: 120,
        ellipsis: true,
        responsive: ['lg'] as any
      },
      {
        title: t("columns.actions"),
        key: "actions",
        width: 120,
        fixed: 'right' as any,
        render: (_: any, record: UserWalletAccount) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Button 
              size="small" 
              type="link" 
              onClick={() => onEdit(record)}
              style={{ padding: '2px 4px', fontSize: '11px' }}
            >
              {t("actions.edit")}
            </Button>
            <Popconfirm 
              title={t("actions.deleteConfirm")} 
              onConfirm={() => onDelete(record)}
              okText={t("actions.confirm" as any)}
              cancelText={t("actions.cancel" as any)}
            >
              <Button 
                size="small" 
                type="link" 
                danger
                style={{ padding: '2px 4px', fontSize: '11px' }}
              >
                {t("actions.delete")}
              </Button>
            </Popconfirm>
          </div>
        )
      }
    ],
    [t]
  );

  useEffect(() => {
    fetchList(1, 10);
  }, []);

  async function fetchList(pageNo: number, pageSize: number) {
    setLoading(true);
    try {
      const res = await getUserWalletAccountList(pageNo, pageSize);
      if (res?.data) {
        setList(res.data.list || []);
        setPagination({ current: pageNo, pageSize, total: res.data.total || 0 });
      }
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ userId: userInfo?._id || "" } as any);
    setModalOpen(true);
  }

  function onEdit(record: UserWalletAccount) {
    setEditing(record);
    form.setFieldsValue({
      userId: record.userId,
      mail: record.mail,
      userName: record.userName,
      account: record.account,
      cardNum: record.cardNum,
      phone: record.phone,
      type: record.type,
    });
    setModalOpen(true);
  }

  async function onDelete(record: UserWalletAccount) {
    const res = await deleteUserWalletAccount(record._id);
    if (res) {
      message.success(t("messages.deleteSuccess"));
      fetchList(pagination.current, pagination.pageSize);
    }
  }

  async function onSubmit() {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editing) {
        const res = await updateUserWalletAccount(editing._id, values);
        if (res) message.success(t("messages.updateSuccess"));
      } else {
        const res = await createUserWalletAccount(values);
        if (res) message.success(t("messages.createSuccess"));
      }
      setModalOpen(false);
      fetchList(pagination.current, pagination.pageSize);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ 
      padding: '16px', 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <Card 
        title={t("title")} 
        extra={
          <Button 
            type="primary" 
            onClick={openCreate}
            size="small"
            style={{ 
              fontSize: '12px',
              height: '32px',
              padding: '4px 12px'
            }}
          >
            {t("actions.create")}
          </Button>
        }
        style={{
          margin: '0 auto',
          maxWidth: '100%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <Table
          rowKey="_id"
          columns={columns as any}
          dataSource={list}
          loading={loading}
          scroll={{ x: 800 }}
          size="small"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: false,
            showQuickJumper: false,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} / ${total}`,
            onChange: (p, s) => fetchList(p, s || 10),
            simple: true,
            pageSizeOptions: ['5', '10', '20'],
            responsive: true
          }}
          style={{
            fontSize: '12px'
          }}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={editing ? t("dialogs.editTitle") : t("dialogs.createTitle")}
        onCancel={() => setModalOpen(false)}
        onOk={onSubmit}
        confirmLoading={submitting}
        destroyOnClose
        width="90%"
        style={{ 
          maxWidth: '500px',
          top: '20px'
        }}
        bodyStyle={{
          maxHeight: '70vh',
          overflowY: 'auto',
          padding: '16px'
        }}
        centered
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="userId" label={t("form.userId")} rules={[{ required: true, message: t("form.required") }]}>
            <Input disabled placeholder={t("form.userIdPlaceholder")} />
          </Form.Item>
          <Form.Item name="mail" label={t("form.mail")} rules={[{ required: true, pattern: EMAIL_REGEX, message: t("form.mailInvalid") }]}>
            <Input placeholder={t("form.mailPlaceholder")} />
          </Form.Item>
          <Form.Item name="userName" label={t("form.userName")}> 
            <Input placeholder={t("form.userNamePlaceholder")} />
          </Form.Item>
          <Form.Item name="account" label={t("form.account")} rules={[{ required: true, message: t("form.required") }]}> 
            <Input placeholder={t("form.accountPlaceholder")} />
          </Form.Item>
          <Form.Item name="cardNum" label={t("form.cardNum")}> 
            <Input placeholder={t("form.cardNumPlaceholder")} />
          </Form.Item>
          <Form.Item name="phone" label={t("form.phone")}> 
            <Input placeholder={t("form.phonePlaceholder")} />
          </Form.Item>
          <Form.Item name="type" label={t("form.type")} rules={[{ required: true, message: t("form.required") }]}> 
            <Select placeholder={t("form.typePlaceholder")}>
              <Option value="ZFB">{t("types.ZFB")}</Option>
              <Option value="WX_PAY">{t("types.WX_PAY")}</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}


