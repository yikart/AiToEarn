import {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import styles from './pubAccountDetModule.module.scss';
import { Alert, Button, Checkbox, message, Modal, Tooltip } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { AccountInfo } from '../../../account/comment';
import { LoadingOutlined } from '@ant-design/icons';
import {
  accountLogin,
  acpAccountLoginCheck,
  icpProxyCheck,
} from '../../../../icp/account';
import { AccountStatus } from '../../../../../commont/AccountEnum';
import { AvatarPlat } from '../PubProgressModule/PubProgressModule';
import { AccountGroupItem, useAccountStore } from '@/store/account';
import { useShallow } from 'zustand/react/shallow';
import { AccountModel } from '../../../../../electron/db/models/account';

export interface IPubAccountDetModuleRef {
  // 打开弹框并且开始检测
  startDet: () => void;
}

export interface IPubAccountDetModuleProps {
  // 待检测的账户
  accounts: AccountInfo[];
  // 弹框关闭
  onClose?: () => void;
  // 发布
  onPubClick?: () => void;
  /**
   * 检测完成
   * @param accounts 检测过后的账户数据
   */
  onDetFinish?: (accounts: AccountInfo[]) => void;
  // 重新登录完成事件
  onRestartLoginFinish?: (accounts: AccountInfo) => void;
  title?: string;
  tips?: string;
  // 是否需要footer操作栏
  isFooter?: boolean;
  // 是否需要校验代理地址
  isCheckProxy?: boolean;
}

// 发布用户检测
const PubAccountDetModule = memo(
  forwardRef(
    (
      {
        onRestartLoginFinish,
        accounts,
        onClose,
        onPubClick,
        onDetFinish,
        title = '发布检测',
        tips = '以下账号将发布至平台',
        isFooter = true,
        isCheckProxy = false,
      }: IPubAccountDetModuleProps,
      ref: ForwardedRef<IPubAccountDetModuleRef>,
    ) => {
      const [open, setOpen] = useState(false);
      const [detLoading, setDetLoading] = useState(false);
      // 失效 ids
      const [disabledIdSet, setDisabledIdSet] = useState<Set<number>>(
        new Set([]),
      );
      const [progress, setProgress] = useState(0);
      const [isFilterAccountOl, setIsFilterAccountOl] = useState(false);
      // 代理失效的账户组Map
      const [proxyInvalidAccountMap, setProxyInvalidAccountMap] = useState<
        Map<number, AccountGroupItem>
      >(new Map());
      const { accountGroupMap, getAccountList } = useAccountStore(
        useShallow((state) => ({
          accountGroupMap: state.accountGroupMap,
          getAccountList: state.getAccountList,
        })),
      );

      useEffect(() => {
        if (open) {
          setDisabledIdSet(new Set([]));
          setIsFilterAccountOl(false);
        }
      }, [open]);

      useEffect(() => {
        if (disabledIdSet.size === 0) {
          setIsFilterAccountOl(false);
        }
      }, [disabledIdSet]);

      const close = () => {
        if (detLoading) return;
        setOpen(false);
        if (onClose) onClose();
      };

      // 检测账户状态
      const retLoginStatusCore = async (account: AccountInfo) => {
        const res = await acpAccountLoginCheck(
          account.type,
          account.uid,
          false,
        );
        setProgress((prevProgress) => prevProgress + 1);
        return res;
      };

      // 检测代理地址有效性
      const retProxyCheckCore = async (group: AccountGroupItem) => {
        let status = true;
        if (group.proxyIp) {
          status = await icpProxyCheck(group.proxyIp);
        }
        return {
          status,
          group,
        };
      };

      const getIp = (account: AccountModel) => {
        if (!isCheckProxy) return '';
        const group = accountGroupMap.get(account.groupId!)!;
        if (!group.proxyOpen || !group.proxyIp) return '';
        return '代理' + ` ${group.proxyIp}`;
      };

      const imperative: IPubAccountDetModuleRef = {
        async startDet() {
          setProxyInvalidAccountMap(new Map());
          setDisabledIdSet(new Set([]));
          setOpen(true);
          setDetLoading(true);

          // 账户状态
          const tasksAccountStatus: Promise<AccountInfo>[] = [];
          // 代理地址有效性检测
          const tasksProxyCheck: Promise<{
            status: boolean;
            group: AccountGroupItem;
          }>[] = [];
          // 代理地址需要检测的账户组
          const proxyGroupSet = new Set<number>([]);
          for (let i = 0; i < accounts.length; i++) {
            const account = accounts[i];
            tasksAccountStatus.push(retLoginStatusCore(account));

            if (isCheckProxy) {
              // 代理有效性检测
              if (!proxyGroupSet.has(account.groupId!)) {
                const group = accountGroupMap.get(account.groupId!)!;
                if (group.proxyOpen) {
                  tasksProxyCheck.push(
                    retProxyCheckCore(accountGroupMap.get(account.groupId!)!),
                  );
                }
                proxyGroupSet.add(account.groupId!);
              }
            }
          }

          // 等待代理和账号有效性检测...
          const resGroupProxyStatus = await Promise.all(tasksProxyCheck);
          const resAccountStatus = await Promise.all(tasksAccountStatus);

          await getAccountList();

          setTimeout(() => {
            if (onDetFinish) onDetFinish(resAccountStatus);
            setDetLoading(false);

            const disabledIdSet = new Set<number>([]);
            resAccountStatus.map((v) =>
              v.status === AccountStatus.DISABLE ? disabledIdSet.add(v.id) : '',
            );
            setDisabledIdSet(disabledIdSet);
            setProgress(0);

            resGroupProxyStatus.map((v) => {
              if (!v.status) {
                setProxyInvalidAccountMap((prevState) => {
                  const newState = new Map<number, AccountGroupItem>(prevState);
                  newState.set(v.group.id, v.group);
                  return newState;
                });
              }
            });
          }, 50);
        },
      };
      useImperativeHandle(ref, () => imperative);

      return (
        <Modal
          width={530}
          title={title}
          maskClosable={false}
          open={open}
          onCancel={close}
          footer={null}
        >
          <div className={styles.pubAccountDetModule}>
            <div className="pubAccountDetModule-tips">
              {!detLoading ? (
                <>
                  {disabledIdSet.size === 0 ? (
                    proxyInvalidAccountMap.size === 0 && `${tips}`
                  ) : (
                    <Alert
                      style={{ marginBottom: '10px' }}
                      message={
                        <div className={styles.loginStatusDisable}>
                          <span>账号登录状态失效，点击账户重新登录</span>
                          <Checkbox
                            checked={isFilterAccountOl}
                            onChange={(e) =>
                              setIsFilterAccountOl(e.target.checked)
                            }
                          >
                            过滤在线账户
                          </Checkbox>
                        </div>
                      }
                      type="error"
                      showIcon
                    />
                  )}

                  {proxyInvalidAccountMap.size !== 0 && (
                    <Alert
                      message={
                        <div>
                          <span>以下代理不可用，请调整后重试：</span>
                          <ul>
                            {Array.from(proxyInvalidAccountMap).map(
                              ([_, v]) => {
                                return (
                                  <li key={v.id}>
                                    用户组：{v.name}，代理地址：{v.proxyIp}{' '}
                                    不可用
                                  </li>
                                );
                              },
                            )}
                          </ul>
                        </div>
                      }
                      type="error"
                      showIcon
                    />
                  )}
                </>
              ) : (
                <>
                  正在检测账号状态 {progress} / {accounts.length}
                  <LoadingOutlined />
                </>
              )}
            </div>
            <div className="pubAccountDetModule-accounts">
              {accounts
                .filter((v) =>
                  isFilterAccountOl
                    ? disabledIdSet.has(v.id) && !detLoading
                    : true,
                )
                .map((v) => {
                  return (
                    <div
                      className={[
                        'pubAccountDetModule-accounts-account',
                        disabledIdSet.has(v.id) ||
                        proxyInvalidAccountMap.get(v.groupId)
                          ? 'pubAccountDetModule-accounts-disable'
                          : !disabledIdSet.has(v.id) &&
                            !detLoading &&
                            'pubAccountDetModule-accounts-ol',
                      ].join(' ')}
                      style={{
                        cursor: disabledIdSet.has(v.id) ? 'pointer' : 'auto',
                      }}
                      key={v.id}
                      onClick={async () => {
                        if (disabledIdSet.has(v.id)) {
                          const res = await accountLogin(v.type);
                          if (!res) return;
                          message.success('登录成功！');
                          if (onRestartLoginFinish) onRestartLoginFinish(res);
                          setDisabledIdSet((prevState) => {
                            const newState = new Set<number>(prevState);
                            newState.delete(res.id);
                            return newState;
                          });
                        }
                      }}
                    >
                      <AvatarPlat account={v} size="default" />
                      <Tooltip title={v.nickname}>
                        <div
                          className={['pubAccountDetModule-accounts-name'].join(
                            ' ',
                          )}
                        >
                          <div className="pubAccountDetModule-accounts-name-wrapper">
                            <CloseCircleOutlined className="pubAccountDetModule-accounts-disable-icon" />
                            <CheckCircleOutlined className="pubAccountDetModule-accounts-ol-icon" />
                            <span>{v.nickname}</span>
                          </div>
                        </div>
                      </Tooltip>
                      <div className="pubAccountDetModule-accounts-proxy">
                        <Tooltip title={getIp(v)}>
                          <span>{getIp(v)}</span>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {isFooter && (
            <div style={{ display: 'flex', justifyContent: 'right' }}>
              <Button style={{ marginRight: '10px' }} onClick={close}>
                取消
              </Button>
              <Button
                type="primary"
                loading={detLoading}
                disabled={
                  disabledIdSet.size !== 0 || proxyInvalidAccountMap.size !== 0
                }
                onClick={() => {
                  setOpen(false);
                  if (onPubClick) onPubClick();
                }}
              >
                发布至平台
              </Button>
            </div>
          )}
        </Modal>
      );
    },
  ),
);
PubAccountDetModule.displayName = 'PubAccountDetModule';

export default PubAccountDetModule;
