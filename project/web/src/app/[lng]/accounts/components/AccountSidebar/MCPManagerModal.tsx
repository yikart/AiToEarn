import type { SocialAccount } from '@/api/types/account.type'
import { CopyOutlined, DeleteOutlined, EditOutlined, KeyOutlined, PlusOutlined } from '@ant-design/icons'
import { Avatar, Button, Empty, Form, Input, List, message, Modal, Pagination, Space, Tag } from 'antd'
import dayjs from 'dayjs'
import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react'
import {
  apiCreateMCPKey,
  apiCreateMCPRef,
  apiDeleteMCPKey,
  apiGetMCPKeyList,
} from '@/api/mcp'
import { useTransClient } from '@/app/i18n/client'
import ChooseAccountModule from '@/components/ChooseAccountModule/ChooseAccountModule'
import MCPKeyDetailModal from './MCPKeyDetailModal'
import styles from './MCPManagerModal.module.scss'

export interface IMCPManagerModalRef {
  open: () => void
  close: () => void
}

export interface IMCPManagerModalProps {
  open: boolean
  onClose: (open: boolean) => void
}

const MCPManagerModal = memo(
  forwardRef<IMCPManagerModalRef, IMCPManagerModalProps>(
    ({ open, onClose }, ref) => {
      const { t } = useTransClient('account')
      const [mcpKeys, setMcpKeys] = useState<any[]>([])
      const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
      const [selectedAccounts, setSelectedAccounts] = useState<SocialAccount[]>([])
      const [newKeyName, setNewKeyName] = useState('')
      const [loading, setLoading] = useState(false)
      const [currentPage, setCurrentPage] = useState(1)
      const [pageSize, setPageSize] = useState(10)
      const [total, setTotal] = useState(0)
      const [createForm] = Form.useForm()
      const [showAccountSelector, setShowAccountSelector] = useState(false)
      const [showDetailModal, setShowDetailModal] = useState(false)
      const [selectedKeyInfo, setSelectedKeyInfo] = useState<any>(null)

      // 获取MCP Key列表
      const fetchMCPKeys = async () => {
        try {
          setLoading(true)
          const res: any = await apiGetMCPKeyList(currentPage, pageSize)
          if (res?.code === 0) {
            setMcpKeys(res.data.list || [])
            setTotal(res.data.total || 0)
          }
        }
        catch (error) {
          message.error(t('mcpManager.fetchKeysFailed'))
        }
        finally {
          setLoading(false)
        }
      }

      // 初始化数据
      useEffect(() => {
        if (open) {
          fetchMCPKeys()
        }
      }, [open, currentPage, pageSize])

      const handleCreateKey = () => {
        setIsCreateModalOpen(true)
      }

      const handleAccountConfirm = async (accounts: SocialAccount[]) => {
        try {
          setLoading(true)

          // 创建MCP Key
          const createParams: any = {
            desc: newKeyName,
            accounts: accounts.map(account => account.id),
          }

          const createRes = await apiCreateMCPKey(createParams)
          if (createRes?.code !== 0) {
            message.error(t('mcpManager.createKeyFailed'))
            return
          }

          // 创建关联（如果选择了多个账户，需要多次请求）
          // const createdKey = (createRes.data as any)?.key
          // if (createdKey) {
          //   for (const account of accounts) {
          //     try {
          //       await apiCreateMCPRef({
          //         key: createdKey,
          //         accountId: account.id,
          //       })
          //     }
          //     catch (error) {
          //       console.error(t('mcpManager.createAssociationFailed', { account: account.account }), error)
          //     }
          //   }
          // }

          setSelectedAccounts([])
          setIsCreateModalOpen(false)
          setNewKeyName('')
          message.success(t('mcpManager.createSuccess'))
          fetchMCPKeys() // 刷新列表
        }
        catch (error) {
          message.error(t('mcpManager.createKeyFailed'))
        }
        finally {
          setLoading(false)
        }
      }

      const handleCopyKey = (key: string) => {
        navigator.clipboard.writeText(key)
        message.success(t('mcpManager.keyCopied'))
      }

      const handleDeleteKey = async (key: string) => {
        try {
          const res = await apiDeleteMCPKey(key)
          if (res?.code === 0) {
            message.success(t('mcpManager.deleteSuccess'))
            fetchMCPKeys() // 刷新列表
          }
          else {
            message.error(t('mcpManager.deleteFailed'))
          }
        }
        catch (error) {
          message.error(t('mcpManager.deleteFailed'))
        }
      }

      useImperativeHandle(ref, () => ({
        open: () => onClose(true),
        close: () => onClose(false),
      }))

      return (
        <>
          <Modal
            title={(
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyOutlined style={{ color: '#625BF2' }} />
                {t('mcpManager.title')}
              </div>
            )}
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
                {t('mcpManager.createNewKey')}
              </Button>
            </div>

            {mcpKeys.length === 0 && !loading
              ? (
                  <div className={styles.emptyState}>
                    <div className="emptyIcon">
                      <KeyOutlined />
                    </div>
                    <div className="emptyText">{t('mcpManager.noKeys')}</div>
                    <div className="emptyDesc">{t('mcpManager.noKeysDesc')}</div>
                  </div>
                )
              : (
                  <>
                    <List
                      className={styles.mcpKeyList}
                      dataSource={mcpKeys}
                      loading={loading}
                      renderItem={item => (
                        <List.Item
                          actions={[
                            <Button
                              key="copy"
                              type="link"
                              icon={<CopyOutlined />}
                              onClick={() => handleCopyKey(item.key)}
                            >
                              {t('mcpManager.copy')}
                            </Button>,
                            <Button
                              key="detail"
                              type="link"
                              icon={<KeyOutlined />}
                              onClick={() => {
                                setSelectedKeyInfo(item)
                                setShowDetailModal(true)
                              }}
                            >
                              {t('mcpManager.detail')}
                            </Button>,
                            <Button
                              key="delete"
                              type="link"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteKey(item.key)}
                              loading={loading}
                            >
                              {t('mcpManager.delete')}
                            </Button>,
                          ]}
                        >
                          <List.Item.Meta
                            avatar={<Avatar style={{ background: 'linear-gradient(90deg, #625BF2 0%, #925BF2 100%)' }}>MCP</Avatar>}
                            title={(
                              <Space>
                                <span>{item.desc}</span>
                                <Tag color={item.status === 'ACTIVE' ? 'green' : 'red'}>
                                  {item.status}
                                </Tag>
                              </Space>
                            )}
                            description={(
                              <div>
                                <div className="keyDisplay">
                                  {item.key}
                                </div>
                                <div className="keyInfo">
                                  <div className="infoItem">
                                    <span className="label">{t('mcpManager.createdAt')}</span>
                                    <span>
                                      {' '}
                                      {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                                    </span>
                                  </div>
                                  <div className="infoItem">
                                    <span className="label">{t('mcpManager.associatedAccounts')}</span>
                                    <span>
                                      {' '}
                                      {item.accountNum}
                                      {' '}
                                      {t('mcpManager.accountUnit')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
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
                          showTotal={(total, range) => t('mcpManager.pagination', { start: range[0], end: range[1], total })}
                          onChange={(page, size) => {
                            setCurrentPage(page)
                            setPageSize(size)
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
          </Modal>

          <Modal
            title={t('mcpManager.createModal.title')}
            open={isCreateModalOpen}
            onCancel={() => {
              setIsCreateModalOpen(false)
              setSelectedAccounts([])
              setNewKeyName('')
              createForm.resetFields()
            }}
            footer={null}
            width={600}
          >
            <Form
              form={createForm}
              layout="vertical"
              onFinish={(values) => {
                if (selectedAccounts.length === 0) {
                  message.warning(t('mcpManager.createModal.selectAccountsRequired'))
                  return
                }
                handleAccountConfirm(selectedAccounts)
              }}
            >
              <Form.Item
                label={t('mcpManager.createModal.keyName')}
                name="name"
                rules={[{ required: true, message: t('mcpManager.createModal.keyNameRequired') }]}
              >
                <Input
                  placeholder={t('mcpManager.createModal.keyNamePlaceholder')}
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                />
              </Form.Item>

              <Form.Item label={t('mcpManager.createModal.selectAccounts')}>
                <div style={{ minHeight: 100, border: '1px dashed #d9d9d9', padding: 16, borderRadius: 6 }}>
                  {selectedAccounts.length === 0
                    ? (
                        <div style={{ textAlign: 'center', color: '#999' }}>
                          {t('mcpManager.createModal.selectAccountsPlaceholder')}
                        </div>
                      )
                    : (
                        <div>
                          <div style={{ marginBottom: 8, fontWeight: 500 }}>
                            {t('mcpManager.createModal.selectedCount', { count: selectedAccounts.length })}
                          </div>
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
                      setShowAccountSelector(true)
                    }}
                    style={{ marginTop: 8 }}
                  >
                    {t('mcpManager.createModal.selectAccountsButton')}
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
                    {t('mcpManager.createModal.create')}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsCreateModalOpen(false)
                      setSelectedAccounts([])
                      setNewKeyName('')
                      createForm.resetFields()
                    }}
                  >
                    {t('mcpManager.createModal.cancel')}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          <ChooseAccountModule
            open={showAccountSelector}
            onClose={() => setShowAccountSelector(false)}
            onAccountConfirm={(accounts) => {
              setSelectedAccounts(accounts)
              setShowAccountSelector(false)
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
              setShowDetailModal(open)
              if (!open) {
                setSelectedKeyInfo(null)
              }
            }}
            keyInfo={selectedKeyInfo}
          />
        </>
      )
    },
  ),
)

MCPManagerModal.displayName = 'MCPManagerModal'

export default MCPManagerModal
