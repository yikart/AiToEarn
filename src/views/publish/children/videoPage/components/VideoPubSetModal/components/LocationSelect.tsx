import React from 'react';
import { SelectProps } from 'antd';
import { ILocationDataItem } from '../../../../../../../../electron/main/plat/plat.type';
import { IVideoChooseItem } from '@/views/publish/children/videoPage/videoPage';
// @ts-ignore
import CommonLocationSelect from '../../../../../components/CommonComponents/CommonLocationSelect';
import { useVideoPageStore } from '../../../useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';

interface DebounceSelectProps<ValueType = any>
  extends Omit<SelectProps<ValueType | ValueType[]>, 'options' | 'children'> {
  currChooseAccount: IVideoChooseItem;
}

// 话题选择器
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
      value={currChooseAccount.pubParams!.location as any}
      onAccountChange={(account) => {
        updateAccounts({ accounts: [account] });
      }}
      onChange={(_, value) => {
        setOnePubParams(
          {
            location: (value as ILocationDataItem) || null,
          },
          currChooseAccount.id,
        );
      }}
    />
  );
}
