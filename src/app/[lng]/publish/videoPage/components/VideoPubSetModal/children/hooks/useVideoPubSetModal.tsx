import { useVideoPageStore } from "../../../../useVideoPageStore";
import { useShallow } from "zustand/react/shallow";
import { AccountPlatInfoMap, PlatType } from "@/app/config/platConfig";

export default function useVideoPubSetModal() {
  const { setOnePubParams, currChooseAccount } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
      currChooseAccount: state.currChooseAccount,
    })),
  );

  return {
    setOnePubParams,
    platInfo: currChooseAccount?.account
      ? AccountPlatInfoMap.get(currChooseAccount!.account!.type)!
      : AccountPlatInfoMap.get(PlatType.Douyin)!,
    currChooseAccount: currChooseAccount!,
  };
}
