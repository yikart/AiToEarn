import {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import styles from './pubAccountDetModule.module.scss';
import { Alert, Avatar, Button, Modal, Tooltip } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { AccountInfo, AccountPlatInfoMap } from '@/views/account/comment';
import { LoadingOutlined } from '@ant-design/icons';
import { acpAccountLoginCheck } from '@/icp/account';
import { AccountStatus } from '../../../../commont/AccountEnum';

export interface IPubAccountDetModuleRef {
  // 打开弹框并且开始检测
  startDet: () => void;
}

export interface IPubAccountDetModuleProps {
  // 待检测的账户
  accounts: AccountInfo[];
  // 弹框关闭
  onClose: () => void;
  // 发布
  onPubClick: () => void;
  /**
   * 检测完成
   * @param accounts 检测过后的账户数据
   */
  onDetFinish: (accounts: AccountInfo[]) => void;
}

// 发布用户检测
const PubAccountDetModule = memo(
  forwardRef(
    (
      { accounts, onClose, onPubClick, onDetFinish }: IPubAccountDetModuleProps,
      ref: ForwardedRef<IPubAccountDetModuleRef>,
    ) => {
      const [open, setOpen] = useState(false);
      const [detLoading, setDetLoading] = useState(false);
      // 失效 ids
      const [disabledIdSet, setDisabledIdSet] = useState<Set<number>>(
        new Set([]),
      );

      useEffect(() => {
        if (open) {
          setDisabledIdSet(new Set([]));
        }
      }, [open]);

      const close = () => {
        if (detLoading) return;
        setOpen(false);
        onClose();
      };

      const imperative: IPubAccountDetModuleRef = {
        async startDet() {
          setOpen(true);
          setDetLoading(true);

          const tasks: Promise<AccountInfo>[] = [];
          for (let i = 0; i < accounts.length; i++) {
            const account = accounts[i];
            tasks.push(acpAccountLoginCheck(account.type, account.uid));
          }
          const res = await Promise.all(tasks);
          onDetFinish(res);
          setDetLoading(false);

          const disabledIdSet = new Set<number>([]);
          res.map((v) =>
            v.status === AccountStatus.DISABLE ? disabledIdSet.add(v.id) : '',
          );
          setDisabledIdSet(disabledIdSet);
        },
      };
      useImperativeHandle(ref, () => imperative);

      return (
        <Modal
          width={500}
          title="发布检测"
          maskClosable={false}
          open={open}
          onCancel={close}
          footer={null}
        >
          <div className={styles.pubAccountDetModule}>
            <div className="pubAccountDetModule-tips">
              {!detLoading ? (
                disabledIdSet.size === 0 ? (
                  `以下账号将发布至平台`
                ) : (
                  <Alert message="账号登录状态失效" type="error" showIcon />
                )
              ) : (
                <>
                  正在检测发布状态
                  <LoadingOutlined />
                </>
              )}
            </div>
            <div className="pubAccountDetModule-accounts">
              {accounts.map((v) => {
                return (
                  <div
                    className="pubAccountDetModule-accounts-account"
                    key={v.id}
                  >
                    <div className="pubAccountDetModule-accounts-avatar">
                      <Avatar src={v.avatar} />
                      <img
                        className="pubAccountDetModule-accounts-avatar-plat"
                        src={AccountPlatInfoMap.get(v.type)?.icon}
                      />
                    </div>
                    <Tooltip title={v.nickname}>
                      <div
                        className={[
                          'pubAccountDetModule-accounts-name',
                          disabledIdSet.has(v.id)
                            ? 'pubAccountDetModule-accounts-disable'
                            : '',
                        ].join(' ')}
                      >
                        <div className="pubAccountDetModule-accounts-name-wrapper">
                          <CloseCircleOutlined />
                          <span>{v.nickname}</span>
                        </div>
                      </div>
                    </Tooltip>
                  </div>
                );
              })}
            </div>
          </div>

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
                onPubClick();
              }}
            >
              发布至平台
            </Button>
          </div>
        </Modal>
      );
    },
  ),
);
PubAccountDetModule.displayName = 'PubAccountDetModule';

export default PubAccountDetModule;
