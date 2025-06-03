import React from "react";
import { SelectProps } from "antd";
import { useVideoPageStore } from "../../../useVideoPageStore";
import { useShallow } from "zustand/react/shallow";
import { VideoPubRestartLogin } from "./VideoPubSetModalCommon";
import useVideoPubSetModal from "../children/hooks/useVideoPubSetModal";
import { ILocationDataItem } from "@/app/[lng]/publish/videoPage/videoPage";
import CommonLocationSelect from "@/app/[lng]/publish/components/CommonComponents/CommonLocationSelect";

interface DebounceSelectProps<ValueType = any>
  extends Omit<SelectProps<ValueType | ValueType[]>, "options" | "children"> {}

// 位置选择器
export default function LocationSelect({
  ...props
}: DebounceSelectProps<ILocationDataItem>) {
  const { setOnePubParams, updateAccounts } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
      updateAccounts: state.updateAccounts,
    })),
  );
  const { currChooseAccount } = useVideoPubSetModal();

  return (
    <CommonLocationSelect
      {...props}
      account={currChooseAccount.account}
      value={currChooseAccount.pubParams!.location}
      onAccountChange={(account) => {
        updateAccounts({ accounts: [account] });
      }}
      onChange={(_, value) => {
        setOnePubParams({
          location: value as ILocationDataItem,
        });
      }}
    >
      <VideoPubRestartLogin />
    </CommonLocationSelect>
  );
}
