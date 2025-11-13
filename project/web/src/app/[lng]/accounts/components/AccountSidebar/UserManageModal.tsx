import type {
  TableProps,
} from 'antd'
import type {
  ForwardedRef,
} from 'react'
import type { SocialAccount } from '@/api/types/account.type'
import type { IpLocationInfo } from '@/utils/ipLocation'
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Drawer,
  message,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tooltip,
} from 'antd'
import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useShallow } from 'zustand/react/shallow'
import { deleteAccountsApi, updateAccountApi } from '@/api/account'
import DeleteUserConfirmModal from '@/app/[lng]/accounts/components/AccountSidebar/DeleteUserConfirmModal'
import { AccountStatus } from '@/app/config/accountConfig'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import AvatarPlat from '@/components/AvatarPlat'
import { useAccountStore } from '@/store/account'
import { extractCountry, formatLocationInfo, getIpLocation } from '@/utils/ipLocation'
import AddAccountModal from '../AddAccountModal'
import styles from './AccountSidebar.module.scss'
import UserManageSidebar from './UserManageSidebar'

export interface IUserManageModalRef {
  setActiveGroup: (groupId: string) => void
}

export interface IUserManageModalProps {
  open: boolean
  onCancel: () => void
}

function UserGroupSelect({
  account,
  onChange,
}: {
  account: SocialAccount
  onChange: (groupId: string) => void
}) {
  const { accountGroupList } = useAccountStore(
    useShallow(state => ({
      accountGroupList: state.accountGroupList,
    })),
  )

  return (
    <Select
      // @ts-ignore
      value={account.groupId}
      style={{ width: '160px' }}
      fieldNames={{
        value: 'id',
        label: 'name',
      }}
      options={accountGroupList}
      onChange={onChange}
    />
  )
}

// 空间信息展示组件
function SpaceInfoCard({
  activeGroup,
  accountGroupList,
  allUser,
}: {
  activeGroup: string
  accountGroupList: any[]
  allUser: string
}) {
  const { t } = useTransClient('account')
  const [ipLocationInfo, setIpLocationInfo] = useState<IpLocationInfo | null>(null)
  const [ipLocationLoading, setIpLocationLoading] = useState(false)

  // 获取IP地理位置信息
  useEffect(() => {
    const fetchIpLocation = async () => {
      try {
        setIpLocationLoading(true)
        const info = await getIpLocation()
        setIpLocationInfo(info)
      }
      catch (error) {
        console.error('获取IP地理位置信息失败:', error)
      }
      finally {
        setIpLocationLoading(false)
      }
    }

    // 只在组件挂载时获取一次IP信息
    fetchIpLocation()
  }, [])

  // 如果是全部账号，不显示信息卡片
  if (activeGroup === allUser) {
    return null
  }

  // 获取当前选中的空间信息
  const currentSpace = accountGroupList.find(group => group.id === activeGroup)
  if (!currentSpace)
    return null

  return (
    <Card
      size="small"
      style={{
        marginBottom: '16px',
        backgroundColor: 'var(--grayColor1)',
        border: '1px solid var(--grayColor3)',
      }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: 'var(--fs-xs)',
            color: 'var(--grayColor6)',
            backgroundColor: 'var(--grayColor2)',
            padding: '2px 8px',
            borderRadius: '12px'
          }}>
            {currentSpace.children?.length || 0} 个账号
          </span>
        </div> */}

        {/* 根据proxyIp判断显示IP和属地信息 */}
        {(!currentSpace.proxyIp || currentSpace.proxyIp === '') ? (
          // 本地IP显示
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px',
            backgroundColor: 'var(--grayColor2)',
            borderRadius: '6px',
          }}
          >
            <GlobalOutlined style={{ color: 'var(--colorPrimary5)' }} />
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--grayColor7)' }}>
              {t('ipInfo.loading')}
            </span>
            {ipLocationLoading
              ? (
                  <span style={{ color: 'var(--colorPrimary5)', fontStyle: 'italic' }}>
                    {t('ipInfo.loading')}
                  </span>
                )
              : ipLocationInfo
                ? (
                    <Tooltip title={t('ipInfo.tooltip', { asn: ipLocationInfo.asn, org: ipLocationInfo.org })}>
                      <span style={{
                        color: 'var(--grayColor7)',
                        cursor: 'help',
                        fontWeight: '500',
                      }}
                      >
                        {formatLocationInfo(ipLocationInfo)}
                      </span>
                    </Tooltip>
                  )
                : (
                    <span style={{ color: 'var(--errorColor)', fontStyle: 'italic' }}>
                      {t('ipInfo.error')}
                    </span>
                  )}
          </div>
        )
          : (
              currentSpace.ip && currentSpace.location && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                  backgroundColor: 'var(--grayColor2)',
                  borderRadius: '6px',
                }}
                >
                  <GlobalOutlined style={{ color: 'var(--colorPrimary5)' }} />
                  <Tooltip title={`IP: ${currentSpace.ip}\n位置: ${currentSpace.location}`}>
                    <span style={{
                      color: 'var(--grayColor7)',
                      cursor: 'help',
                      fontWeight: '500',
                    }}
                    >
                      {extractCountry(currentSpace.location)}
                      {' '}
                      |
                      {currentSpace.ip}
                    </span>
                  </Tooltip>
                </div>
              )
            )}

        {/* 空间创建时间等信息 */}
        <div style={{
          fontSize: 'var(--fs-xs)',
          color: 'var(--grayColor6)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
        >
          <EnvironmentOutlined />
          <span>
            空间ID:
            {currentSpace.id}
          </span>
          {currentSpace.isDefault && (
            <span style={{
              color: 'var(--colorPrimary5)',
              backgroundColor: 'var(--colorPrimary1)',
              padding: '1px 6px',
              borderRadius: '10px',
              fontSize: 'var(--fs-xs)',
            }}
            >
              defaultSpace
            </span>
          )}
        </div>
      </Space>
    </Card>
  )
}

