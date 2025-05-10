import {
  ForwardedRef,
  forwardRef,
  memo,
  useMemo,
  useRef,
  useState,
} from 'react';
import styles from './AccountSidebar.module.scss';
import { AccountInfo, AccountPlatInfoMap } from '../../comment';
import { Avatar, Button, Collapse, message, Popover, Tooltip } from 'antd';
import { accountLogin, acpAccountLoginCheck } from '@/icp/account';
import AddAccountModal from '../AddAccountModal';
import {
  AccountStatus,
  AccountType,
  defaultAccountGroupId,
  XhsAccountAbnormal,
} from '@@/AccountEnum';
import Icon, {
  CheckCircleOutlined,
  PlusOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import PubAccountDetModule, {
  IPubAccountDetModuleRef,
} from '../../../publish/components/PubAccountDetModule/PubAccountDetModule';
import { useShallow } from 'zustand/react/shallow';
import { useAccountStore } from '@/store/account';
import UserManageModal, { IUserManageModalRef } from './UserManageModal';
import ProxyManage from '@/views/account/components/AccountSidebar/ProxyManage';
import ProxyIcon from '@/assets/svgs/proxy.svg?react';
import { AccountModel } from '../../../../../electron/db/models/account';

export interface IAccountSidebarRef {}

export interface IAccountSidebarProps {
  // 选择的账户id
  activeAccountId: number;
  // 切换选择的账户
  onAccountChange: (info: AccountInfo) => void;
  // 排除的平台类型
  excludePlatforms?: AccountType[];
}

const AccountStatusView = ({ account }: { account: AccountModel }) => {
  if (
    account.type === AccountType.Xhs &&
    account.abnormalStatus &&
    account.abnormalStatus[AccountType.Xhs] === XhsAccountAbnormal.Abnormal
  ) {
    return (
      <Tooltip title="账号状态异常，无法发布作品，请检查后重试！">
        <WarningOutlined style={{ color: 'var(--warningColor)' }} />
        异常
      </Tooltip>
    );
  }

  if (account.status === AccountStatus.USABLE) {
    return (
      <>
        <CheckCircleOutlined style={{ color: 'var(--successColor)' }} />
        在线
      </>
    );
  }

  return (
    <>
      <WarningOutlined style={{ color: 'var(--warningColor)' }} />
      离线
    </>
  );
};

const AccountPopoverInfo = ({ accountInfo }: { accountInfo: AccountInfo }) => {
  const platInfo = AccountPlatInfoMap.get(accountInfo.type)!;
  const [detLoading, setDetLoading] = useState(false);

  return (
    <div
      className={styles.accountPopoverInfo}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="accountPopoverInfo_top">
        <Avatar src={accountInfo.avatar} size="large" />
        <div className="accountPopoverInfo_top-right">
          <div className="accountPopoverInfo-item">
            <p>昵称：</p>
            <p>{accountInfo.nickname}</p>
          </div>
          <div className="accountPopoverInfo-item">
            <p>平台：</p>
            <p>
              <img src={platInfo.icon} />
              {platInfo.name}
            </p>
          </div>
        </div>
      </div>

      <div className="accountPopoverInfo-item">
        <p>登录状态：</p>
        <p>
          <AccountStatusView account={accountInfo} />
          <Button
            type="link"
            style={{ padding: '0 0 0 5px' }}
            loading={detLoading}
            onClick={async () => {
              setDetLoading(true);
              const res = await acpAccountLoginCheck(
                accountInfo!.type,
                accountInfo!.uid,
              );
              message.success(
                `登录状态检测完成：${res.status === AccountStatus.USABLE ? '在线' : '离线，请重新登录'}`,
              );
              setTimeout(async () => {
                setDetLoading(false);
                if (res.status === AccountStatus.DISABLE) {
                  const res = await accountLogin(accountInfo.type);
                  if (!res) return;
                  message.success('账号更新成功！');
                }
              }, 500);
            }}
          >
            登录状态检测
          </Button>
        </p>
      </div>
    </div>
  );
};

const AccountSidebar = memo(
  forwardRef(
    (
      {
        activeAccountId,
        onAccountChange,
        excludePlatforms = [],
      }: IAccountSidebarProps,
      ref: ForwardedRef<IAccountSidebarRef>,
    ) => {
      const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
      const pubAccountDetModuleRef = useRef<IPubAccountDetModuleRef>(null);
      const {
        accountList: fullAccountList,
        getAccountList,
        accountGroupList,
      } = useAccountStore(
        useShallow((state) => ({
          accountList: state.accountList,
          getAccountList: state.getAccountList,
          accountGroupList: state.accountGroupList,
        })),
      );
      const [userManageModalOpen, setUserManageModalOpen] = useState(false);
      const [proxyManageOpen, setProxyManageOpen] = useState(false);
      const userManageModalRef = useRef<IUserManageModalRef>(null);

      // 在组件内部过滤账号列表，而不是在 useAccountStore 中过滤
      const accountList = useMemo(() => {
        return fullAccountList.filter(
          (account) => !excludePlatforms.includes(account.type),
        );
      }, [fullAccountList, excludePlatforms]);

      return (
        <>
          <ProxyManage
            open={proxyManageOpen}
            onCancel={() => setProxyManageOpen(false)}
            onExamineAccountClick={(groupId) => {
              userManageModalRef.current?.setActiveGroup(groupId);
              setUserManageModalOpen(true);
            }}
          />
          <UserManageModal
            ref={userManageModalRef}
            open={userManageModalOpen}
            onCancel={() => setUserManageModalOpen(false)}
          />
          <PubAccountDetModule
            title="账号检测"
            tips="所有平台在线"
            ref={pubAccountDetModuleRef}
            accounts={accountList}
            isFooter={false}
          />
          <AddAccountModal
            open={isAccountModalOpen}
            onClose={() => setIsAccountModalOpen(false)}
            onAddSuccess={getAccountList}
          />
          <div className={styles.accountSidebar}>
            <div className="accountSidebar-top">
              <div className="accountSidebar-top-box">
                <Button
                  onClick={() => {
                    setUserManageModalOpen(true);
                  }}
                >
                  <UserOutlined />
                  账号管理器
                </Button>
                <Tooltip title="添加账号">
                  <Button
                    type="primary"
                    className="accountSidebar-top-addUser"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setIsAccountModalOpen(true);
                    }}
                  ></Button>
                </Tooltip>
              </div>
              <div className="accountSidebar-top-box">
                <Button
                  icon={<Icon component={ProxyIcon} />}
                  onClick={() => {
                    setProxyManageOpen(true);
                  }}
                >
                  代理管理器
                </Button>
              </div>
            </div>

            <Collapse
              defaultActiveKey={[defaultAccountGroupId]}
              items={accountGroupList.map((v) => {
                return {
                  key: v.id,
                  label: (
                    <>
                      {v.name}
                      <span className="accountSidebar-userCount">
                        {v.children?.length}/
                        {
                          v.children?.map(
                            (v) => v.status === AccountStatus.USABLE,
                          ).length
                        }
                      </span>
                    </>
                  ),
                  children: (
                    <ul key={v.id} className="accountList">
                      {v.children?.map((account) => {
                        if (excludePlatforms.includes(account.type)) return '';
                        const platInfo = AccountPlatInfoMap.get(account.type)!;
                        return (
                          <li
                            className={[
                              'accountList-item',
                              `${activeAccountId === account.id ? 'accountList-item--active' : ''}`,
                              // 失效状态
                              account.status === AccountStatus.DISABLE &&
                                'accountList-item--disable',
                              // 异常状态
                              account.abnormalStatus &&
                                account.abnormalStatus[AccountType.Xhs] ===
                                  XhsAccountAbnormal.Abnormal &&
                                'accountList-item--abnormal',
                            ].join(' ')}
                            key={account.id}
                            onClick={async () => {
                              if (account.status === AccountStatus.DISABLE) {
                                const res = await accountLogin(account.type);
                                if (!res) return;
                                message.success('账号登录成功！');
                                return;
                              }
                              onAccountChange(account);
                            }}
                          >
                            <Avatar src={account.avatar} size="large" />
                            <div className="accountList-item-right">
                              <div
                                className="accountList-item-right-name"
                                title={account.nickname}
                              >
                                <Tooltip
                                  title={
                                    account.abnormalStatus &&
                                    account.abnormalStatus[AccountType.Xhs] ===
                                      XhsAccountAbnormal.Abnormal
                                      ? '账号状态异常，无法发布作品，请检查后重试'
                                      : undefined
                                  }
                                >
                                  {account.nickname}
                                </Tooltip>
                              </div>
                              <div className="accountList-item-right-footer">
                                <p className="accountList-item-right-plat">
                                  <img src={platInfo.icon} />
                                  <span>{platInfo.name}</span>
                                </p>
                                <Popover
                                  content={
                                    <AccountPopoverInfo accountInfo={account} />
                                  }
                                  // trigger="click"
                                  placement="right"
                                >
                                  ...
                                </Popover>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ),
                };
              })}
            />

            <div className="accountSidebar-footer">
              <Button
                type="link"
                onClick={() => {
                  pubAccountDetModuleRef.current?.startDet();
                }}
              >
                一键检测登录状态
              </Button>
            </div>
          </div>
        </>
      );
    },
  ),
);
AccountSidebar.displayName = 'AccountSidebar';

export default AccountSidebar;
