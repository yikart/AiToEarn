import { ForwardedRef, forwardRef, memo, useState } from 'react';
import { Button, Input, message, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAccountStore } from '../../../../store/account';
import { useShallow } from 'zustand/react/shallow';
import styles from './AccountSidebar.module.scss';
import { icpAddAccountGroup } from '../../../../icp/account';
import { defaultAccountGroupId } from '../../../../../commont/AccountEnum';
import Contextmenu from "@electron-uikit/contextmenu";

export interface IUserManageSidebarRef {}

export interface IUserManageSidebarProps {
  activeGroup: number;
  allUser: number;
  onChange: (id: number) => void;
}

const UserManageSidebar = memo(
  forwardRef(
    (
      { activeGroup, allUser, onChange }: IUserManageSidebarProps,
      ref: ForwardedRef<IUserManageSidebarRef>,
    ) => {
      const { accountGroupList, accountList, getAccountGroup } =
        useAccountStore(
          useShallow((state) => ({
            accountGroupList: state.accountGroupList,
            accountList: state.accountList,
            getAccountGroup: state.getAccountGroup,
          })),
        );
      const [openCreateGroup, setOpenCreateGroup] = useState(false);
      const [groupName, setGroupName] = useState('');
      const [createGroupLoading, setCreateGroupLoading] = useState(false);

      const createGroupCancel = () => {
        setOpenCreateGroup(false);
        setGroupName('');
      };

      return (
        <>
          <Modal
            title="新建列表"
            open={openCreateGroup}
            onCancel={createGroupCancel}
            footer={
              <>
                <Button onClick={createGroupCancel}>取消</Button>
                <Button
                  type="primary"
                  disabled={groupName.length === 0}
                  onClick={async () => {
                    setCreateGroupLoading(true);
                    await icpAddAccountGroup({
                      name: groupName,
                    });
                    await getAccountGroup();
                    setCreateGroupLoading(false);
                    createGroupCancel();
                  }}
                  loading={createGroupLoading}
                >
                  保存
                </Button>
              </>
            }
          >
            <div className={styles.createGroup}>
              <label>列表名</label>
              <Input
                value={groupName}
                placeholder="请输入列表名称"
                onChange={(e) => setGroupName(e.target.value)}
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
                  onChange(allUser);
                }}
              >
                <span className="userManage-sidebar-name">全部账号</span>
                <span className="userManage-sidebar-count">
                  {accountList.length}
                </span>
              </div>
              <div className="userManage-sidebar-list">
                <p className="userManage-sidebar-list-title">列表</p>
                {accountGroupList.map((v) => {
                  return (
                    <div
                      className={[
                        'userManage-sidebar-list-item',
                        activeGroup === v.id && 'userManage-sidebar--active',
                      ].join(' ')}
                      key={v.id}
                      onClick={() => {
                        onChange(v.id);
                      }}
                      onContextMenu={(e) => {
                        if (v.id === defaultAccountGroupId) {
                          return message.error('不能操作默认列表');
                        }
                        console.log('打开');
                      }}
                    >
                      <span className="userManage-sidebar-name">{v.name}</span>
                      <span className="userManage-sidebar-count">
                        {v.children.length}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="userManage-sidebar-bottom">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setOpenCreateGroup(true);
                }}
              >
                新建列表
              </Button>
            </div>
          </div>
        </>
      );
    },
  ),
);
UserManageSidebar.displayName = 'UserManageSidebar';

export default UserManageSidebar;
