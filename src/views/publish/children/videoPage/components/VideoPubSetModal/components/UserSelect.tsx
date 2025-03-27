import { IVideoChooseItem } from '@/views/publish/children/videoPage/videoPage';
import CommonUserSelect, {
  CommonUserSelectProps,
} from '../../../../../components/CommonComponents/CommonUserSelect';
import { IUsersItem } from '../../../../../../../../electron/main/plat/plat.type';
import { useVideoPageStore } from '../../../useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import { VideoPubRestartLogin } from './VideoPubSetModalCommon';
import React from 'react';
import useVideoPubSetModal from '../children/hooks/useVideoPubSetModal';

interface DebounceSelectProps extends CommonUserSelectProps<IUsersItem> {
  currChooseAccount: IVideoChooseItem;
}

// 视频发布用户选择器
export default function UserSelect({
  currChooseAccount,
  ...props
}: DebounceSelectProps) {
  const { updateAccounts } = useVideoPageStore(
    useShallow((state) => ({
      updateAccounts: state.updateAccounts,
    })),
  );
  const { setOnePubParams } = useVideoPubSetModal(currChooseAccount);

  return (
    <CommonUserSelect
      {...props}
      account={currChooseAccount.account!}
      onAccountChange={(account) => {
        updateAccounts({
          accounts: [account],
        });
      }}
      value={
        currChooseAccount.pubParams!.mentionedUserInfo?.map((v) => {
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
          currChooseAccount.id,
        );
      }}
    >
      <VideoPubRestartLogin currChooseAccount={currChooseAccount} />
    </CommonUserSelect>
  );
}
