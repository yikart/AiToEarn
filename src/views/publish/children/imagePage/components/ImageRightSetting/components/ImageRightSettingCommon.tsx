// 话题选择器
import {
  ILocationDataItem,
  IUsersItem,
} from '../../../../../../../../electron/main/plat/plat.type';
import { useShallow } from 'zustand/react/shallow';
import CommonLocationSelect from '../../../../../components/CommonComponents/CommonLocationSelect';
import React from 'react';
import { Input, SelectProps, Tooltip } from 'antd';
import { useImagePageStore } from '../../../useImagePageStore';
import { useImagePlatParams } from './children/hooks/useImagePlatParams';
import CommonTopicSelect, {
  CommonTopicSelectProps,
  CommonTopicSelectValueType,
} from '../../../../../components/CommonComponents/CommonTopicSelect';
import CommonUserSelect, {
  CommonUserSelectProps,
} from '../../../../../components/CommonComponents/CommonUserSelect';
import { QuestionCircleOutlined } from '@ant-design/icons';
import CommonScheduledTimeSelect, {
  ICommonScheduledTimeSelectProps,
} from '../../../../../components/CommonComponents/CommonScheduledTimeSelect';
import dayjs from 'dayjs';
import {
  AccountRestartLogin,
  PubPermission,
  PubPermissionProps,
} from '../../../../../components/CommonComponents/CommonComponents';
import { AccountPlatInfoMap } from '../../../../../../account/comment';

interface DebounceSelectProps<ValueType = any>
  extends Omit<SelectProps<ValueType | ValueType[]>, 'options' | 'children'> {}

const { TextArea } = Input;

// 重新登录
export const ImgTextPubRestartLogin = () => {
  const { imageAccountItem } = useImagePlatParams();
  const { accountRestart } = useImagePageStore(
    useShallow((state) => ({
      accountRestart: state.accountRestart,
    })),
  );

  return (
    <AccountRestartLogin
      account={imageAccountItem.account}
      onAccountRestart={() => {
        accountRestart(imageAccountItem.account!.type);
      }}
    />
  );
};

// 位置选择器
export const ImgTextLocationSelect = ({
  ...props
}: DebounceSelectProps<ILocationDataItem>) => {
  const { imageAccountItem } = useImagePlatParams();
  const { setOnePubParams, updateAccounts } = useImagePageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
      updateAccounts: state.updateAccounts,
    })),
  );

  return (
    <CommonLocationSelect
      {...props}
      account={imageAccountItem.account}
      value={imageAccountItem.pubParams!.location}
      onAccountChange={(account) => {
        updateAccounts([account]);
      }}
      onChange={(_, value) => {
        setOnePubParams(
          {
            location: (value as ILocationDataItem) || null,
          },
          imageAccountItem.account.id,
        );
      }}
    >
      <ImgTextPubRestartLogin />
    </CommonLocationSelect>
  );
};

// 话题选择器
export const ImgTextTopicSelect = ({ ...props }: CommonTopicSelectProps) => {
  const { imageAccountItem } = useImagePlatParams();
  const { setOnePubParams, updateAccounts } = useImagePageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
      updateAccounts: state.updateAccounts,
    })),
  );
  const { topicMax } = AccountPlatInfoMap.get(
    imageAccountItem.account.type,
  )!.commonPubParamsConfig;
  props.maxCount = props.maxCount || topicMax;
  props.tips = props.tips || `您可以添加${topicMax}个话题`;

  return (
    <CommonTopicSelect
      {...props}
      account={imageAccountItem.account}
      value={imageAccountItem.pubParams!.topics!.map((v) => {
        return {
          value: v,
          label: v,
        };
      })}
      onAccountChange={(account) => {
        updateAccounts([account]);
      }}
      onChange={(newValue) => {
        setOnePubParams(
          {
            topics: (newValue as CommonTopicSelectValueType[]).map(
              (v) => v.label,
            ),
            diffParams: {
              ...imageAccountItem.pubParams.diffParams,
            },
          },
          imageAccountItem.account.id,
        );
      }}
    >
      <ImgTextPubRestartLogin />
    </CommonTopicSelect>
  );
};

