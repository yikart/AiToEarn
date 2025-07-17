import React, { forwardRef, memo, useImperativeHandle, useRef, useState } from "react";
import { Modal, Button, List, Avatar, Tag, Space, message, Empty } from "antd";
import { PlusOutlined, CopyOutlined, DeleteOutlined, KeyOutlined } from "@ant-design/icons";
import ChooseAccountModule from "@/components/ChooseAccountModule/ChooseAccountModule";
import { SocialAccount } from "@/api/types/account.type";
import { PubType } from "@/app/config/publishConfig";
import styles from "./MCPManagerModal.module.scss";

export interface IMCPManagerModalRef {
  open: () => void;
  close: () => void;
}

export interface IMCPManagerModalProps {
  open: boolean;
  onClose: (open: boolean) => void;
}

// MCP Key 接口类型
interface MCPKey {
  id: string;
  name: string;
  key: string;
  accounts: SocialAccount[];
  createdAt: string;
  status: 'active' | 'inactive';
}

const MCPManagerModal = memo(
  forwardRef<IMCPManagerModalRef, IMCPManagerModalProps>(
    ({ open, onClose }, ref) => {
      const [mcpKeys, setMcpKeys] = useState<MCPKey[]>([]);
      const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
      const [selectedAccounts, setSelectedAccounts] = useState<SocialAccount[]>([]);
      const [newKeyName, setNewKeyName] = useState('');

      // 模拟数据 - 实际应该从API获取
      const mockMcpKeys: MCPKey[] = [
        {
          id: '1',
          name: '默认MCP Key',
          key: 'mcp_sk_1234567890abcdef',
          accounts: [],
          createdAt: '2024-01-15 10:30:00',
          status: 'active'
        },
        {
          id: '2', 
          name: '测试MCP Key',
          key: 'mcp_sk_abcdef1234567890',
          accounts: [],
          createdAt: '2024-01-16 14:20:00',
          status: 'active'
        }
      ];

      // 初始化数据
      React.useEffect(() => {
        if (open) {
          setMcpKeys(mockMcpKeys);
        }
      }, [open]);

      const handleCreateKey = () => {
        setIsCreateModalOpen(true);
      };

      const handleAccountConfirm = (accounts: SocialAccount[]) => {
        setSelectedAccounts(accounts);
        setIsCreateModalOpen(false);
        // TODO: 调用创建MCP Key的API
        message.success('MCP Key创建成功！');
      };

      const handleCopyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        message.success('Key已复制到剪贴板');
      };

      const handleDeleteKey = (keyId: string) => {
        setMcpKeys(prev => prev.filter(key => key.id !== keyId));
        message.success('MCP Key已删除');
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
              >
                创建新Key
              </Button>
            </div>

            {mcpKeys.length === 0 ? (
              <div className={styles.emptyState}>
                <div className="emptyIcon">
                  <KeyOutlined />
                </div>
                <div className="emptyText">暂无MCP Key</div>
                <div className="emptyDesc">点击上方按钮创建您的第一个MCP Key</div>
              </div>
            ) : (
              <List
                className={styles.mcpKeyList}
                dataSource={mcpKeys}
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
                        key="delete" 
                        type="link" 
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteKey(item.id)}
                      >
                        删除
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar style={{ background: 'linear-gradient(90deg, #625BF2 0%, #925BF2 100%)' }}>MCP</Avatar>}
                      title={
                        <Space>
                          <span>{item.name}</span>
                          <Tag color={item.status === 'active' ? 'green' : 'red'}>
                            {item.status === 'active' ? '活跃' : '非活跃'}
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
                              <span className="label">创建时间:</span>
                              <span>{item.createdAt}</span>
                            </div>
                            <div className="infoItem">
                              <span className="label">关联账户:</span>
                              <span>{item.accounts.length} 个</span>
                            </div>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Modal>

          <ChooseAccountModule
            open={isCreateModalOpen}
            onClose={setIsCreateModalOpen}
            onPlatConfirm={handleAccountConfirm}
            platChooseProps={{
              pubType: PubType.VIDEO, // 根据实际需要调整
              choosedAccounts: selectedAccounts,
              disableAllSelect: false,
              isCancelChooseAccount: true,
            }}
          />
        </>
      );
    }
  )
);

MCPManagerModal.displayName = "MCPManagerModal";

export default MCPManagerModal; 