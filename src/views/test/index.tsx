/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-02-26 21:50:26
 * @LastEditors: nevin
 * @Description: 测试页面
 */
import styles from './publish.module.scss';
import { VideoCameraOutlined } from '@ant-design/icons';
import { Segmented } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';

export default function Page() {
  const navigate = useNavigate();

  return (
    <div className={styles.publish}>
      <Segmented
        vertical
        size="large"
        options={[
          { label: '抖音2', value: 'douyin2', icon: <VideoCameraOutlined /> },
          { label: '抖音', value: 'douyin', icon: <VideoCameraOutlined /> },
          {
            label: '小红书',
            value: 'xiaohongshu',
            icon: <VideoCameraOutlined />,
          },
          {
            label: '视频号',
            value: 'shipinhao',
            icon: <VideoCameraOutlined />,
          },
          { label: '视频测试', value: 'video', icon: <VideoCameraOutlined /> },
          { label: '任务测试', value: 'video', icon: <VideoCameraOutlined /> },
          {
            label: '热门事件',
            value: 'hotTopic',
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
