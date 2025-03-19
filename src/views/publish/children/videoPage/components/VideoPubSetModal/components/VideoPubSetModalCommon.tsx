import { AccountStatus } from '@@/AccountEnum';
import { Button, DatePicker, Input, Tooltip } from 'antd';
import React, { useEffect } from 'react';
import { IVideoChooseItem } from '@/views/publish/children/videoPage/videoPage';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import dayjs from 'dayjs';
import { AccountPlatInfoMap } from '../../../../../../account/comment';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { AiCreateType } from '../../../../../../../api/types/tools';
import AICreateTitle from '../../../../../components/AICreateTitle/AICreateTitle';

const { TextArea } = Input;

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
  timeOffset = 60,
  maxDate = 14,
  value,
  onChange,
}: {
  currChooseAccount?: IVideoChooseItem;
  // 分钟、当前时间 + 这个分钟之后的时间才可以选择
  timeOffset?: number;
  // 天，昨天 ~ maxDate
  maxDate?: number;
  value?: dayjs.Dayjs | null | undefined;
  onChange?:
    | ((date: dayjs.Dayjs, dateString: string | string[]) => void)
    | undefined;
}) => {
  const { setOnePubParams } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
    })),
  );

  useEffect(() => {
    if (currChooseAccount) {
      const accountPlatInfo = AccountPlatInfoMap.get(
        currChooseAccount.account!.type,
      )!;
      const timingMax = accountPlatInfo.commonPubParamsConfig.timingMax;
      timeOffset = timingMax?.timeOffset || timeOffset;
      maxDate = timingMax?.maxDate || maxDate;
    }
  }, []);

  const range = (start: number, end: number) => {
    const result = [];
    for (let i = start; i < end; i++) {
      result.push(i);
    }
    return result;
  };

  const disabledDate = (current: dayjs.Dayjs) => {
    const yesterday = dayjs().subtract(0, 'day').startOf('day');
    const futureDate = dayjs().add(maxDate, 'day').endOf('day');
    return (
      current &&
      (current.isBefore(yesterday, 'day') || current.isAfter(futureDate, 'day'))
    );
  };

  const disabledTime = (current: dayjs.Dayjs | null) => {
    const now = dayjs();
    const minutesOffset = now.add(timeOffset, 'minute');
    if (current && current.isBefore(minutesOffset)) {
      const hours = minutesOffset.hour();
      const minutes = minutesOffset.minute();
      return {
        disabledHours: () => range(0, hours),
        disabledMinutes: () => range(0, minutes),
      };
    }
    return {
      disabledHours: () => [],
      disabledMinutes: () => [],
    };
  };

  return (
    <>
      {!onChange && <h1>定时发布</h1>}
      <DatePicker
        format="YYYY-MM-DD HH:mm"
        disabledDate={disabledDate}
        disabledTime={disabledTime}
        showTime={{ defaultValue: dayjs('00:00:00', 'HH:mm:ss') }}
        value={
          value
            ? value
            : currChooseAccount?.pubParams.timingTime
              ? dayjs(currChooseAccount?.pubParams.timingTime)
              : undefined
        }
        onChange={
          onChange
            ? onChange
            : (e) => {
                if (!currChooseAccount) return;
                setOnePubParams(
                  {
                    timingTime: e ? e.toDate() : undefined,
                  },
                  currChooseAccount!.id,
                );
              }
        }
      />
      {!onChange ? (
        <p className="videoPubSetModal_con-tips">
          支持{timeOffset}分钟后及{maxDate}天内的定时发布
        </p>
      ) : (
        <p
          style={{
            color: 'rgb(178, 185, 185)',
            fontSize: 'var(--fs-sm)',
          }}
        >
          请选择{timeOffset}分钟后及{maxDate}天内的时间
        </p>
      )}
    </>
  );
};

// 标题
export const TitleInput = ({
  currChooseAccount,
  placeholder,
  tips,
  title = '标题',
}: {
  currChooseAccount?: IVideoChooseItem;
  placeholder: string;
  tips?: string;
  title?: string;
}) => {
  const { setOnePubParams } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
    })),
  );
  if (!currChooseAccount) return '';
  const max = AccountPlatInfoMap.get(currChooseAccount.account!.type)
    ?.commonPubParamsConfig.titleMax;

  return (
    <>
      <h1>
        {title}
        {tips && (
          <Tooltip title={tips}>
            <QuestionCircleOutlined style={{ marginLeft: '2px' }} />
          </Tooltip>
        )}
      </h1>
      <Input
        value={currChooseAccount.pubParams.title}
        maxLength={max}
        placeholder={placeholder}
        showCount
        variant="filled"
        onChange={(e) => {
          setOnePubParams(
            {
              title: e.target.value,
            },
            currChooseAccount.id,
          );
        }}
      />
      <AICreateTitle
        type={AiCreateType.TITLE}
        onAiCreateFinish={(text) => {
          setOnePubParams(
            {
              title: text,
            },
            currChooseAccount.id,
          );
        }}
        videoFile={currChooseAccount.video}
        max={max || 20}
      />
    </>
  );
};

// 描述
export const DescTextArea = ({
  currChooseAccount,
  placeholder,
  title = '描述',
  maxLength,
}: {
  currChooseAccount?: IVideoChooseItem;
  placeholder: string;
  tips?: string;
  title?: string;
  maxLength: number;
}) => {
  const { setOnePubParams } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
    })),
  );
  if (!currChooseAccount) return '';

  return (
    <>
      <h1>{title}</h1>
      <TextArea
        value={currChooseAccount?.pubParams.describe}
        placeholder={placeholder}
        variant="filled"
        showCount
        maxLength={maxLength}
        onChange={(e) => {
          setOnePubParams(
            {
              describe: e.target.value,
            },
            currChooseAccount!.id,
          );
        }}
      />
      <AICreateTitle
        type={AiCreateType.DESC}
        onAiCreateFinish={(text) => {
          setOnePubParams(
            {
              describe: text,
            },
            currChooseAccount.id,
          );
        }}
        videoFile={currChooseAccount.video}
        max={maxLength}
      />
    </>
  );
};
