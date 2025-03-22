import { ForwardedRef, forwardRef, memo, useMemo, useState } from 'react';
import { useImagePageStore } from '../../../useImagePageStore';
import { useShallow } from 'zustand/react/shallow';
import styles from './imageParamsSet.module.scss';
import { AccountType } from '../../../../../../../../commont/AccountEnum';
import { IImageAccountItem } from '../../../imagePage.type';
import { AccountPlatInfoMap } from '../../../../../../account/comment';
import { CloseOutlined } from '@ant-design/icons';
import ParamsSettingItem from './ParamsSettingItem';

export interface IImageParamsSetRef {}

export interface IImageParamsSetProps {}

const ImageParamsSet = memo(
  forwardRef(
    ({}: IImageParamsSetProps, ref: ForwardedRef<IImageParamsSetRef>) => {
      const { imageAccounts } = useImagePageStore(
        useShallow((state) => ({
          imageAccounts: state.imageAccounts,
        })),
      );
      // 当前选择的平台
      const [activePlat, setActivePlat] = useState<AccountType>();

      const platAccountImagesMap = useMemo(() => {
        const platAccountMap = new Map<AccountType, IImageAccountItem[]>([]);
        for (const imageAccount of imageAccounts) {
          if (!platAccountMap.has(imageAccount.account.type)) {
            platAccountMap.set(imageAccount.account.type, []);
          }
          platAccountMap.get(imageAccount.account.type)?.push(imageAccount);
        }

        if (!activePlat || !platAccountMap.has(activePlat)) {
          setActivePlat(Array.from(platAccountMap)[0][0]);
        }

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
                        console.log('close');
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
            <ParamsSettingItem
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
