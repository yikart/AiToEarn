"use client";

import styles from "./accounts.module.scss";
import { useAccountStore } from "@/store/account";
import { useShallow } from "zustand/react/shallow";
import { useEffect, useState } from "react";
import { NoSSR } from "@kwooshung/react-no-ssr";
import AccountSidebar from "@/app/[lng]/accounts/components/AccountSidebar/AccountSidebar";
import CalendarTiming from "@/app/[lng]/accounts/components/CalendarTiming";

export default function AccountPageCore() {
  const { accountInit } = useAccountStore(
    useShallow((state) => ({
      accountInit: state.accountInit,
    })),
  );
  const [activeAccountId, setActiveAccountId] = useState("");

  useEffect(() => {
    accountInit();
  }, []);

  return (
    <NoSSR>
      <div className={styles.accounts}>
        <AccountSidebar
          activeAccountId={activeAccountId}
          onAccountChange={(account) => {
            console.log("change", account);
            setActiveAccountId(account.id);
          }}
        />
        <CalendarTiming />
      </div>
    </NoSSR>
  );
}
