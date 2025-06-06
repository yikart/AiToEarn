import { ForwardedRef, forwardRef, memo, useRef, useState } from "react";
import { Button, Input, message, Modal } from "antd";
import {
  ExclamationCircleFilled,
  PlusOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useAccountStore } from "@/store/account";
import { useShallow } from "zustand/react/shallow";
import styles from "./AccountSidebar.module.scss";
import { ReactSortable } from "react-sortablejs";
import { ControlledMenu, MenuItem } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/index.css";
import {
  createAccountGroupApi,
  deleteAccountGroupApi,
  updateAccountGroupApi,
} from "@/api/account";
import { AccountGroupItem } from "@/api/types/account.type";

export interface IUserManageSidebarRef {}

export interface IUserManageSidebarProps {
  activeGroup: number;
  allUser: number;
  onChange: (id: number) => void;
  onSortEnd: () => void;
}

const { confirm } = Modal;

const MENU_ID = "userManageSidebar";

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
      const [groupName, setGroupName] = useState("");
      const [createGroupLoading, setCreateGroupLoading] = useState(false);
      // -1=新建 不然为重命名，值为要重命名的id
      const [createGroupId, setCreateGroupId] = useState(0);
      const srcollEl = useRef<HTMLElement>(undefined);
      const [isOpen, setOpen] = useState(false);
      const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
      // 右键操作的数据
      const [rightClickOperateData, setRightClickOperateData] =
        useState<AccountGroupItem>();

      const createGroupCancel = () => {
        setOpenCreateGroup(false);
        setGroupName("");
      };

      return (
        <>
          <ControlledMenu
            anchorPoint={anchorPoint}
            state={isOpen ? "open" : "closed"}
            direction="right"
            onClose={() => setOpen(false)}
          >
            <MenuItem
              onClick={() => {
                setCreateGroupId(rightClickOperateData!.id);
                setOpenCreateGroup(true);
                setGroupName(rightClickOperateData!.name);
              }}
            >
              重命名
            </MenuItem>
            <MenuItem
              onClick={() => {
                confirm({
                  title: "提示",
                  icon: <ExclamationCircleFilled />,
                  content: (
                    <>
                      请确认是否删除列表：
                      <span
                        style={{
                          color: "var(--colorPrimary6)",
                        }}
                      >
                        {rightClickOperateData!.name}
                      </span>
                      ，删除后该列表下的账号将被移动到
                      <span
                        style={{
                          color: "var(--colorPrimary6)",
                        }}
                      >
                        默认列表
                      </span>
                      中
                    </>
                  ),
                  async onOk() {
                    const res = await deleteAccountGroupApi([
                      rightClickOperateData!.id,
                    ]);
                    if (res?.data) {
                      message.success("删除成功！");
                      await getAccountList();
                    }
                  },
                });
              }}
            >
              删除
            </MenuItem>
          </ControlledMenu>

          <Modal
            title={createGroupId === -1 ? "新建列表" : "重命名列表"}
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
                      await createAccountGroupApi({
                        name: groupName,
                      });
                    } else {
                      await updateAccountGroupApi({
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
                  "userManage-sidebar-allUser",
                  activeGroup === allUser && "userManage-sidebar--active",
                ].join(" ")}
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
                          "userManage-sidebar-list-item",
                          activeGroup === v.id && "userManage-sidebar--active",
                        ].join(" ")}
                        key={v.id}
                        onClick={() => {
                          onChange(v.id);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (v.isDefault) {
                            return message.error("不能操作默认列表");
                          }
                          setAnchorPoint({ x: e.clientX, y: e.clientY });
                          setOpen(true);
                          setRightClickOperateData(v);
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
UserManageSidebar.displayName = "UserManageSidebar";

export default UserManageSidebar;
