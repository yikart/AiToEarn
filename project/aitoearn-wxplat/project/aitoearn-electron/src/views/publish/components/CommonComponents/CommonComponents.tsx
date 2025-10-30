import { Button, Radio, Select, SelectProps } from 'antd';
import styles from './commonComponents.module.scss';
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PlusOutlined, UserAddOutlined } from '@ant-design/icons';

import { AccountInfo } from '../../../account/comment';
import { AccountStatus } from '../../../../../commont/AccountEnum';
import { VisibleTypeEnum } from '../../../../../commont/publish/PublishEnum';
import { icpGetMixList } from '../../../../icp/publish';
import { accountFailureDispose } from '../../comment';
import { onAccountLoginFinish } from '../../../../icp/receiveMsg';
import { IMixItem } from '../../../../../electron/main/plat/plat.type';

// 本地上传、素材上传展示的块
export const ChooseChunk = ({
  onClick,
  imgUrl,
  color,
  text,
  hoverColor,
  style,
}: {
  onClick?: () => void;
  imgUrl: string;
  hoverColor?: string;
  color: string;
  text: string;
  style?: React.CSSProperties;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <div
        className={styles.chooseChunk}
        onClick={() => {
          if (onClick) onClick();
        }}
        style={
          isHovered
            ? {
                borderColor: hoverColor || color,
                ...(style || {}),
              }
            : style || {}
        }
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img src={imgUrl} />
        <Button type="primary" size="large" style={{ background: color }}>
          {text}
        </Button>
      </div>
    </>
  );
};

// 选择账户展示的块
export const ChooseAccountChunk = ({ onClick }: { onClick: () => void }) => {
  return (
    <div className={styles.chooseAccountChunk} onClick={onClick}>
      <UserAddOutlined className="chooseAccountChunk-user" />
      <Button icon={<PlusOutlined />} type="primary">
        选择发布账号
      </Button>
      <Outlet />
    </div>
  );
};

export interface PubPermissionProps {
  onChange?: (visibleType: VisibleTypeEnum) => void;
  value?: VisibleTypeEnum;
  title?: string;
  style?: React.CSSProperties;
}

// 权限设置
export const PubPermission = ({
  onChange,
  value,
  style,
  title = '权限设置',
}: PubPermissionProps) => {
  return (
    <>
      <h1>{title}</h1>
      <Radio.Group
        style={style}
        options={[
          {
            label: '公开（所有人可见）',
            value: VisibleTypeEnum.Public,
          },
          { label: '好友可见', value: VisibleTypeEnum.Friend },
          {
            label: '私密（仅自己可见）',
            value: VisibleTypeEnum.Private,
          },
        ]}
        onChange={(e) => {
          if (onChange) onChange(e.target.value);
        }}
        value={value}
      />
    </>
  );
};

// 账户重新登录
export const AccountRestartLogin = ({
  account,
  onAccountRestart,
}: {
  account?: AccountInfo;
  onAccountRestart: () => void;
}) => {
  return (
    <>
      {account?.status === AccountStatus.DISABLE && (
        <div className={styles.accountRestartLogin}>
          账户已失效，
          <Button
            type="link"
            onClick={() => {
              onAccountRestart();
            }}
          >
            重新登录
          </Button>
          后可获取
        </div>
      )}
    </>
  );
};

// 合集
export const CommonMixSelect = ({
  account,
  onAccountChange,
  children,
  ...props
}: {
  account?: AccountInfo;
  children?: React.ReactNode;
  onAccountChange?: (account: AccountInfo) => void;
} & SelectProps) => {
  if (!account || !onAccountChange) return '';

  const [options, setOptions] = useState<IMixItem[]>([]);

  const getList = async () => {
    const res = await icpGetMixList(account!);
    const data = await accountFailureDispose(res, account!, onAccountChange);
    setOptions(data);
  };

  useEffect(() => {
    getList();
    return onAccountLoginFinish((newAccount) => {
      account = newAccount;
      getList();
    });
  }, []);

  return (
    <>
      <h1>合集</h1>
      <Select
        options={options}
        allowClear
        style={{ width: '100%' }}
        placeholder="选择合集"
        fieldNames={{
          label: 'name',
          value: 'id',
        }}
        optionRender={({ data }) => {
          return (
            <div className={styles.mixSelectItem}>
              <div className="mixSelectItem-left">
                {data.coverImg && <img src={data.coverImg} />}
                {data.name}
              </div>
              <div className="mixSelectItem-right">
                共{data.feedCount}个作品
              </div>
            </div>
          );
        }}
        {...props}
      />
      {children}
    </>
  );
};
