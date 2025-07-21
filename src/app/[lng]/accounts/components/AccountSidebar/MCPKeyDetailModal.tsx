import React, { forwardRef, memo, useImperativeHandle, useState, useEffect } from "react";
import { Modal, Button, List, Avatar, Tag, Space, message, Empty, Pagination, Popconfirm } from "antd";
import { CopyOutlined, DeleteOutlined, KeyOutlined, UserOutlined } from "@ant-design/icons";
import { SocialAccount } from "@/api/types/account.type";
import { apiGetMCPRefList, apiDeleteMCPRef } from "@/api/mcp";
import styles from "./MCPKeyDetailModal.module.scss";

export interface IMCPKeyDetailModalRef {
  open: (keyInfo: any) => void;
  close: () => void;
}

export interface IMCPKeyDetailModalProps {
  open: boolean;
  onClose: (open: boolean) => void;
  keyInfo?: any;
}

const MCPKeyDetailModal = memo(
  forwardRef<IMCPKeyDetailModalRef, IMCPKeyDetailModalProps>(
    ({ open, onClose, keyInfo: propKeyInfo }, ref) => {
      const [keyInfo, setKeyInfo] = useState<any>(null);
      const [refList, setRefList] = useState<any[]>([]);
      const [loading, setLoading] = useState(false);
      const [currentPage, setCurrentPage] = useState(1);
      const [pageSize, setPageSize] = useState(10);
      const [total, setTotal] = useState(0);

      // 获取关联账户列表
      const fetchRefList = async () => {
        if (!keyInfo?.key) return;
        
        try {
          setLoading(true);
          const res: any = await apiGetMCPRefList(currentPage, pageSize, keyInfo.key);
          if (res?.code === 0) {
            setRefList(res.data.list || []);
            setTotal(res.data.total || 0);
          }
        } catch (error) {
          message.error('获取关联账户列表失败');
        } finally {
          setLoading(false);
        }
      };

      useEffect(() => {
        if (open && keyInfo) {
          fetchRefList();
        }
      }, [open, keyInfo, currentPage, pageSize]);

      const handleCopyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        message.success('Key已复制到剪贴板');
      };

      const handleUnlinkAccount = async (accountId: string) => {
        try {
          const res = await apiDeleteMCPRef({
            key: keyInfo.key,
            accountId: accountId
          });
          if (res?.code === 0) {
            message.success('解除关联成功');
            fetchRefList(); // 刷新列表
          } else {
            message.error('解除关联失败');
          }
        } catch (error) {
          message.error('解除关联失败');
        }
      };

      // 当props中的keyInfo变化时，更新内部状态
      useEffect(() => {
        if (propKeyInfo) {
          setKeyInfo(propKeyInfo);
          setCurrentPage(1);
          setRefList([]);
          setTotal(0);
        }
      }, [propKeyInfo]);

      useImperativeHandle(ref, () => ({
        open: (keyInfo: any) => {
          setKeyInfo(keyInfo);
          setCurrentPage(1);
          setRefList([]);
          setTotal(0);
        },
        close: () => {
          setKeyInfo(null);
          setRefList([]);
          setTotal(0);
        },
      }));

      return (
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <KeyOutlined style={{ color: '#625BF2' }} />
              MCP Key 详情
            </div>
          }
          open={open}
          onCancel={() => onClose(false)}
          footer={null}
          width={800}
          className={styles.mcpKeyDetailModal}
        >
          {keyInfo && (
            <>
              {/* Key基本信息 */}
              <div className={styles.keyInfo}>
                <div className={styles.keyHeader}>
                  <div className={styles.keyName}>
                    <span className={styles.label}>Key名称:</span>
                    <span className={styles.value}>{keyInfo.desc}</span>
                  </div>
                  <Space>
                    <Tag color={keyInfo.status === 1 ? 'green' : 'red'}>
                      {keyInfo.status === 1 ? '可用' : '不可用'}
                    </Tag>
                    <Button 
                      type="link" 
                      icon={<CopyOutlined />}
                      onClick={() => handleCopyKey(keyInfo.key)}
                    >
                      复制Key
                    </Button>
                  </Space>
                </div>
                
                <div className={styles.keyValue}>
                  <span className={styles.label}>Key值:</span>
                  <span className={styles.value}>{keyInfo.key}</span>
                </div>
                
                <div className={styles.keyMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.label}>创建时间:</span>
                    <span>{keyInfo.createdAt}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.label}>关联账户:</span>
                    <span>{total} 个</span>
                  </div>
                </div>
              </div>

              {/* 关联账户列表 */}
              <div className={styles.refList}>
                <div className={styles.sectionTitle}>
                  <UserOutlined />
                  关联账户列表
                </div>
                
                {refList.length === 0 && !loading ? (
                  <div className={styles.emptyState}>
                    <Empty description="暂无关联账户" />
                  </div>
                ) : (
                  <>
                    <List
                      className={styles.refList}
                      dataSource={refList}
                      loading={loading}
                      renderItem={(item) => (
                        <List.Item
                          actions={[
                            <Popconfirm
                              title="确定要解除关联吗？"
                              onConfirm={() => handleUnlinkAccount(item.accountId)}
                              okText="确定"
                              cancelText="取消"
                            >
                              <Button 
                                key="unlink" 
                                type="link" 
                                danger
                                icon={<DeleteOutlined />}
                              >
                                解除关联
                              </Button>
                            </Popconfirm>
                          ]}
                        >
                          <List.Item.Meta
                            avatar={<Avatar src={item.account?.avatar} />}
                            title={item.account?.nickname || '未知账户'}
                            description={
                              <div>
                                <div>账户ID: {item.accountId}</div>
                                <div>关联时间: {item.createdAt}</div>
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
              </div>
            </>
          )}
        </Modal>
      );
    }
  )
);

MCPKeyDetailModal.displayName = "MCPKeyDetailModal";

export default MCPKeyDetailModal; 