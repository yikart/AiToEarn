import {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useRef,
  useState,
} from 'react';
import styles from './AccountSidebar.module.scss';
import { AccountInfo, AccountPlatInfoMap } from '../../comment';
import { Avatar, Button, message, Popover } from 'antd';
import {
  accountLogin,
  acpAccountLoginCheck,
  icpGetAccountList,
} from '../../../../icp/account';
import AddAccountModal from '../AddAccountModal';
import { AccountStatus } from '../../../../../commont/AccountEnum';
import { CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import useCssVariables from '../../../../hooks/useCssVariables';
import { onAccountLoginFinish } from '../../../../icp/receiveMsg';
import PubAccountDetModule, {
  IPubAccountDetModuleRef,
} from '../../../publish/components/PubAccountDetModule';

export interface IAccountSidebarRef {}

export interface IAccountSidebarProps {
  // 选择的账户id
  activeAccountId: number;
  // 切换选择的账户
  onAccountChange: (info: AccountInfo) => void;
}

const AccountPopoverInfo = ({ accountInfo }: { accountInfo: AccountInfo }) => {
  const platInfo = AccountPlatInfoMap.get(accountInfo.type)!;
  const cssVars = useCssVariables();
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
          {accountInfo.status === AccountStatus.USABLE ? (
            <>
              <CheckCircleOutlined
                style={{ color: cssVars['--successColor'] }}
              />
              在线
            </>
          ) : (
            <>
              <WarningOutlined style={{ color: cssVars['--warningColor'] }} />
              离线
            </>
          )}
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
      { activeAccountId, onAccountChange }: IAccountSidebarProps,
      ref: ForwardedRef<IAccountSidebarRef>,
    ) => {
      const [accountList, setAccountList] = useState<AccountInfo[]>([]);
      const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
      const pubAccountDetModuleRef = useRef<IPubAccountDetModuleRef>(null);

      /**
       * 获取账户列表
       */
      const getAccountList = async () => {
        try {
          const result = await icpGetAccountList();
          setAccountList(result || []);
        } catch (error) {
          console.error('获取账户列表失败', error);
          message.error('获取账户列表失败');
        }
      };

      useEffect(() => {
        getAccountList();

        return onAccountLoginFinish(() => {
          getAccountList();
        });
      }, []);

      return (
        <>
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
              <Button
                style={{ margin: '10px 0' }}
                onClick={() => setIsAccountModalOpen(true)}
              >
                添加账号
              </Button>
            </div>
            <ul className="accountList">
              {accountList.map((account) => {
                const platInfo = AccountPlatInfoMap.get(account.type)!;
                return (
                  <li
                    className={[
                      'accountList-item',
                      `${activeAccountId === account.id ? 'accountList-item--active' : ''}`,
                      account.status === AccountStatus.DISABLE &&
                        'accountList-item--disable',
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
                        {account.nickname}
                      </div>
                      <div className="accountList-item-right-footer">
                        <p className="accountList-item-right-plat">
                          <img src={platInfo.icon} />
                          <span>{platInfo.name}</span>
                        </p>
                        <Popover
                          content={<AccountPopoverInfo accountInfo={account} />}
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
