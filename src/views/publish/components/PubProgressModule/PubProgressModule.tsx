import { ForwardedRef, forwardRef, memo } from 'react';
import { Alert, Avatar, Modal, Progress, Tooltip } from 'antd';
import { PublishProgressRes } from '../../../../../electron/main/plat/pub/PubItemVideo';
import styles from './pubProgressModule.module.scss';
import { AccountPlatInfoMap } from '../../../account/comment';
import { MinusOutlined } from '@ant-design/icons';

export interface IPubProgressModuleRef {}

export interface IPubProgressModuleProps {
  pubProgressData: PublishProgressRes[];
  open: boolean;
  onClose: () => void;
}

function getMsg(progressData: PublishProgressRes) {
  if (progressData.progress === 100) {
    return '发布成功';
  } else if (progressData.progress === -1) {
    return '发布错误';
  } else {
    return progressData.msg || '正在加载...';
  }
}

// 发布进度展示
const PubProgressModule = memo(
  forwardRef(
    (
      { pubProgressData, open, onClose }: IPubProgressModuleProps,
      ref: ForwardedRef<IPubProgressModuleRef>,
    ) => {
      return (
        <Modal
          width={700}
          title="内容分发"
          maskClosable={false}
          open={open}
          onCancel={onClose}
          footer={null}
          closeIcon={<MinusOutlined />}
        >
          <Alert
            message={
              <>
                关闭此弹框和页面不会影响发布流程，
                <b>关闭后可在右上角小铃铛查看发布进度</b>，但请不要关闭哎哟赚哦~
              </>
            }
            type="success"
          />
          <div className={styles.pubProgressModule}>
            {pubProgressData.map((v) => {
              const { account } = v;
              const plat = AccountPlatInfoMap.get(account.type);
              if (!plat) return;

              return (
                <div className="pubProgressModule-item" key={account.id}>
                  <div className="pubProgressModule-item-left">
                    <div className="pubProgressModule-item-left-avatar">
                      <Avatar src={account.avatar} size="large" />
                      <img src={plat.icon} />
                    </div>
                    <Tooltip title={account.nickname}>
                      <span className="pubProgressModule-item-left-name">
                        {account.nickname}
                      </span>
                    </Tooltip>
                  </div>

                  <div className="pubProgressModule-item-right">
                    <Progress
                      percent={v.progress}
                      status={v.progress === -1 ? 'exception' : undefined}
                    />
                    <p className="pubProgressModule-item-right-msg">
                      {getMsg(v)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>
      );
    },
  ),
);
PubProgressModule.displayName = 'PubProgressModule';

export default PubProgressModule;
