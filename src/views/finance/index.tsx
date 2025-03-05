/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-02-28 21:42:15
 * @LastEditors: nevin
 * @Description: 任务页面
 */
import { VideoCameraOutlined } from '@ant-design/icons';
import { Segmented } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import styles from './finance.module.scss';

export default function Page() {
  const navigate = useNavigate();

  return (
    <div className={styles.publish}>
      <Segmented
        vertical
        size="large"
        options={[
          {
            label: '提现记录',
            value: 'userWalletRecord',
            icon: <VideoCameraOutlined />,
          },
          {
            label: '钱包账户',
            value: 'userWalletAccount',
            icon: <VideoCameraOutlined />,
          },
        ]}
        onChange={(value) => {
          navigate(value);
        }}
      />
      <Outlet />
    </div>
  );
}
