import {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "../chooseAccountModule.module.scss";
import {
  Avatar,
  Checkbox,
  Empty,
  Tooltip,
} from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { useShallow } from "zustand/react/shallow";
import { AccountPlatInfoMap } from "@/app/config/platConfig";
import { useAccountStore } from "@/store/account";
import Link from "next/link";
import { SocialAccount } from "@/api/types/account.type";

export interface ISimpleAccountChooseRef {
  /**
   * 恢复选中状态
   */
  recover: () => void;
  // 每次关闭弹框的时候需要初始化一些状态
  init: () => void;
}

export interface ISimpleAccountChooseProps {
  onChange?: (
    choosedAcounts: SocialAccount[],
    choosedAcount: SocialAccount,
  ) => void;
  // 外部传入的已经选中的数据，这个值只有在确认更改才会更新
  choosedAccounts?: SocialAccount[];
  // 是否禁用多选，true=禁用，false=不禁用
  disableAllSelect?: boolean;
  // 是否可以取消已经选择的账户，默认为 false
  isCancelChooseAccount?: boolean;
}

const SimpleAccountChoose = memo(
  forwardRef(
    (
      {
        onChange,
        choosedAccounts,
        disableAllSelect = false,
        isCancelChooseAccount = false,
      }: ISimpleAccountChooseProps,
      ref: ForwardedRef<ISimpleAccountChooseRef>,
    ) => {
      // 当前选择的账户数据
      const [choosedAccountsList, setChoosedAccountsList] = useState<SocialAccount[]>([]);
      // 每次change操作的数据
      const recentData = useRef<SocialAccount>();
      const { accountList } = useAccountStore(
        useShallow((state) => ({
          accountList: state.accountList,
        })),
      );

      // change事件
      useEffect(() => {
        if (!recentData.current) return;
        if (onChange) onChange(choosedAccountsList, recentData.current!);
      }, [choosedAccountsList, onChange]);

      const init = () => {
        recentData.current = undefined;
      };

      useImperativeHandle(ref, () => ({
        // 恢复到本次操作之前的状态
        recover() {
          setChoosedAccountsList(choosedAccounts || []);
        },
        init,
      }));

      // 全选/取消全选
      const handleSelectAll = (checked: boolean) => {
        recentData.current = accountList[0];
        setChoosedAccountsList(checked ? [...accountList] : []);
      };

      // 选择/取消选择单个账户
      const handleSelectAccount = (account: SocialAccount) => {
        recentData.current = account;
        setChoosedAccountsList(prev => {
          const isSelected = prev.some(item => item.id === account.id);
          if (isSelected) {
            return prev.filter(item => item.id !== account.id);
          } else {
            return [...prev, account];
          }
        });
      };

      return (
        <div className={styles.simpleAccountChoose}>
          {accountList.length === 0 ? (
            <div className="simpleAccountChoose-empty">
              <Empty
                description={
                  <>
                    无账户数据，请前往 <Link href="/accounts">账户</Link>
                    添加数据
                  </>
                }
              />
            </div>
          ) : (
            <>
              <div className="simpleAccountChoose-header">
                {!disableAllSelect && (
                  <Checkbox
                    indeterminate={
                      choosedAccountsList.length > 0 &&
                      choosedAccountsList.length < accountList.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    checked={choosedAccountsList.length === accountList.length}
                  >
                    选择所有账户
                  </Checkbox>
                )}
                <span className="simpleAccountChoose-count">
                  已选择 {choosedAccountsList.length} 个
                </span>
              </div>

              <div className="simpleAccountChoose-accounts">
                {accountList.map((account) => {
                  const platInfo = AccountPlatInfoMap.get(account.type);
                  const isSelected = choosedAccountsList.some(item => item.id === account.id);
                  const isDisable = choosedAccounts?.find((k) => k.id === account.id) && isCancelChooseAccount;

                  return (
                    <div
                      key={account.id}
                      className={[
                        "simpleAccountChoose-accounts-item",
                        isSelected && "simpleAccountChoose-accounts-item--active",
                        isDisable && "simpleAccountChoose-accounts-item--disable",
                      ].join(" ")}
                      onClick={() => {
                        if (isDisable) return;
                        handleSelectAccount(account);
                      }}
                    >
                      <Tooltip
                        title={
                          <>
                            <p>昵称：{account.nickname}</p>
                            <p>平台：{platInfo?.name}</p>
                          </>
                        }
                      >
                        <div className="simpleAccountChoose-accounts-item-avatar">
                          <Avatar src={account.avatar} size="large" />
                          {platInfo && (
                            <div className="simpleAccountChoose-accounts-item-platform">
                              <img src={platInfo.icon} alt={platInfo.name} />
                            </div>
                          )}
                        </div>
                        <span className="simpleAccountChoose-accounts-item-nickname">
                          {account.nickname}
                        </span>
                      </Tooltip>

                      <div className="simpleAccountChoose-accounts-item-choose">
                        <CheckOutlined />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      );
    },
  ),
);
SimpleAccountChoose.displayName = "SimpleAccountChoose";

export default SimpleAccountChoose; 