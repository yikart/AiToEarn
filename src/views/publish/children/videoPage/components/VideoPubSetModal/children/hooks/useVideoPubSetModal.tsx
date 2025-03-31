import { useVideoPageStore } from '../../../../useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import { AccountPlatInfoMap } from '../../../../../../../account/comment';

export default function useVideoPubSetModal() {
  const { setOnePubParams, currChooseAccount } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
      currChooseAccount: state.currChooseAccount,
    })),
  );

  return {
    setOnePubParams,
    platInfo: AccountPlatInfoMap.get(currChooseAccount!.account!.type)!,
    currChooseAccount: currChooseAccount!,
  };
}
