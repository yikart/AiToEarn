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
  Collapse,
} from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { useShallow } from "zustand/react/shallow";
import { AccountPlatInfoMap } from "@/app/config/platConfig";
import { useAccountStore } from "@/store/account";
import Link from "next/link";
import { SocialAccount } from "@/api/types/account.type";
import { getAccountGroupApi } from "@/api/account";
import { AccountGroupItem } from "@/api/types/account.type";

// 分组类型定义
interface AccountGroup {
  id: string;
  name: string;
  rank: number;
  isDefault: boolean;
  children?: SocialAccount[];
}

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
  // 是否显示分组，默认为 true
  showGroup?: boolean;
}

const SimpleAccountChoose = memo(
  forwardRef(
    (
      {
        onChange,
        choosedAccounts,
        disableAllSelect = false,
        isCancelChooseAccount = false,
        showGroup = true,
      }: ISimpleAccountChooseProps,
      ref: ForwardedRef<ISimpleAccountChooseRef>,
    ) => {
      // 当前选择的账户数据
      const [choosedAccountsList, setChoosedAccountsList] = useState<SocialAccount[]>([]);
      // 分组数据
      const [accountGroupList, setAccountGroupList] = useState<AccountGroup[]>([]);
      // 每次change操作的数据
      const recentData = useRef<SocialAccount>();
      const { accountList } = useAccountStore(
        useShallow((state) => ({
          accountList: state.accountList,
        })),
      );

      // 获取分组数据
      const fetchAccountGroups = async () => {
        try {
          const res = await getAccountGroupApi();
          const groupList = res?.data;

          if (!groupList || groupList.length === 0) return;

          const accountGroupList: AccountGroup[] = [];
          // key=组ID，val=账户组
          const accountGroupMap = new Map<string, AccountGroup>();

          const defaultGroup = groupList.find((v:any) => v.isDefault)!;

          groupList.map((v:any) => {
            const accountGroupItem = {
              ...v,
              children: [],
            };
            accountGroupList.push(accountGroupItem);
            accountGroupMap.set(v.id, accountGroupItem);
          });

          accountList.map((v) => {
            (
              accountGroupMap.get(v.groupId!) ||
              accountGroupMap.get(defaultGroup.id)!
            ).children?.push(v);
          });

          accountGroupList.sort((a, b) => {
            return a.rank - b.rank;
          });

          setAccountGroupList(accountGroupList);
        } catch (error) {
          console.error('获取账户分组失败:', error);
        }
      };

      // 初始化分组数据
      useEffect(() => {
        if (showGroup && accountList.length > 0) {
          fetchAccountGroups();
        }
      }, [showGroup, accountList]);

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

      // 选择/取消选择分组内所有账户
      const handleSelectGroup = (group: AccountGroup, checked: boolean) => {
        if (!group.children || group.children.length === 0) return;
        
        recentData.current = group.children[0];
        setChoosedAccountsList(prev => {
          const groupAccountIds = group.children!.map(account => account.id);
          const selectedInGroup = prev.filter(account => groupAccountIds.includes(account.id));
          
          if (checked) {
            // 选择分组内所有账户
            const otherAccounts = prev.filter(account => !groupAccountIds.includes(account.id));
            return [...otherAccounts, ...group.children!];
          } else {
            // 取消选择分组内所有账户
            return prev.filter(account => !groupAccountIds.includes(account.id));
          }
        });
      };

      // 渲染单个账户
      const renderAccount = (account: SocialAccount) => {
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
      };

      // 渲染分组内容
      const renderGroupContent = () => {
        if (!showGroup || accountGroupList.length === 0) {
          return (
            <div className="simpleAccountChoose-accounts">
              {accountList.map(renderAccount)}
            </div>
          );
        }

        return (
          <Collapse
            defaultActiveKey={accountGroupList.map(group => group.id)}
            className="simpleAccountChoose-groups"
          >
            {accountGroupList.map((group) => {
              const groupAccountIds = group.children?.map(account => account.id) || [];
              const selectedInGroup = choosedAccountsList.filter(account => 
                groupAccountIds.includes(account.id)
              );
              const isGroupSelected = selectedInGroup.length === group.children?.length;
              const isGroupIndeterminate = selectedInGroup.length > 0 && selectedInGroup.length < (group.children?.length || 0);

              return (
                <Collapse.Panel
                  key={group.id}
                  header={
                    <div className="simpleAccountChoose-group-header">
                      <Checkbox
                        indeterminate={isGroupIndeterminate}
                        checked={isGroupSelected}
                        onChange={(e) => handleSelectGroup(group, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {group.name} ({group.children?.length || 0})
                      </Checkbox>
                    </div>
                  }
                >
                  <div className="simpleAccountChoose-accounts">
                    {group.children?.map(renderAccount)}
                  </div>
                </Collapse.Panel>
              );
            })}
          </Collapse>
        );
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

              {renderGroupContent()}
            </>
          )}
        </div>
      );
    },
  ),
);
SimpleAccountChoose.displayName = "SimpleAccountChoose";

export default SimpleAccountChoose; 