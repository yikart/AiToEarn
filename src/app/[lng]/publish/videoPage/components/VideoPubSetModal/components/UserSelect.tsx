import { useVideoPageStore } from "../../../useVideoPageStore";
import { useShallow } from "zustand/react/shallow";
import { VideoPubRestartLogin } from "./VideoPubSetModalCommon";
import React from "react";
import useVideoPubSetModal from "../children/hooks/useVideoPubSetModal";
import { IUsersItem } from "@/app/plat/plat.type";
import CommonUserSelect, {
  CommonUserSelectProps,
} from "@/app/[lng]/publish/components/CommonComponents/CommonUserSelect";

interface DebounceSelectProps extends CommonUserSelectProps<IUsersItem> {}

// 视频发布用户选择器
export default function UserSelect({ ...props }: DebounceSelectProps) {
  const { updateAccounts } = useVideoPageStore(
    useShallow((state) => ({
      updateAccounts: state.updateAccounts,
    })),
  );
  const { setOnePubParams, currChooseAccount } = useVideoPubSetModal();

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
        setOnePubParams({
          mentionedUserInfo: value
            ? (value as IUsersItem[]).map((v) => {
                return {
                  value: v.id,
                  label: v.name,
                };
              })
            : undefined,
        });
      }}
    >
      <VideoPubRestartLogin />
    </CommonUserSelect>
  );
}
