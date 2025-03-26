import { useVideoPageStore } from '../../../../useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import { IVideoChooseItem } from '../../../../videoPage';
import { AccountPlatInfoMap } from '../../../../../../../account/comment';

export default function useVideoPubSetModal(
  currChooseAccount: IVideoChooseItem,
) {
  const { setOnePubParams } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
      videoListChoose: state.videoListChoose,
    })),
  );

  return {
    setOnePubParams,
    platInfo: AccountPlatInfoMap.get(currChooseAccount.account!.type)!,
  };
}
