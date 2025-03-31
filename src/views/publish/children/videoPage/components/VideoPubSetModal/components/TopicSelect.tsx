import React from 'react';
import CommonTopicSelect, {
  CommonTopicSelectProps,
  CommonTopicSelectValueType,
} from '../../../../../components/CommonComponents/CommonTopicSelect';
import { useVideoPageStore } from '../../../useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import { VideoPubRestartLogin } from './VideoPubSetModalCommon';
import useVideoPubSetModal from '../children/hooks/useVideoPubSetModal';

interface DebounceSelectProps
  extends CommonTopicSelectProps<CommonTopicSelectValueType> {}

// 话题选择器
export default function TopicSelect({ ...props }: DebounceSelectProps) {
  const { updateAccounts } = useVideoPageStore(
    useShallow((state) => ({
      updateAccounts: state.updateAccounts,
    })),
  );
  const { setOnePubParams, platInfo, currChooseAccount } =
    useVideoPubSetModal();
  const { topicMax } = platInfo.commonPubParamsConfig;
  props.maxCount = props.maxCount || topicMax;
  props.tips = props.tips || `您可以添加${topicMax}个话题`;

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
      <VideoPubRestartLogin />
    </CommonTopicSelect>
  );
}
