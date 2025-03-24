import { ForwardedRef, forwardRef, memo, useMemo } from 'react';
import styles from './imageParamsSet.module.scss';
import { CloseOutlined } from '@ant-design/icons';
import { Avatar, Tooltip } from 'antd';
import { AccountType } from '../../../../../../../../commont/AccountEnum';
import ImageParamsSet_Douyin from './children/ImageParamsSet_Douyin';
import ImageParamsSet_XHS from './children/ImageParamsSet_XHS';
import { IImageAccountItem } from '../../../imagePage.type';
import { useImagePageStore } from '../../../useImagePageStore';
import { useShallow } from 'zustand/react/shallow';

export interface IParamsSettingDetailsRef {}

export interface IParamsSettingDetailsProps {
  imageAccountList: IImageAccountItem[];
}

const ParamsSettingDetails = memo(
  forwardRef(
    (
      { imageAccountList }: IParamsSettingDetailsProps,
      ref: ForwardedRef<IParamsSettingDetailsRef>,
    ) => {
      const {
        activePlat,
        platActiveAccountMap,
        delAccountById,
        setPlatActiveAccountMap,
      } = useImagePageStore(
        useShallow((state) => ({
          activePlat: state.activePlat,
          platActiveAccountMap: state.platActiveAccountMap,
          setPlatActiveAccountMap: state.setPlatActiveAccountMap,
          delAccountById: state.delAccountById,
        })),
      );

      const currAccountItem = useMemo(() => {
        if (!activePlat) return undefined;
        return platActiveAccountMap.get(activePlat);
      }, [platActiveAccountMap, activePlat]);

      return (
        <div className={styles.paramsSettingItem}>
          <h2>
            <span>发布账号</span>
            <i>*</i>
          </h2>
          <div className="paramsSettingItem-users">
            {imageAccountList.map((v) => {
              return (
                <div
                  className={[
                    'paramsSettingItem-users-item',
                    currAccountItem?.account?.id === v.account.id &&
                      'paramsSettingItem-users-item--active',
                  ].join(' ')}
                  key={v.account.id}
                  onClick={() => {
                    const newPlatActiveAccountMap = new Map(
                      platActiveAccountMap,
                    );
                    newPlatActiveAccountMap.set(activePlat!, v);
                    setPlatActiveAccountMap(newPlatActiveAccountMap);
                  }}
                >
                  <div className="paramsSettingItem-users-item-img">
                    <div
                      className={`paramsSettingItem-users-item-close ${styles.closeIcon}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        delAccountById(v.account.id);
                      }}
                    >
                      <CloseOutlined />
                    </div>
                    <Avatar src={v.account.avatar} size="large" />
                  </div>
                  <Tooltip title={v.account.nickname}>
                    <p className="paramsSettingItem-users-item-name">
                      {v.account.nickname}
                    </p>
                  </Tooltip>
                </div>
              );
            })}
          </div>

          {(() => {
            switch (activePlat) {
              case AccountType.Douyin:
                return <ImageParamsSet_Douyin />;
              case AccountType.Xhs:
                return <ImageParamsSet_XHS />;
            }
          })()}
        </div>
      );
    },
  ),
);
ParamsSettingDetails.displayName = 'ParamsSettingDetails';

export default ParamsSettingDetails;
