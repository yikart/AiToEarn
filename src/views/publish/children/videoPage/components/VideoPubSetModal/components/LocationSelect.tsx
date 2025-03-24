import React from 'react';
import { SelectProps } from 'antd';
import { ILocationDataItem } from '../../../../../../../../electron/main/plat/plat.type';
import { IVideoChooseItem } from '@/views/publish/children/videoPage/videoPage';
import CommonLocationSelect from '../../../../../components/CommonComponents/CommonLocationSelect';
import { useVideoPageStore } from '../../../useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import { VideoPubRestartLogin } from './VideoPubSetModalCommon';

interface DebounceSelectProps<ValueType = any>
  extends Omit<SelectProps<ValueType | ValueType[]>, 'options' | 'children'> {
  currChooseAccount: IVideoChooseItem;
}

// 位置选择器
export default function LocationSelect({
  currChooseAccount,
  ...props
}: DebounceSelectProps<ILocationDataItem>) {
  const { setOnePubParams, updateAccounts } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
      updateAccounts: state.updateAccounts,
    })),
  );

  return (
    <CommonLocationSelect
      {...props}
      account={currChooseAccount.account}
      value={currChooseAccount.pubParams!.location}
      onAccountChange={(account) => {
        updateAccounts({ accounts: [account] });
      }}
      onChange={(_, value) => {
        setOnePubParams(
          {
            location: value as ILocationDataItem,
          },
          currChooseAccount.id,
        );
      }}
    >
      <VideoPubRestartLogin currChooseAccount={currChooseAccount} />
    </CommonLocationSelect>
  );
}
