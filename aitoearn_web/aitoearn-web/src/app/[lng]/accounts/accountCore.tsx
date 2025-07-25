"use client";

import styles from "./accounts.module.scss";
import { useAccountStore } from "@/store/account";
import { useShallow } from "zustand/react/shallow";
import { useEffect } from "react";
import { NoSSR } from "@kwooshung/react-no-ssr";
import AccountSidebar from "@/app/[lng]/accounts/components/AccountSidebar/AccountSidebar";
import CalendarTiming from "@/app/[lng]/accounts/components/CalendarTiming";

export default function AccountPageCore() {
  const { accountInit, accountActive, setAccountActive } = useAccountStore(
    useShallow((state) => ({
      accountInit: state.accountInit,
      setAccountActive: state.setAccountActive,
      accountActive: state.accountActive,
    })),
  );

  useEffect(() => {
    accountInit();
  }, []);

  return (
    <NoSSR>
      <div className={styles.accounts}>
        <AccountSidebar
          activeAccountId={accountActive?.id || ""}
          onAccountChange={(account) => {
            if (account.id === accountActive?.id) {
              setAccountActive(undefined);
            } else {
              setAccountActive(account);
            }
          }}
        />
        <CalendarTiming />
      </div>
    </NoSSR>
  );
}
