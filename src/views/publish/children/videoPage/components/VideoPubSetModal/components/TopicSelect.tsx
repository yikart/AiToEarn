import React from 'react';
import CommonTopicSelect, {
  CommonTopicSelectProps,
  CommonTopicSelectValueType,
} from '../../../../../components/CommonComponents/CommonTopicSelect';
import { IVideoChooseItem } from '../../../videoPage';
import { useVideoPageStore } from '../../../useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import { VideoPubRestartLogin } from './VideoPubSetModalCommon';

interface DebounceSelectProps
  extends CommonTopicSelectProps<CommonTopicSelectValueType> {
  currChooseAccount: IVideoChooseItem;
}

// 话题选择器
export default function TopicSelect({
  currChooseAccount,
  ...props
}: DebounceSelectProps) {
  const { setOnePubParams, updateAccounts } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
      updateAccounts: state.updateAccounts,
    })),
  );

  return (
    <CommonTopicSelect
      {...props}
      account={currChooseAccount.account}
      value={currChooseAccount.pubParams!.topics!.map((v) => {
        return {
          value: v,
          label: v,
        };
      })}
      onAccountChange={(account) => {
        updateAccounts({ accounts: [account] });
      }}
      onChange={(newValue) => {
        setOnePubParams(
          {
            topics: (newValue as CommonTopicSelectValueType[]).map(
              (v) => v.label,
            ),
            diffParams: {
              ...currChooseAccount.pubParams.diffParams,
            },
          },
          currChooseAccount.id,
        );
      }}
    >
      <VideoPubRestartLogin currChooseAccount={currChooseAccount} />
    </CommonTopicSelect>
  );
}