// 用户选择器
export const ImgTextUserSelect = ({
  ...props
}: CommonUserSelectProps<IUsersItem>) => {
  const { imageAccountItem } = useImagePlatParams();
  const { setOnePubParams, updateAccounts } = useImagePageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
      updateAccounts: state.updateAccounts,
    })),
  );

  return (
    <CommonUserSelect
      {...props}
      account={imageAccountItem.account!}
      onAccountChange={(account) => {
        updateAccounts([account]);
      }}
      value={
        imageAccountItem.pubParams!.mentionedUserInfo?.map((v) => {
          return {
            ...v,
            id: v.value,
            name: v.label,
          };
        }) as any
      }
      onChange={(_, value) => {
        setOnePubParams(
          {
            mentionedUserInfo: value
              ? (value as IUsersItem[]).map((v) => {
                  return {
                    value: v.id,
                    label: v.name,
                  };
                })
              : undefined,
          },
          imageAccountItem.account.id,
        );
      }}
    >
      <ImgTextPubRestartLogin />
    </CommonUserSelect>
  );
};

// 标题
export const ImgTextTitleInput = ({
  placeholder,
  tips,
  title = '标题',
  maxLength = 20,
}: {
  placeholder: string;
  tips?: string;
  title?: string;
  maxLength?: number;
}) => {
  const { imageAccountItem } = useImagePlatParams();
  const { setOnePubParams } = useImagePageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
    })),
  );

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
        value={imageAccountItem.pubParams.title}
        maxLength={maxLength}
        placeholder={placeholder}
        showCount
        variant="filled"
        onChange={(e) => {
          setOnePubParams(
            {
              title: e.target.value,
            },
            imageAccountItem.account.id,
          );
        }}
      />
    </>
  );
};

// 描述
export const ImgTextDescTextArea = ({
  placeholder,
  title = '描述',
  maxLength = 1000,
}: {
  placeholder: string;
  tips?: string;
  title?: string;
  maxLength?: number;
}) => {
  const { imageAccountItem } = useImagePlatParams();
  const { setOnePubParams } = useImagePageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
    })),
  );

  return (
    <>
      <h1>{title}</h1>
      <TextArea
        value={imageAccountItem?.pubParams.describe}
        placeholder={placeholder}
        variant="filled"
        showCount
        maxLength={maxLength}
        autoSize={{ minRows: 6, maxRows: 6 }}
        onChange={(e) => {
          setOnePubParams(
            {
              describe: e.target.value,
            },
            imageAccountItem.account!.id,
          );
        }}
      />
    </>
  );
};

// 权限设置
export const ImgTextPubPermission = ({ ...props }: PubPermissionProps) => {
  const { imageAccountItem } = useImagePlatParams();
  const { setOnePubParams } = useImagePageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
    })),
  );
  return (
    <PubPermission
      style={{
        display: 'flex',
        gap: 4,
        flexDirection: 'column',
      }}
      onChange={(e) => {
        setOnePubParams(
          {
            visibleType: e,
          },
          imageAccountItem.account!.id,
        );
      }}
      value={imageAccountItem?.pubParams.visibleType}
      {...props}
    />
  );
};

// 定时发布
export const ImgTextScheduledTimeSelect = ({
  ...props
}: ICommonScheduledTimeSelectProps) => {
  const { imageAccountItem } = useImagePlatParams();
  const { setOnePubParams } = useImagePageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
    })),
  );

  return (
    <CommonScheduledTimeSelect
      {...props}
      platType={imageAccountItem?.account?.type}
      value={
        imageAccountItem?.pubParams.timingTime
          ? dayjs(imageAccountItem?.pubParams.timingTime)
          : undefined
      }
      onChange={(e) => {
        if (!imageAccountItem) return;
        setOnePubParams(
          {
            timingTime: e ? e.toDate() : undefined,
          },
          imageAccountItem.account.id,
        );
      }}
    />
  );
};