const UserManageModal = memo(
  forwardRef(
    (
      { open, onCancel }: IUserManageModalProps,
      ref: ForwardedRef<IUserManageModalRef>,
    ) => {
      const { t } = useTransClient('account')
      const { accountList, getAccountList, accountGroupList, accountMap }
        = useAccountStore(
          useShallow(state => ({
            accountList: state.accountList,
            getAccountList: state.getAccountList,
            accountGroupList: state.accountGroupList,
            accountMap: state.accountMap,
          })),
        )
      const [deleteHitOpen, setDeleteHitOpen] = useState(false)
      const [selectedRows, setSelectedRows] = useState<SocialAccount[]>([])
      // 全部账号
      const allUser = useRef('-1')
      // -1=全部账号，不然为对应分组 ID
      const [activeGroup, setActiveGroup] = useState(allUser.current)
      // 是否改变了顺序
      const isUpdateRank = useRef(false)
      const [deleteLoading, setDeleteLoading] = useState(false)
      const [cutLoading, setCutLoading] = useState(false)
      const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)
      const [targetGroupIdForModal, setTargetGroupIdForModal] = useState<string | undefined>(undefined)

      const columns = useMemo(() => {
        const columns: TableProps<SocialAccount>['columns'] = [
          {
            title: t('userManageModal.account'),
            render: (text, am) => {
              return (
                <div
                  className={`userManage-content-user ${am.status === AccountStatus.DISABLE ? 'userManage-content-user--disable' : ''}`}
                >
                  {/* <Avatar src={am.avatar} /> */}
                  <AvatarPlat account={am} size="large" />
                  <span
                    className="userManage-content-user-name"
                    title={am.nickname}
                  >
                    {am.nickname}
                  </span>
                </div>
              )
            },
            width: 200,
            key: 'nickname',
          },
          {
            title: t('userManageModal.platform'),
            render: (text, am) => {
              const platInfo = AccountPlatInfoMap.get(am.type)!
              return (
                <div className="userManage-content-plat">
                  <Tooltip title={platInfo?.name}>
                    <img
                      src={platInfo?.icon}
                      style={{
                        width: '20px',
                        height: '20px',
                      }}
                    />
                  </Tooltip>
                </div>
              )
            },
            width: 80,
            key: 'nickname',
          },
          {
            title: t('accountStatus'),
            render: (text, am) => {
              return (
                <>
                  {am.status === AccountStatus.USABLE
                    ? (
                        <>
                          <CheckCircleOutlined
                            style={{
                              color: 'var(--successColor)',
                              marginRight: '3px',
                            }}
                          />
                          {t('online')}
                        </>
                      )
                    : (
                        <>
                          <WarningOutlined
                            style={{
                              color: 'var(--warningColor)',
                              marginRight: '3px',
                            }}
                          />
                          {t('offline')}
                        </>
                      )}
                </>
              )
            },
            width: 100,
            key: 'nickname',
          },
          {
            title: t('userManageModal.space'),
            render: (text, am) => {
              return (
                <UserGroupSelect
                  account={am}
                  onChange={async (groupId) => {
                    setCutLoading(true)
                    await updateAccountGroupRank()
                    await updateAccountApi({
                      id: am.id,
                      groupId,
                    })
                    await getAccountList()
                    setCutLoading(false)
                  }}
                />
              )
            },
            width: 200,
            key: 'groupId',
          },
        ]
        return columns
      }, [])

      const rowSelection: TableProps<SocialAccount>['rowSelection'] = {
        onChange: (
          selectedRowKeys: React.Key[],
          selectedRows: SocialAccount[],
        ) => {
          setSelectedRows(selectedRows)
        },
        getCheckboxProps: (record: SocialAccount) => ({
          name: record.nickname,
        }),
        selectedRowKeys: selectedRows.map(v => v.id),
      }

      const close = () => {
        onCancel()
        setSelectedRows([])
        updateAccountGroupRank()
      }

      // 更新账户组顺序
      const updateAccountGroupRank = async () => {
        if (isUpdateRank.current) {
          const accountGroupList = useAccountStore.getState().accountGroupList
          for (let i = 0; i < accountGroupList.length; i++) {
            const v = accountGroupList[i]
            // 这里不需要更新数据，因为在排序完成后已经更新了全局的sotre，引用sotre的所有位置都会发生更改
            // TODO 排序更新
            // await icpEditDeleteAccountGroup({
            //   id: v.id,
            //   rank: i,
            // });
          }
          isUpdateRank.current = false
        }
      }

      const accountListLast = useMemo(() => {
        if (activeGroup === allUser.current) {
          return accountList
        }
        return accountGroupList.find(v => v.id === activeGroup)?.children
      }, [accountMap, activeGroup, accountGroupList])

      const imperativeHandle: IUserManageModalRef = {
        setActiveGroup,
      }
      useImperativeHandle(ref, () => imperativeHandle)

      const openAddAccountFlow = async () => {
        const currentGroupId = activeGroup
        close()
        if (currentGroupId === allUser.current) {
          // 如果选择的是"全部账号"，需要用户选择空间
          setIsAddAccountOpen(true)
        }
        else {
          // 如果选择的是具体空间，直接使用该空间
          setTargetGroupIdForModal(currentGroupId)
          setIsAddAccountOpen(true)
        }
      }

      return (
        <>
          <DeleteUserConfirmModal
            deleteUsers={selectedRows}
            open={deleteHitOpen}
            onClose={() => setDeleteHitOpen(false)}
            onDeleteSuccess={async () => {
              await getAccountList()
              setSelectedRows([])
              message.success('删除成功')
            }}
          />

          <Modal
            open={open}
            title={t('accountManager')}
            zIndex={1001}
            footer={null}
            width={1000}
            onCancel={close}
            rootClassName={styles.userManageModal}
          >
            <Spin spinning={cutLoading}>
              <div className={styles.userManage}>
                <UserManageSidebar
                  allUser={allUser.current}
                  activeGroup={activeGroup}
                  onChange={setActiveGroup}
                  onSortEnd={() => {
                    isUpdateRank.current = true
                  }}
                />

                <div className="userManage-content">
                  {/* 空间信息卡片 - 显示在右侧上方 */}
                  <SpaceInfoCard
                    activeGroup={activeGroup}
                    accountGroupList={accountGroupList}
                    allUser={allUser.current}
                  />

                  <div className="userManage-content-head" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button type="primary" onClick={openAddAccountFlow}>{t('addAccount')}</Button>
                  </div>
                  <Table<SocialAccount>
                    columns={columns}
                    dataSource={accountListLast}
                    rowKey="id"
                    scroll={{ y: '100%' }}
                    rowSelection={{ type: 'checkbox', ...rowSelection }}
                  />

                  <Drawer
                    title={(
                      <>
                        已选择
                        <span style={{ color: 'var(--successColor)' }}>
                          {selectedRows.length}
                        </span>
                        个账号
                      </>
                    )}
                    placement="bottom"
                    mask={false}
                    height={150}
                    closable={true}
                    onClose={() => {
                      setSelectedRows([])
                    }}
                    open={selectedRows.length !== 0}
                    getContainer={false}
                  >
                    <div className="userManage-content-multiple">
                      <div
                        className="userManage-content-multiple-item"
                        onClick={() => {
                          setDeleteHitOpen(true)
                        }}
                      >
                        <div className="userManage-content-multiple-item-icon">
                          <DeleteOutlined />
                        </div>
                        <span>删除账号</span>
                      </div>
                    </div>
                  </Drawer>
                </div>
              </div>
            </Spin>
          </Modal>

          <AddAccountModal
            open={isAddAccountOpen}
            onClose={async () => {
              setIsAddAccountOpen(false)
              setTargetGroupIdForModal(undefined)
            }}
            onAddSuccess={async (acc) => {
              // 账号已经在授权时直接添加到指定空间，无需额外移动
              await getAccountList()
            }}
            targetGroupId={targetGroupIdForModal}
            showSpaceSelector={activeGroup === allUser.current}
          />
        </>
      )
    },
  ),
)
UserManageModal.displayName = 'UserManageModal'

export default UserManageModal
