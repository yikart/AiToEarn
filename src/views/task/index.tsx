/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-02-28 21:36:53
 * @LastEditors: nevin
 * @Description: 任务页面
 */
import { VideoCameraOutlined } from '@ant-design/icons';
import { Segmented } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import styles from './task.module.scss';

export default function Page() {
  const navigate = useNavigate();

  return (
    <div className={styles.publish}>
      <Segmented
        vertical
        size="large"
        options={[
          { label: '挂车任务', value: 'car', icon: <VideoCameraOutlined /> },
          { label: '推广任务', value: 'pop', icon: <VideoCameraOutlined /> },
          { label: '视频任务', value: 'video', icon: <VideoCameraOutlined /> },
          { label: '已参与任务', value: 'mine', icon: <VideoCameraOutlined /> },
        ]}
        onChange={(value) => {
          navigate(value);
        }}
      />
      <Outlet />
    </div>
  );
}
