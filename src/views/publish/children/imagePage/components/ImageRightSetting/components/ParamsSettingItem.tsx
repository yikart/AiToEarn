import { ForwardedRef, forwardRef, memo, useEffect } from 'react';
import { IImageAccountItem } from '../../../imagePage.type';
import { AccountType } from '../../../../../../../../commont/AccountEnum';
import ImageParamsSet_Douyin from './children/ImageParamsSet_Douyin';
import ImageParamsSet_XHS from './children/ImageParamsSet_XHS';
import styles from './imageParamsSet.module.scss';
import { Avatar, Tooltip } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

export interface IParamsSettingItemRef {}

export interface IParamsSettingItemProps {
  imageAccountList: IImageAccountItem[];
}

const ParamsSettingItem = memo(
  forwardRef(
    (
      { imageAccountList }: IParamsSettingItemProps,
      ref: ForwardedRef<IParamsSettingItemRef>,
    ) => {
      useEffect(() => {
        console.log(imageAccountList);
      }, [imageAccountList]);

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
                  className="paramsSettingItem-users-item"
                  key={v.account.id}
                >
                  <div className="paramsSettingItem-users-item-img">
                    <div
                      className={`paramsSettingItem-users-item-close ${styles.closeIcon}`}
                    >
                      <CloseOutlined />
                    </div>
                    <Avatar src={v.account.avatar} />
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
            switch (imageAccountList[0].account.type) {
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
ParamsSettingItem.displayName = 'ParamsSettingItem';

export default ParamsSettingItem;
