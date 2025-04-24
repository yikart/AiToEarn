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
import { accountLogin, acpAccountLoginCheck } from '../../../../icp/account';
import { AccountStatus } from '../../../../../commont/AccountEnum';
import { AvatarPlat } from '../PubProgressModule/PubProgressModule';

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

      const retLoginStatusCore = async (account: AccountInfo) => {
        const res = await acpAccountLoginCheck(account.type, account.uid);
        setProgress((prevProgress) => prevProgress + 1);
        return res;
      };

      const imperative: IPubAccountDetModuleRef = {
        async startDet() {
          setDisabledIdSet(new Set([]));
          setOpen(true);
          setDetLoading(true);

          const tasks: Promise<AccountInfo>[] = [];
          for (let i = 0; i < accounts.length; i++) {
            const account = accounts[i];
            tasks.push(retLoginStatusCore(account));
          }
          const res = await Promise.all(tasks);
          setTimeout(() => {
            if (onDetFinish) onDetFinish(res);
            setDetLoading(false);

            const disabledIdSet = new Set<number>([]);
            res.map((v) =>
              v.status === AccountStatus.DISABLE ? disabledIdSet.add(v.id) : '',
            );
            setDisabledIdSet(disabledIdSet);
            setProgress(0);
          }, 100);
        },
      };
      useImperativeHandle(ref, () => imperative);

      return (
        <Modal
          width={500}
          title={title}
          maskClosable={false}
          open={open}
          onCancel={close}
          footer={null}
        >
          <div className={styles.pubAccountDetModule}>
            <div className="pubAccountDetModule-tips">
              {!detLoading ? (
                disabledIdSet.size === 0 ? (
                  `${tips}`
                ) : (
                  <Alert
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
                )
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
                      className="pubAccountDetModule-accounts-account"
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
                          className={[
                            'pubAccountDetModule-accounts-name',
                            disabledIdSet.has(v.id) &&
                              'pubAccountDetModule-accounts-disable',
                            !disabledIdSet.has(v.id) &&
                              !detLoading &&
                              'pubAccountDetModule-accounts-ol',
                          ].join(' ')}
                        >
                          <div className="pubAccountDetModule-accounts-name-wrapper">
                            <CloseCircleOutlined className="pubAccountDetModule-accounts-disable-icon" />
                            <CheckCircleOutlined className="pubAccountDetModule-accounts-ol-icon" />
                            <span>{v.nickname}</span>
                          </div>
                        </div>
                      </Tooltip>
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
                disabled={disabledIdSet.size !== 0}
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
