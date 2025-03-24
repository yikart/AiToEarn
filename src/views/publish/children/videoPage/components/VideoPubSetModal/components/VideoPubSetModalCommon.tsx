import { AccountStatus } from '@@/AccountEnum';
import { Button, Input, Tooltip } from 'antd';
import React from 'react';
import { IVideoChooseItem } from '@/views/publish/children/videoPage/videoPage';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import dayjs from 'dayjs';
import { AccountPlatInfoMap } from '../../../../../../account/comment';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { AiCreateType } from '../../../../../../../api/types/tools';
import AICreateTitle from '../../../../../components/AICreateTitle/AICreateTitle';
import CommonScheduledTimeSelect, {
  ICommonScheduledTimeSelectProps,
} from '../../../../../components/CommonComponents/CommonScheduledTimeSelect';

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
  ...props
}: ICommonScheduledTimeSelectProps & {
  currChooseAccount: IVideoChooseItem;
}) => {
  const { value, onChange } = props;
  const { setOnePubParams } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
    })),
  );

  return (
    <CommonScheduledTimeSelect
      {...props}
      platType={currChooseAccount?.account?.type}
      value={
        value
          ? value
          : currChooseAccount?.pubParams.timingTime
            ? dayjs(currChooseAccount?.pubParams.timingTime)
            : undefined
      }
      isTitle={!onChange}
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
