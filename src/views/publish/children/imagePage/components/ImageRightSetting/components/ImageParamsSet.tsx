import { ForwardedRef, forwardRef, memo, useMemo } from 'react';
import { useImagePageStore } from '../../../useImagePageStore';
import { useShallow } from 'zustand/react/shallow';
import styles from './imageParamsSet.module.scss';
import { AccountType } from '../../../../../../../../commont/AccountEnum';
import { IImageAccountItem } from '../../../imagePage.type';
import { AccountPlatInfoMap } from '../../../../../../account/comment';
import { CloseOutlined } from '@ant-design/icons';
import ParamsSettingDetails from './ParamsSettingDetails';

export interface IImageParamsSetRef {}

export interface IImageParamsSetProps {}

const ImageParamsSet = memo(
  forwardRef(
    ({}: IImageParamsSetProps, ref: ForwardedRef<IImageParamsSetRef>) => {
      const {
        imageAccounts,
        activePlat,
        setActivePlat,
        setPlatActiveAccountMap,
        platActiveAccountMap,
        delAccountByPalt,
      } = useImagePageStore(
        useShallow((state) => ({
          imageAccounts: state.imageAccounts,
          setActivePlat: state.setActivePlat,
          activePlat: state.activePlat,
          setPlatActiveAccountMap: state.setPlatActiveAccountMap,
          platActiveAccountMap: state.platActiveAccountMap,
          delAccountByPalt: state.delAccountByPalt,
        })),
      );

      const platAccountImagesMap = useMemo(() => {
        // 平台账户map
        const platAccountMap = new Map<AccountType, IImageAccountItem[]>([]);
        // 默认选中的平台map
        const newPlatActiveAccountMap = new Map<
          AccountType,
          IImageAccountItem
        >();

        for (const imageAccount of imageAccounts) {
          if (!platAccountMap.has(imageAccount.account.type)) {
            platAccountMap.set(imageAccount.account.type, []);
            newPlatActiveAccountMap.set(
              imageAccount.account.type,
              imageAccount,
            );
          }
          platAccountMap.get(imageAccount.account.type)?.push(imageAccount);
        }

        // 将旧的选中的平台账户设置为新的
        for (const [accountType, imageAccountItem] of newPlatActiveAccountMap) {
          // 旧的选中账户
          const activeImageAccountItem = platActiveAccountMap.get(accountType);
          if (
            !activeImageAccountItem ||
            activeImageAccountItem.account.id === imageAccountItem.account.id
          )
            continue;

          // 旧的选中账户新的账户列表是否存在，如果存在则使用上一次选中的状态
          if (
            platAccountMap
              .get(accountType)!
              .some((v) => v.account.id === activeImageAccountItem.account.id)
          ) {
            newPlatActiveAccountMap.set(
              accountType,
              platActiveAccountMap.get(accountType)!,
            );
            break;
          }
        }

        // 当前选择的平台不存在了
        if (!activePlat || !platAccountMap.has(activePlat)) {
          setActivePlat(Array.from(platAccountMap)[0][0]);
        }

        // 设置store当前选择的平台账户
        setPlatActiveAccountMap(newPlatActiveAccountMap);
        return platAccountMap;
      }, [imageAccounts]);

      return (
        <div className={styles.imageParamsSet}>
          <div className="imageParamsSet_plats">
            {Array.from(platAccountImagesMap).map(([accountType]) => {
              const platInfo = AccountPlatInfoMap.get(accountType)!;
              return (
                <div
                  className={[
                    'imageParamsSet_plats-item',
                    accountType === activePlat &&
                      'imageParamsSet_plats-item--active',
                  ].join(' ')}
                  key={accountType}
                  onClick={() => {
                    setActivePlat(accountType);
                  }}
                >
                  <div className="imageParamsSet_plats-item-img">
                    <img src={platInfo.icon} />
                    <div
                      className={`${styles.closeIcon} imageParamsSet_plats-item-close`}
                      onClick={(e) => {
                        e.stopPropagation();
                        delAccountByPalt(accountType);
                      }}
                    >
                      <CloseOutlined />
                    </div>
                  </div>
                  <span>{platInfo.name}</span>
                </div>
              );
            })}
          </div>
          {activePlat && (
            <ParamsSettingDetails
              imageAccountList={platAccountImagesMap.get(activePlat)!}
            />
          )}
        </div>
      );
    },
  ),
);
ImageParamsSet.displayName = 'ImageParamsSet';

export default ImageParamsSet;
