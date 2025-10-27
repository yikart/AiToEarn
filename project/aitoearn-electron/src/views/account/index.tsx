/*
 * @Author: nevin
 * @Date: 2025-01-17 20:44:02
 * @LastEditTime: 2025-02-08 10:19:52
 * @LastEditors: nevin
 * @Description: 账户
 */

import React, { useCallback, useState } from 'react';

import styles from './account.module.scss';
import AccountSidebar from './components/AccountSidebar/AccountSidebar';
import WebView from '@/components/WebView';
import { AccountInfo, AccountPlatInfoMap } from '@/views/account/comment';

const Account: React.FC = () => {
  const [activeAccountId, setActiveAccountId] = useState(-1);
  const [accountInfo, setAccountInfo] = useState<AccountInfo>();

  return (
    <div className={styles.account}>
      <AccountSidebar
        activeAccountId={activeAccountId}
        onAccountChange={useCallback((info) => {
          setActiveAccountId(info.id);
          setAccountInfo(info);
        }, [])}
      />
      <div className="account-con">
        {accountInfo ? (
          <WebView
            url={AccountPlatInfoMap.get(accountInfo.type)!.url!}
            cookieParams={{
              cookies: JSON.parse(accountInfo.loginCookie),
            }}
            key={activeAccountId}
          />
        ) : (
          <div className="account-noSelect">未选择账户</div>
        )}
      </div>
    </div>
  );
};

export default Account;
