"use client";

import styles from "./accounts.module.scss";
import { useAccountStore } from "@/store/account";
import { useShallow } from "zustand/react/shallow";
import { useEffect, useState } from "react";
import { NoSSR } from "@kwooshung/react-no-ssr";
import AccountSidebar from "@/app/[lng]/accounts/components/AccountSidebar/AccountSidebar";

export default function AccountPageCore() {
  const { init } = useAccountStore(
    useShallow((state) => ({
      init: state.init,
    })),
  );
  const [activeAccountId, setActiveAccountId] = useState(-1);

  useEffect(() => {
    init();
  }, []);

  return (
    <NoSSR>
      <div className={styles.accounts}>
        <AccountSidebar
          activeAccountId={activeAccountId}
          onAccountChange={() => {
            console.log("change");
          }}
        />
      </div>
    </NoSSR>
  );
}
