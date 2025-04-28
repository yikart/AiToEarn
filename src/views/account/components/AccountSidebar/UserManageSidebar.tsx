import { ForwardedRef, forwardRef, memo, useRef, useState } from 'react';
import { Button, Input, message, Modal } from 'antd';
import {
  ExclamationCircleFilled,
  PlusOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useAccountStore } from '../../../../store/account';
import { useShallow } from 'zustand/react/shallow';
import styles from './AccountSidebar.module.scss';
import {
  icpEditDeleteAccountGroup,
  icpAddAccountGroup,
  icpDeleteAccountGroup,
} from '../../../../icp/account';
import { defaultAccountGroupId } from '../../../../../commont/AccountEnum';
import { Menu, MenuItem } from '@electron-uikit/contextmenu/renderer';
import { ReactSortable } from 'react-sortablejs';

export interface IUserManageSidebarRef {}

export interface IUserManageSidebarProps {
  activeGroup: number;
  allUser: number;
  onChange: (id: number) => void;
  onSortEnd: () => void;
}

const { confirm } = Modal;

const UserManageSidebar = memo(
  forwardRef(
    (
      { activeGroup, allUser, onChange, onSortEnd }: IUserManageSidebarProps,
      ref: ForwardedRef<IUserManageSidebarRef>,
    ) => {
      const {
        accountGroupList,
        accountList,
        setAccountGroupList,
        getAccountGroup,
        getAccountList,
      } = useAccountStore(
        useShallow((state) => ({
          accountGroupList: state.accountGroupList,
          accountList: state.accountList,
          getAccountGroup: state.getAccountGroup,
          getAccountList: state.getAccountList,
          setAccountGroupList: state.setAccountGroupList,
        })),
      );
      const [openCreateGroup, setOpenCreateGroup] = useState(false);
      const [groupName, setGroupName] = useState('');
      const [createGroupLoading, setCreateGroupLoading] = useState(false);
      // -1=新建 不然为重命名，值为要重命名的id
      const [createGroupId, setCreateGroupId] = useState(0);
      const srcollEl = useRef<HTMLElement>(undefined);

      const createGroupCancel = () => {
        setOpenCreateGroup(false);
        setGroupName('');
      };

      return (
        <>
          <Modal
            title={createGroupId === -1 ? '新建列表' : '重命名列表'}
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
                    if (createGroupId === -1) {
                      await icpAddAccountGroup({
                        name: groupName,
                      });
                    } else {
                      await icpEditDeleteAccountGroup({
                        name: groupName,
                        id: createGroupId,
                      });
                    }

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

                <ReactSortable
                  className="userManage-sidebar-list-sortable"
                  list={accountGroupList}
                  animation={250}
                  onEnd={async () => {
                    onSortEnd();
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
                          onChange(v.id);
                        }}
                        onContextMenu={(e) => {
                          if (v.id === defaultAccountGroupId) {
                            return message.error('不能操作默认列表');
                          }
                          e.preventDefault();

                          const menu = new Menu();
                          menu.append(
                            new MenuItem({
                              label: '重命名',
                              click: () => {
                                setCreateGroupId(v.id);
                                setOpenCreateGroup(true);
                                setGroupName(v.name);
                              },
                            }),
                          );
                          menu.append(
                            new MenuItem({
                              label: '删除',
                              click: () => {
                                confirm({
                                  title: '提示',
                                  icon: <ExclamationCircleFilled />,
                                  content: (
                                    <>
                                      请确认是否删除列表：
                                      <span
                                        style={{
                                          color: 'var(--colorPrimary6)',
                                        }}
                                      >
                                        {v.name}
                                      </span>
                                      ，删除后该列表下的账号将被移动到
                                      <span
                                        style={{
                                          color: 'var(--colorPrimary6)',
                                        }}
                                      >
                                        默认列表
                                      </span>
                                      中
                                    </>
                                  ),
                                  async onOk() {
                                    await icpDeleteAccountGroup(v.id);
                                    await getAccountList();
                                  },
                                });
                              },
                            }),
                          );
                          menu.popup();
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
                    );
                  })}
                </ReactSortable>
              </div>
            </div>
            <div className="userManage-sidebar-bottom">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setCreateGroupId(-1);
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
