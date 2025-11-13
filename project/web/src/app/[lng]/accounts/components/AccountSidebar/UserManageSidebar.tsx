import type { ForwardedRef } from 'react'
import type { AccountGroupItem } from '@/api/types/account.type'
import {
  ExclamationCircleFilled,
  PlusOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { ControlledMenu, MenuItem } from '@szhsin/react-menu'
import { Button, Input, message, Modal } from 'antd'
import { forwardRef, memo, useRef, useState } from 'react'
import { ReactSortable } from 'react-sortablejs'
import { useShallow } from 'zustand/react/shallow'
import {
  createAccountGroupApi,
  deleteAccountGroupApi,
  updateAccountGroupApi,
} from '@/api/account'
import { useTransClient } from '@/app/i18n/client'
import { useAccountStore } from '@/store/account'
import styles from './AccountSidebar.module.scss'
import '@szhsin/react-menu/dist/index.css'

export interface IUserManageSidebarRef {}

export interface IUserManageSidebarProps {
  activeGroup: string
  allUser: string
  onChange: (id: string) => void
  onSortEnd: () => void
}

const { confirm } = Modal

const MENU_ID = 'userManageSidebar'

const UserManageSidebar = memo(
  forwardRef(
    (
      { activeGroup, allUser, onChange, onSortEnd }: IUserManageSidebarProps,
      ref: ForwardedRef<IUserManageSidebarRef>,
    ) => {
      const { t } = useTransClient('account')
      const {
        accountGroupList,
        accountList,
        setAccountGroupList,
        getAccountGroup,
        getAccountList,
      } = useAccountStore(
        useShallow(state => ({
          accountGroupList: state.accountGroupList,
          accountList: state.accountList,
          getAccountGroup: state.getAccountGroup,
          getAccountList: state.getAccountList,
          setAccountGroupList: state.setAccountGroupList,
        })),
      )
      const [openCreateGroup, setOpenCreateGroup] = useState(false)
      const [groupName, setGroupName] = useState('')
      const [createGroupLoading, setCreateGroupLoading] = useState(false)
      // -1=新建 不然为重命名，值为要重命名的id
      const [createGroupId, setCreateGroupId] = useState('-1')
      const srcollEl = useRef<HTMLElement>(undefined)
      const [isOpen, setOpen] = useState(false)
      const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 })
      // 右键操作的数据
      const [rightClickOperateData, setRightClickOperateData]
        = useState<AccountGroupItem>()

      const createGroupCancel = () => {
        setOpenCreateGroup(false)
        setGroupName('')
      }

      return (
        <>
          <ControlledMenu
            anchorPoint={anchorPoint}
            state={isOpen ? 'open' : 'closed'}
            direction="right"
            onClose={() => setOpen(false)}
          >
            <MenuItem
              onClick={() => {
                setCreateGroupId(rightClickOperateData!.id)
                setOpenCreateGroup(true)
                setGroupName(rightClickOperateData!.name)
              }}
            >
              {t('userManageSidebar.rename')}
            </MenuItem>
            <MenuItem
              onClick={() => {
                confirm({
                  title: t('userManageSidebar.confirmDelete'),
                  icon: <ExclamationCircleFilled />,
                  content: (
                    <>
                      {t('userManageSidebar.confirmDeleteContent')}
                      <span
                        style={{
                          color: 'var(--colorPrimary6)',
                        }}
                      >
                        {rightClickOperateData?.name}
                      </span>
                      ？
                    </>
                  ),
                  onOk: async () => {
                    await deleteAccountGroupApi([rightClickOperateData!.id])
                    await getAccountGroup()
                    message.success(t('userManageSidebar.deleteSuccess'))
                  },
                })
              }}
            >
              {t('userManageSidebar.delete')}
            </MenuItem>
          </ControlledMenu>

          <Modal
            open={openCreateGroup}
            title={createGroupId === '-1' ? t('userManageSidebar.createSpaceTitle') : t('userManageSidebar.renameSpaceTitle')}
            onCancel={createGroupCancel}
            footer={(
              <>
                <Button onClick={createGroupCancel}>{t('userManageSidebar.cancel')}</Button>
                <Button
                  type="primary"
                  onClick={async () => {
                    setCreateGroupLoading(true)
                    if (createGroupId === '-1') {
                      await createAccountGroupApi({
                        name: groupName,
                      })
                    }
                    else {
                      await updateAccountGroupApi({
                        name: groupName,
                        id: createGroupId,
                      })
                    }

                    await getAccountGroup()
                    setCreateGroupLoading(false)
                    createGroupCancel()
                  }}
                  loading={createGroupLoading}
                >
                  {t('userManageSidebar.save')}
                </Button>
              </>
            )}
          >
            <div className={styles.createGroup}>
              <label>{t('userManageSidebar.spaceName')}</label>
              <Input
                value={groupName}
                placeholder={t('userManageSidebar.spaceNamePlaceholder')}
                onChange={e => setGroupName(e.target.value)}
              />
            </div>
          </Modal>

          <div className="userManage-sidebar">
            <div className="userManage-sidebar-top">
              <div
                className={[
                  'userManage-sidebar-allUser',
                  activeGroup === allUser && 'userManage-sidebar--active',
                ].join(' ')}
                onClick={() => {
                  onChange(allUser)
                }}
              >
                <span className="userManage-sidebar-name">{t('userManageSidebar.allAccounts')}</span>
                <span className="userManage-sidebar-count">
                  {accountList.length}
                </span>
              </div>
              <div className="userManage-sidebar-list">
                <p className="userManage-sidebar-list-title">{t('userManageSidebar.spaces')}</p>

                <ReactSortable
                  className="userManage-sidebar-list-sortable"
                  list={accountGroupList}
                  animation={250}
                  onEnd={async () => {
                    onSortEnd()
                  }}
                  setList={setAccountGroupList}
                  scrollSensitivity={100}
                  scroll={srcollEl.current}
                  scrollSpeed={15}
                  handle=".userManage-sidebar-sortHandle"
                  id="id"
                >
                  {accountGroupList.map((v) => {
                    return (
                      <div
                        className={[
                          'userManage-sidebar-list-item',
                          activeGroup === v.id && 'userManage-sidebar--active',
                        ].join(' ')}
                        key={v.id}
                        onClick={() => {
                          onChange(v.id)
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          if (v.isDefault) {
                            return message.error(t('userManageSidebar.cannotOperateDefault'))
                          }
                          setAnchorPoint({ x: e.clientX, y: e.clientY })
                          setOpen(true)
                          setRightClickOperateData(v)
                        }}
                      >
                        <div className="userManage-sidebar-left">
                          <div className="userManage-sidebar-sortHandle">
                            <UnorderedListOutlined />
                          </div>
                          <span className="userManage-sidebar-name">
                            {v.name}
                          </span>
                        </div>
                        <span className="userManage-sidebar-count">
                          {v.children.length}
                        </span>
                      </div>
                    )
                  })}
                </ReactSortable>
              </div>
            </div>
            <div className="userManage-sidebar-bottom">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setCreateGroupId('-1')
                  setOpenCreateGroup(true)
                }}
              >
                {t('userManageSidebar.createSpace')}
              </Button>
            </div>
          </div>
        </>
      )
    },
  ),
)
UserManageSidebar.displayName = 'UserManageSidebar'

export default UserManageSidebar
