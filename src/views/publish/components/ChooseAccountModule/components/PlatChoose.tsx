import {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import useCssVariables from '@/hooks/useCssVariables';
import { AccountType } from '../../../../../../commont/AccountEnum';
import { AccountInfo, AccountPlatInfoMap } from '@/views/account/comment';
import { icpGetAccountList } from '@/icp/account';
import styles from '@/views/publish/components/ChooseAccountModule/chooseAccountModule.module.scss';
import {
  Avatar,
  Badge,
  Checkbox,
  ConfigProvider,
  Segmented,
  Tooltip,
} from 'antd';
import { PubType } from '../../../../../../commont/publish/PublishEnum';
import { CheckOutlined } from '@ant-design/icons';
import { onAccountLoginFinish } from '@/icp/receiveMsg';

export interface IPlatChooseRef {
  /**
   * 恢复选中状态
   * @param choosedAccounts
   */
  recover: () => void;
  // 每次关闭弹框的时候需要初始化一些状态
  init: () => void;
}

export interface IPlatChooseProps {
  pubType: PubType;
  onChange: (choosedAcounts: AccountInfo[], choosedAcount: AccountInfo) => void;
  // 外部传入的已经选中的数据，这个值只有在确认更改才会更新
  choosedAccounts?: AccountInfo[];
  // 按平台 是否禁用多选，true=禁用，false=不禁用
  disableAllSelect: boolean;
}

const PlatChoose = memo(
  forwardRef(
    (
      {
        pubType,
        onChange,
        choosedAccounts,
        disableAllSelect,
      }: IPlatChooseProps,
      ref: ForwardedRef<IPlatChooseRef>,
    ) => {
      const cssVars = useCssVariables();
      // 用于渲染的所有账户数据
      const [accountMap, setAccountMap] = useState<
        Map<AccountType, AccountInfo[]>
      >(new Map());
      // 当前选择的平台
      const [activePlat, setActivePlat] = useState<AccountType | undefined>();
      // 当前选择的账户数据
      const [choosedAcountMap, setChoosedAcountMap] = useState<
        Map<AccountType, AccountInfo[]>
      >(new Map());
      // 每次change操作的数据
      const recentData = useRef<AccountInfo>();

      // 所有平台的账户数据
      const getAllAccountList = useMemo(() => {
        const allAccountList = [];
        for (const [_, accountList] of accountMap) {
          allAccountList.push(...accountList);
        }
        return allAccountList;
      }, [accountMap]);

      // 当前选择的所有平台的账户数据
      const getChoosedAllAccountList = useMemo(() => {
        const allAccountList = [];
        for (const [_, accountList] of choosedAcountMap) {
          allAccountList.push(...accountList);
        }
        return allAccountList;
      }, [choosedAcountMap]);

      // 当前平台的所有用户数据
      const currAccountList = useMemo(
        () => (activePlat && accountMap.get(activePlat)) || [],
        [activePlat, accountMap],
      );

      // 当前平台的选择账户的数据
      const currChoosedAcount = useMemo(
        () => (activePlat && choosedAcountMap.get(activePlat)) || [],
        [activePlat, choosedAcountMap],
      );

      const getAccountList = () => {
        icpGetAccountList().then((res) => {
          if (!res) return;
          setAccountMap((prevMap) => {
            const newMap = new Map(prevMap);
            Array.from(AccountPlatInfoMap).map(([key, value]) => {
              if (value.pubTypes.has(pubType)) {
                newMap.set(key, []);
              }
            });
            // 添加渲染账户数据值
            res.map((v) => {
              newMap.get(v.type)?.push(v);
            });
            // 默认平台
            setActivePlat((Array.from(newMap)[0] || [])[0]);
            return newMap;
          });
        });
      };

      useEffect(() => {
        getAccountList();

        const revmoeListener = onAccountLoginFinish(() => {
          getAccountList();
        });

        return () => {
          setAccountMap(new Map());
          setChoosedAcountMap(new Map());
          init();
          revmoeListener();
        };
      }, []);

      // change事件
      useEffect(() => {
        if (!recentData.current) return;
        let accounts: AccountInfo[] = [];
        Array.from(choosedAcountMap).map(([key, value]) => {
          accounts = [...accounts, ...value];
        });
        onChange(accounts, recentData.current!);
      }, [choosedAcountMap]);

      const init = () => {
        recentData.current = undefined;
      };

      useImperativeHandle(ref, () => ({
        // 恢复到本次操作之前的状态
        recover() {
          if (!choosedAccounts || choosedAccounts.length === 0)
            return setChoosedAcountMap(new Map());

          setChoosedAcountMap(() => {
            const newV = new Map();
            choosedAccounts.map((v) => {
              if (!newV.has(v.type)) newV.set(v.type, []);
              newV.get(v.type)!.push(v);
            });
            return newV;
          });
        },
        init,
      }));

      return (
        <div className={styles.platChoose}>
          <div className="platChoose-platSelect">
            {!disableAllSelect && (
              <Checkbox
                indeterminate={
                  getChoosedAllAccountList.length > 0 &&
                  getChoosedAllAccountList.length < getAllAccountList.length
                }
                onChange={(e) => {
                  const { checked } = e.target;
                  setChoosedAcountMap((v) => {
                    const newMap = new Map(v);
                    recentData.current = currAccountList[0];

                    for (const [accountType, accountList] of accountMap) {
                      if (checked) {
                        newMap.set(accountType, accountList);
                      } else {
                        newMap.set(accountType, []);
                      }
                    }
                    return newMap;
                  });
                }}
                checked={
                  getAllAccountList.length === getChoosedAllAccountList.length
                }
              >
                选择所有平台账户
              </Checkbox>
            )}
            <ConfigProvider
              theme={{
                components: {
                  Segmented: {
                    trackBg: '#fff',
                    itemSelectedBg: cssVars['--colorPrimary1'],
                    itemHoverBg: cssVars['--colorPrimary2'],
                    itemActiveBg: cssVars['--colorPrimary3'],
                    itemSelectedColor: cssVars['--colorPrimary9'],
                  },
                },
              }}
            >
              <Segmented
                vertical
                size="large"
                value={activePlat}
                options={Array.from(accountMap)
                  .map(([key, value]) => {
                    if (value.length === 0) return undefined;
                    const platInfo = AccountPlatInfoMap.get(key)!;
                    return {
                      value: key,
                      label: platInfo.name,
                      icon: (
                        <Badge
                          count={choosedAcountMap.get(key)?.length}
                          size="small"
                        >
                          <img src={platInfo.icon} />
                        </Badge>
                      ),
                    };
                  })
                  .filter((v) => v !== undefined)}
                onChange={setActivePlat}
              />
            </ConfigProvider>
          </div>

          <div className="platChoose-con">
            {currAccountList && (
              <>
                {!disableAllSelect ? (
                  <Checkbox
                    indeterminate={
                      currChoosedAcount.length > 0 &&
                      currChoosedAcount.length < currAccountList.length
                    }
                    onChange={(e) => {
                      setChoosedAcountMap((v) => {
                        recentData.current = currAccountList[0];
                        return new Map(v).set(
                          activePlat!,
                          e.target.checked ? currAccountList : [],
                        );
                      });
                    }}
                    checked={
                      currChoosedAcount.length === currAccountList.length
                    }
                  >
                    全选 已选择 {currChoosedAcount.length} 个
                  </Checkbox>
                ) : (
                  <span>已选择 {currChoosedAcount.length} 个</span>
                )}
                <div className="platChoose-accounts">
                  {currAccountList.map((v) => {
                    // true=禁用
                    const isDisable = choosedAccounts?.find(
                      (k) => k.id === v.id,
                    );
                    return (
                      <div
                        key={v.id}
                        className={[
                          'platChoose-accounts-item',
                          currChoosedAcount.find((k) => k.id === v.id) &&
                            'platChoose-accounts-item--active',
                          isDisable && 'platChoose-accounts-item--disable',
                        ].join(' ')}
                        onClick={() => {
                          if (isDisable) return;
                          recentData.current = v;
                          setChoosedAcountMap((prevV) => {
                            const newV = new Map(prevV);
                            let list = newV.get(activePlat!);
                            if (!list) {
                              list = [];
                              newV.set(activePlat!, list);
                            }
                            // 是否存在
                            if (list.some((k) => k.id === v.id)) {
                              // 有、去掉
                              list = list.filter((k) => k.id !== v.id);
                            } else {
                              // 无、添加
                              list.push(v);
                            }
                            newV.set(activePlat!, list);
                            return newV;
                          });
                        }}
                      >
                        <Tooltip
                          title={
                            <>
                              <p>昵称：{v.nickname}</p>
                            </>
                          }
                        >
                          <Avatar src={v.avatar} />
                          <span className="platChoose-accounts-item-nickname">
                            {v.nickname}
                          </span>
                        </Tooltip>

                        <div className="platChoose-accounts-item-choose">
                          <CheckOutlined />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      );
    },
  ),
);
PlatChoose.displayName = 'PlatChoose';

export default PlatChoose;
