import { AccountStatus } from '@@/AccountEnum';
import { Button, DatePicker } from 'antd';
import React from 'react';
import { IVideoChooseItem } from '@/views/publish/children/videoPage/videoPage';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import dayjs from 'dayjs';

export const VideoPubRestartLogin = ({
  currChooseAccount,
}: {
  currChooseAccount: IVideoChooseItem;
}) => {
  const { accountRestart } = useVideoPageStore(
    useShallow((state) => ({
      accountRestart: state.accountRestart,
    })),
  );

  return (
    <>
      {currChooseAccount.account?.status === AccountStatus.DISABLE && (
        <div className="videoPubSetModal_con-accountDisable">
          账户已失效，
          <Button
            type="link"
            onClick={() => {
              accountRestart(currChooseAccount.account!.type);
            }}
          >
            重新登录
          </Button>
          后可获取
        </div>
      )}
    </>
  );
};

// 定时发布
export const ScheduledTimeSelect = ({
  currChooseAccount,
  tips,
}: {
  currChooseAccount: IVideoChooseItem;
  tips?: string;
}) => {
  const { setOnePubParams } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
    })),
  );

  return (
    <>
      <h1>定时发布</h1>
      <DatePicker
        format="YYYY-MM-DD HH:mm:ss"
        showTime={{ defaultValue: dayjs('00:00:00', 'HH:mm:ss') }}
        value={
          currChooseAccount.pubParams.timingTime
            ? dayjs(currChooseAccount.pubParams.timingTime)
            : undefined
        }
        onChange={(e) => {
          setOnePubParams(
            {
              timingTime: e ? e.toDate() : undefined,
            },
            currChooseAccount!.id,
          );
        }}
      />
      {tips && <p className="videoPubSetModal_con-tips">{tips}</p>}
    </>
  );
};
