import { ForwardedRef, forwardRef, memo, useMemo, useState } from 'react';
import styles from './bellMessage.module.scss';
import { Empty, Menu, MenuProps, Popover } from 'antd';
import { useShallow } from 'zustand/react/shallow';
import { NoticeType, useBellMessageStroe } from '../../store/bellMessageStroe';
import { PubRecordStatusTag } from '../../views/publish/children/pubRecord/page';
import { formatTime } from '../../utils';
import PubProgressModule from '../../views/publish/components/PubProgressModule/PubProgressModule';

export interface IBellmessageRef {}

export interface IBellmessageProps {
  children?: React.ReactNode;
}

type MenuItem = Required<MenuProps>['items'][number];
const menuItems: MenuItem[] = [
  {
    key: NoticeType.PubNotice,
    label: '发布通知',
  },
  // {
  //   key: '1',
  //   label: '系统通知',
  // },
  // {
  //   key: `2`,
  //   label: '更新公告',
  // },
  // {
  //   key: `3`,
  //   label: '私信通知',
  // },
  // {
  //   key: `4`,
  //   label: '任务通知',
  // },
];

const Bellmessage = memo(
  forwardRef(
    ({ children }: IBellmessageProps, ref: ForwardedRef<IBellmessageRef>) => {
      const [menuKey, setMenuKey] = useState<string>(NoticeType.PubNotice);
      const { noticeMap } = useBellMessageStroe(
        useShallow((state) => ({
          noticeMap: state.noticeMap,
        })),
      );
      const [progressOpen, setProgressOpen] = useState(false);
      const [pubProgressData, setPubProgressData] = useState<any[]>([]);
      const [open, setOpen] = useState(false);

      const noticeList = useMemo(() => {
        return noticeMap.get(NoticeType.PubNotice) || [];
      }, [noticeMap]);

      return (
        <>
          <PubProgressModule
            pubProgressData={pubProgressData}
            open={progressOpen}
            onClose={() => setProgressOpen(false)}
          />
          <Popover
            open={open}
            onOpenChange={(newOpen) => setOpen(newOpen)}
            rootClassName={styles.bellMessagePopover}
            placement="bottomLeft"
            content={
              <>
                <div className={styles.bellMessage}>
                  <div className="bellMessage-menu">
                    <p className="bellMessage-menu-title">消息中心</p>
                    <Menu
                      selectedKeys={[NoticeType.PubNotice]}
                      inlineIndent={15}
                      mode="inline"
                      items={menuItems}
                      onClick={(e) => {
                        setMenuKey(e.key);
                      }}
                    />
                  </div>

                  <div className="bellMessage-content">
                    {noticeList.length === 0 ? (
                      <div className="bellMessage-content-empty">
                        <Empty />
                      </div>
                    ) : (
                      <>
                        {noticeList.map((v) => {
                          return (
                            <div
                              className="bellMessage-content-item"
                              onClick={() => {
                                switch (menuKey) {
                                  case NoticeType.PubNotice:
                                    setOpen(false);
                                    setPubProgressData(v.pub!.progressList);
                                    setProgressOpen(true);
                                    break;
                                }
                              }}
                              key={v.id}
                            >
                              <div
                                className="bellMessage-content-item-title"
                                title={v.title}
                              >
                                {v.title}
                              </div>
                              <div className="bellMessage-content-item-des">
                                {menuKey === NoticeType.PubNotice ? (
                                  <PubRecordStatusTag status={v.pub!.status} />
                                ) : (
                                  <></>
                                )}
                              </div>
                              <div className="bellMessage-content-item-time">
                                {formatTime(v.time)}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              </>
            }
          >
            {children}
          </Popover>
        </>
      );
    },
  ),
);
Bellmessage.displayName = 'Bellmessage';

export default Bellmessage;
