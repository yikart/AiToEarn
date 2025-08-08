import React, { forwardRef, memo, useImperativeHandle, useRef, useState, useEffect } from "react";
import { Modal, Button, List, Avatar, Tag, Space, message, Empty, Input, Form, Pagination } from "antd";
import { PlusOutlined, CopyOutlined, DeleteOutlined, KeyOutlined, EditOutlined } from "@ant-design/icons";
import ChooseAccountModule from "@/components/ChooseAccountModule/ChooseAccountModule";
import { SocialAccount } from "@/api/types/account.type";
import { 
  apiCreateMCPKey, 
  apiDeleteMCPKey, 
  apiGetMCPKeyList, 
  apiCreateMCPRef,    
} from "@/api/mcp";
import MCPKeyDetailModal from "./MCPKeyDetailModal";
import styles from "./MCPManagerModal.module.scss";
import dayjs from "dayjs";

export interface IMCPManagerModalRef {
  open: () => void;
  close: () => void;
}

export interface IMCPManagerModalProps {
  open: boolean;
  onClose: (open: boolean) => void;
}

const MCPManagerModal = memo(
  forwardRef<IMCPManagerModalRef, IMCPManagerModalProps>(
    ({ open, onClose }, ref) => {
      const [mcpKeys, setMcpKeys] = useState<any[]>([]);
      const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
      const [selectedAccounts, setSelectedAccounts] = useState<SocialAccount[]>([]);
      const [newKeyName, setNewKeyName] = useState('');
      const [loading, setLoading] = useState(false);
      const [currentPage, setCurrentPage] = useState(1);
      const [pageSize, setPageSize] = useState(10);
      const [total, setTotal] = useState(0);
      const [createForm] = Form.useForm();
      const [showAccountSelector, setShowAccountSelector] = useState(false);
      const [showDetailModal, setShowDetailModal] = useState(false);
      const [selectedKeyInfo, setSelectedKeyInfo] = useState<any>(null);

      // 获取MCP Key列表
      const fetchMCPKeys = async () => {
        try {
          setLoading(true);
          const res:any = await apiGetMCPKeyList(currentPage, pageSize);
          if (res?.code === 0) {
            setMcpKeys(res.data.list || []);
            setTotal(res.data.total || 0);
          }
        } catch (error) {
          message.error('获取MCP Key列表失败');
        } finally {
          setLoading(false);
        }
      };

      // 初始化数据
      useEffect(() => {
        if (open) {
          fetchMCPKeys();
        }
      }, [open, currentPage, pageSize]);

      const handleCreateKey = () => {
        setIsCreateModalOpen(true);
      };

      const handleAccountConfirm = async (accounts: SocialAccount[]) => {
        try {
          setLoading(true);
          
          // 创建MCP Key
          const createParams: any = {
            desc: newKeyName,
            accounts: accounts.map(account => account.id)
          };
          
          const createRes = await apiCreateMCPKey(createParams);
          if (createRes?.code !== 0) {
            message.error('创建MCP Key失败');
            return;
          }

          // 创建关联（如果选择了多个账户，需要多次请求）
          const createdKey = (createRes.data as any)?.key;
          if (createdKey) {
            for (const account of accounts) {
              try {
                await apiCreateMCPRef({
                  key: createdKey,
                  accountId: account.account
                });
              } catch (error) {
                console.error(`创建关联失败: ${account.account}`, error);
              }
            }
          }

          setSelectedAccounts([]);
          setIsCreateModalOpen(false);
          setNewKeyName('');
          message.success('MCP Key创建成功！');
          fetchMCPKeys(); // 刷新列表
        } catch (error) {
          message.error('创建MCP Key失败');
        } finally {
          setLoading(false);
        }
      };

      const handleCopyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        message.success('Key已复制到剪贴板');
      };

      const handleDeleteKey = async (key: string) => {
        try {
          const res = await apiDeleteMCPKey(key);
          if (res?.code === 0) {
            message.success('MCP Key已删除');
            fetchMCPKeys(); // 刷新列表
          } else {
            message.error('删除MCP Key失败');
          }
        } catch (error) {
          message.error('删除MCP Key失败');
        }
      };

      useImperativeHandle(ref, () => ({
        open: () => onClose(true),
        close: () => onClose(false),
      }));

      return (
        <>
          <Modal
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyOutlined style={{ color: '#625BF2' }} />
                MCP 管理器
              </div>
            }
            open={open}
            onCancel={() => onClose(false)}
            footer={null}
            width={800}
            className={styles.mcpManagerModal}
          >
            <div style={{ marginBottom: 16 }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleCreateKey}
                className={styles.createButton}
                loading={loading}
              >
                创建新Key
              </Button>
            </div>

            {mcpKeys.length === 0 && !loading ? (
              <div className={styles.emptyState}>
                <div className="emptyIcon">
                  <KeyOutlined />
                </div>
                <div className="emptyText">暂无MCP Key</div>
                <div className="emptyDesc">点击上方按钮创建您的第一个MCP Key</div>
              </div>
            ) : (
              <>
                                    <List
                      className={styles.mcpKeyList}
                      dataSource={mcpKeys}
                      loading={loading}
                      renderItem={(item) => (
                        <List.Item
                          actions={[
                            <Button 
                              key="copy" 
                              type="link" 
                              icon={<CopyOutlined />}
                              onClick={() => handleCopyKey(item.key)}
                            >
                              复制
                            </Button>,
                            <Button 
                              key="detail" 
                              type="link" 
                              icon={<KeyOutlined />}
                              onClick={() => {
                                setSelectedKeyInfo(item);
                                setShowDetailModal(true);
                              }}
                            >
                              详情
                            </Button>,
                            <Button 
                              key="delete" 
                              type="link" 
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteKey(item.key)}
                              loading={loading}
                            >
                              删除
                            </Button>
                          ]}
                        >
                      <List.Item.Meta
                        avatar={<Avatar style={{ background: 'linear-gradient(90deg, #625BF2 0%, #925BF2 100%)' }}>MCP</Avatar>}
                        title={
                          <Space>
                            <span>{item.desc}</span>
                            <Tag color={item.status === 1 ? 'green' : 'red'}>
                              {item.status === 1 ? '可用' : '不可用'}
                            </Tag>
                          </Space>
                        }
                        description={
                          <div>
                            <div className="keyDisplay">
                              {item.key}
                            </div>
                            <div className="keyInfo">
                              <div className="infoItem">
                                <span className="label">创建时间: </span>
                                <span>  {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span> 
                              </div>
                              <div className="infoItem">
                                <span className="label">关联账户: </span>
                                <span> {item.accountNum} 个</span>
                              </div>
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
                
                {total > 0 && (
                  <div style={{ marginTop: 16, textAlign: 'right' }}>
                    <Pagination
                      current={currentPage}
                      pageSize={pageSize}
                      total={total}
                      showSizeChanger
                      showQuickJumper
                      showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                      onChange={(page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </Modal>

          <Modal
            title="创建MCP Key"
            open={isCreateModalOpen}
            onCancel={() => {
              setIsCreateModalOpen(false);
              setSelectedAccounts([]);
              setNewKeyName('');
              createForm.resetFields();
            }}
            footer={null}
            width={600}
          >
            <Form
              form={createForm}
              layout="vertical"
              onFinish={(values) => {
                if (selectedAccounts.length === 0) {
                  message.warning('请选择至少一个账户');
                  return;
                }
                handleAccountConfirm(selectedAccounts);
              }}
            >
              <Form.Item
                label="Key名称"
                name="name"
                rules={[{ required: true, message: '请输入Key名称' }]}
              >
                <Input
                  placeholder="请输入Key名称"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </Form.Item>
              
              <Form.Item label="选择账户">
                <div style={{ minHeight: 100, border: '1px dashed #d9d9d9', padding: 16, borderRadius: 6 }}>
                  {selectedAccounts.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#999' }}>
                      请选择要关联的账户
                    </div>
                  ) : (
                    <div>
                      <div style={{ marginBottom: 8, fontWeight: 500 }}>已选择 {selectedAccounts.length} 个账户:</div>
                      {selectedAccounts.map(account => (
                        <Tag key={account.id} style={{ marginBottom: 4 }}>
                          {account.nickname}
                        </Tag>
                      ))}
                    </div>
                  )}
                  <Button 
                    type="dashed" 
                    onClick={() => {
                      setShowAccountSelector(true);
                    }}
                    style={{ marginTop: 8 }}
                  >
                    选择账户
                  </Button>
                </div>
              </Form.Item>
              
              <Form.Item>
                <Space>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    loading={loading}
                  >
                    创建
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setSelectedAccounts([]);
                      setNewKeyName('');
                      createForm.resetFields();
                    }}
                  >
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          <ChooseAccountModule
            open={showAccountSelector}
            onClose={() => setShowAccountSelector(false)}
            onAccountConfirm={(accounts) => {
              setSelectedAccounts(accounts);
              setShowAccountSelector(false);
            }}
            simpleAccountChooseProps={{
              choosedAccounts: selectedAccounts,
              disableAllSelect: false,
              isCancelChooseAccount: true,
            }}
          />
          
          <MCPKeyDetailModal
            open={showDetailModal}
            onClose={(open) => {
              setShowDetailModal(open);
              if (!open) {
                setSelectedKeyInfo(null);
              }
            }}
            keyInfo={selectedKeyInfo}
          />
        </>
      );
    }
  )
);

MCPManagerModal.displayName = "MCPManagerModal";

export default MCPManagerModal; 