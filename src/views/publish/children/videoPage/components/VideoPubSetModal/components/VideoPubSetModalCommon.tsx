import { Input, Tooltip } from 'antd';
import React from 'react';
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
import {
  AccountRestartLogin,
  CommonMixSelect,
  PubPermission,
  PubPermissionProps,
} from '../../../../../components/CommonComponents/CommonComponents';
import useVideoPubSetModal from '../children/hooks/useVideoPubSetModal';
import { IMixItem } from '../../../../../../../../electron/main/plat/plat.type';

const { TextArea } = Input;

export const VideoPubRestartLogin = () => {
  const { accountRestart, currChooseAccount } = useVideoPageStore(
    useShallow((state) => ({
      accountRestart: state.accountRestart,
      currChooseAccount: state.currChooseAccount!,
    })),
  );

  return (
    currChooseAccount && (
      <AccountRestartLogin
        account={currChooseAccount.account}
        onAccountRestart={() => {
          accountRestart(currChooseAccount.account!.type);
        }}
      />
    )
  );
};

// 定时发布
export const ScheduledTimeSelect = ({
  ...props
}: ICommonScheduledTimeSelectProps) => {
  const { value, onChange } = props;
  const { setOnePubParams, currChooseAccount } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
      currChooseAccount: state.currChooseAccount,
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
              setOnePubParams({
                timingTime: e ? e.toDate() : undefined,
              });
            }
      }
    />
  );
};

// 标题
export const TitleInput = ({
  placeholder,
  tips,
  title = '标题',
}: {
  placeholder: string;
  tips?: string;
  title?: string;
}) => {
  const { setOnePubParams, currChooseAccount } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
      currChooseAccount: state.currChooseAccount,
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
          setOnePubParams({
            title: e.target.value,
          });
        }}
      />
      <AICreateTitle
        type={AiCreateType.TITLE}
        onAiCreateFinish={(text) => {
          setOnePubParams({
            title: text,
          });
        }}
        videoFile={currChooseAccount.video}
        max={max || 20}
      />
    </>
  );
};

// 描述
export const DescTextArea = ({
  placeholder,
  title = '描述',
  maxLength,
}: {
  placeholder: string;
  tips?: string;
  title?: string;
  maxLength: number;
}) => {
  const { setOnePubParams, currChooseAccount } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
      currChooseAccount: state.currChooseAccount,
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
          setOnePubParams({
            describe: e.target.value,
          });
        }}
      />
      <AICreateTitle
        type={AiCreateType.DESC}
        onAiCreateFinish={(text) => {
          setOnePubParams({
            describe: text,
          });
        }}
        videoFile={currChooseAccount.video}
        max={maxLength}
      />
    </>
  );
};

// 可见性
export const VideoPubPermission = ({ ...props }: PubPermissionProps) => {
  const { setOnePubParams, currChooseAccount } = useVideoPubSetModal();
  return (
    <PubPermission
      onChange={(e) => {
        setOnePubParams({
          visibleType: e,
        });
      }}
      value={currChooseAccount?.pubParams.visibleType}
      {...props}
    />
  );
};

// 合集
export const VideoPubMixSelect = ({}: {}) => {
  const { setOnePubParams, currChooseAccount } = useVideoPubSetModal();
  const { updateAccounts } = useVideoPageStore(
    useShallow((state) => ({
      updateAccounts: state.updateAccounts,
    })),
  );

  return (
    <CommonMixSelect
      account={currChooseAccount.account}
      value={currChooseAccount.pubParams.mixInfo?.value}
      onAccountChange={(account) => {
        updateAccounts({
          accounts: [account],
        });
      }}
      onChange={(_, value) => {
        setOnePubParams({
          mixInfo: !value
            ? undefined
            : {
                label: (value as IMixItem).name,
                value: (value as IMixItem).id,
              },
        });
      }}
    >
      <VideoPubRestartLogin />
    </CommonMixSelect>
  );
};
