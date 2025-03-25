import { ForwardedRef, forwardRef, memo, useMemo } from 'react';
import styles from './imageParamsSet.module.scss';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
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
  openChooseAccount: () => void;
}

// 图文发布右侧参数设置的具体参数设置，为了防止代码冗余拆分
const ParamsSettingDetails = memo(
  forwardRef(
    (
      { imageAccountList, openChooseAccount }: IParamsSettingDetailsProps,
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
          <h1 style={{ marginTop: '10px' }}>
            <span>发布账号</span>
            <i>*</i>
          </h1>
          <div className="paramsSettingItem-users">
            <div
              className="paramsSettingItem-users-item"
              onClick={openChooseAccount}
            >
              <div className="paramsSettingItem-users-item-img">
                <Avatar size="large" icon={<PlusOutlined />} />
              </div>
              <p className="paramsSettingItem-users-item-name">发布账号</p>
            </div>

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
