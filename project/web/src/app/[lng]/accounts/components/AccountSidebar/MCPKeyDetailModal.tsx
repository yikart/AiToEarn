/**
 * MCPKeyDetailModal - MCP 密钥详情弹窗
 * 展示 MCP 密钥详情和关联账户列表
 */

import type { PlatType } from '@/app/config/platConfig'
import { CopyOutlined, DeleteOutlined, KeyOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Empty, List, Pagination, Popconfirm, Space, Tag } from 'antd'
import { toast } from '@/lib/toast'
import { Modal } from '@/components/ui/modal'
import React, { forwardRef, memo, useEffect, useImperativeHandle, useState } from 'react'
import { apiDeleteMCPRef, apiGetMCPRefList } from '@/api/mcp'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import styles from './MCPKeyDetailModal.module.scss'

export interface IMCPKeyDetailModalRef {
  open: (keyInfo: any) => void
  close: () => void
}

export interface IMCPKeyDetailModalProps {
  open: boolean
  onClose: (open: boolean) => void
  keyInfo?: any
}

const MCPKeyDetailModal = memo(
  forwardRef<IMCPKeyDetailModalRef, IMCPKeyDetailModalProps>(
    ({ open, onClose, keyInfo: propKeyInfo }, ref) => {
      const { t } = useTransClient('account')
      const [keyInfo, setKeyInfo] = useState<any>(null)
      const [refList, setRefList] = useState<any[]>([])
      const [loading, setLoading] = useState(false)
      const [currentPage, setCurrentPage] = useState(1)
      const [pageSize, setPageSize] = useState(10)
      const [total, setTotal] = useState(0)

      // Get platform information
      const getPlatformInfo = (platformType: string) => {
        const platInfo = AccountPlatInfoMap.get(platformType as PlatType)
        return {
          name: platInfo?.name || t('unknownPlatform'),
          icon: platInfo?.icon || '',
          themeColor: platInfo?.themeColor || '#999',
        }
      }

      // Fetch associated accounts list
      const fetchRefList = async () => {
        if (!keyInfo?.key)
          return

        try {
          setLoading(true)
          const res: any = await apiGetMCPRefList(currentPage, pageSize, keyInfo.key)
          if (res?.code === 0) {
            // API returns account data directly (no need to map)
            const refListData = res.data.list || []
            setRefList(refListData)
            setTotal(res.data.total || 0)
          }
        }
        catch (error) {
          toast.error(t('mcpManager.keyDetail.fetchAccountsFailed' as any))
        }
        finally {
          setLoading(false)
        }
      }

      useEffect(() => {
        if (open && keyInfo) {
          fetchRefList()
        }
      }, [open, keyInfo, currentPage, pageSize])

      const handleCopyKey = (key: string) => {
        navigator.clipboard.writeText(key)
        toast.success(t('mcpManager.keyCopied' as any))
      }

      const handleUnlinkAccount = async (accountId: string) => {
        try {
          const res = await apiDeleteMCPRef({
            key: keyInfo.key,
            accountId,
          })
          if (res?.code === 0) {
            toast.success(t('mcpManager.keyDetail.unlinkSuccess' as any))
            fetchRefList() // Refresh list
          }
          else {
            toast.error(t('mcpManager.keyDetail.unlinkFailed' as any))
          }
        }
        catch (error) {
          toast.error(t('mcpManager.keyDetail.unlinkFailed' as any))
        }
      }

      // 当props中的keyInfo变化时，更新内部状态
      useEffect(() => {
        if (propKeyInfo) {
          setKeyInfo(propKeyInfo)
          setCurrentPage(1)
          setRefList([])
          setTotal(0)
        }
      }, [propKeyInfo])

      useImperativeHandle(ref, () => ({
        open: (keyInfo: any) => {
          setKeyInfo(keyInfo)
          setCurrentPage(1)
          setRefList([])
          setTotal(0)
        },
        close: () => {
          setKeyInfo(null)
          setRefList([])
          setTotal(0)
        },
      }))

      return (
        <Modal
          title={(
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <KeyOutlined style={{ color: '#625BF2' }} />
              {t('mcpManager.keyDetail.title' as any)}
            </div>
          )}
          open={open}
          onCancel={() => onClose(false)}
          footer={null}
          width={800}
          className={styles.mcpKeyDetailModal}
        >
          {keyInfo && (
            <>
              {/* Key basic information */}
              <div className={styles.keyInfo}>
                <div className={styles.keyHeader}>
                  <div className={styles.keyName}>
                    <span className={styles.label}>{t('mcpManager.keyDetail.keyName' as any)}</span>
                    <span className={styles.value}>{keyInfo.desc}</span>
                  </div>
                  <Space>
                    <Tag color={keyInfo.status === 'ACTIVE' ? 'green' : 'red'}>
                      {keyInfo.status}
                    </Tag>
                    <Button
                      type="link"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopyKey(keyInfo.key)}
                    >
                      {t('mcpManager.keyDetail.copyKey' as any)}
                    </Button>
                  </Space>
                </div>

                <div className={styles.keyValue}>
                  <span className={styles.label}>{t('mcpManager.keyDetail.keyValue' as any)}</span>
                  <span className={styles.value}>{keyInfo.key}</span>
                </div>

                <div className={styles.keyMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.label}>{t('mcpManager.keyDetail.createdTime' as any)}</span>
                    <span>{keyInfo.createdAt}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.label}>{t('mcpManager.keyDetail.associatedAccounts' as any)}</span>
                    <span>{t('mcpManager.keyDetail.accountsCount' as any, { count: total })}</span>
                  </div>
                </div>
              </div>

              {/* Associated accounts list */}
              <div className={styles.refList}>
                <div className={styles.sectionTitle}>
                  <UserOutlined />
                  {t('mcpManager.keyDetail.associatedAccountsList' as any)}
                </div>

                {refList.length === 0 && !loading
                  ? (
                      <div className={styles.emptyState}>
                        <Empty description={t('mcpManager.keyDetail.noAccounts' as any)} />
                      </div>
                    )
                  : (
                      <>
                        <List
                          className={styles.refList}
                          dataSource={refList}
                          loading={loading}
                          renderItem={(item) => {
                            const platformInfo = getPlatformInfo(item.accountType)
                            return (
                              <List.Item
                                actions={[
                                  <Popconfirm
                                    title={t('mcpManager.keyDetail.unlinkConfirm' as any)}
                                    onConfirm={() => handleUnlinkAccount(item.accountId)}
                                    okText={t('mcpManager.keyDetail.ok' as any)}
                                    cancelText={t('mcpManager.keyDetail.cancel' as any)}
                                  >
                                    <Button
                                      key="unlink"
                                      type="link"
                                      danger
                                      icon={<DeleteOutlined />}
                                    >
                                      {t('mcpManager.keyDetail.unlinkButton' as any)}
                                    </Button>
                                  </Popconfirm>,
                                ]}
                              >
                                <List.Item.Meta
                                  avatar={item.avatar ? <Avatar src={item.avatar} /> : <Avatar icon={<UserOutlined />} />}
                                  title={item.name || item.nickname || item.accountId}
                                  description={(
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {platformInfo.icon && (
                                          <img
                                            src={platformInfo.icon}
                                            alt={platformInfo.name}
                                            style={{
                                              width: '16px',
                                              height: '16px',
                                              borderRadius: '2px',
                                            }}
                                          />
                                        )}
                                        <span style={{ color: platformInfo.themeColor }}>
                                          {platformInfo.name}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                />
                              </List.Item>
                            )
                          }}
                        />

                        {total > 0 && (
                          <div style={{ marginTop: 16, textAlign: 'right' }}>
                            <Pagination
                              current={currentPage}
                              pageSize={pageSize}
                              total={total}
                              showSizeChanger
                              showQuickJumper
                              showTotal={(total, range) => t('mcpManager.keyDetail.paginationText' as any, { start: range[0], end: range[1], total })}
                              onChange={(page, size) => {
                                setCurrentPage(page)
                                setPageSize(size)
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
      )
    },
  ),
)

MCPKeyDetailModal.displayName = 'MCPKeyDetailModal'

export default MCPKeyDetailModal
