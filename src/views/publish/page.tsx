/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-02-22 00:10:04
 * @LastEditors: nevin
 * @Description:
 */
import styles from './publish.module.scss';
import {
  VideoCameraOutlined,
  FileImageOutlined,
  ContainerOutlined,
} from '@ant-design/icons';
import { message, Segmented } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ipcAppInfo } from '@/icp/app';

export default function Page() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currChooseRoute, setCurrChooseRoute] = useState<string>();

  useEffect(() => {
    setCurrChooseRoute(location.pathname);
    getAppInfo();
  }, [location]);

  async function getAppInfo() {
    const appInfo = await ipcAppInfo();

    if (appInfo.chromiumPath) return;

    message.loading('检测到您没有配置chrome浏览器,请指定', 2).then(async () => {
      const res: string = await window.ipcRenderer.invoke(
        'ICP_SET_CHROMIUM_PATH',
      );

      if (res) {
        message.success('设置成功');
      } else {
        message.error('设置失败');
      }
    });
  }

  return (
    <div className={styles.publish}>
      <Segmented
        value={currChooseRoute}
        vertical
        size="large"
        options={[
          {
            label: '视频发布',
            value: '/publish/video',
            icon: <VideoCameraOutlined />,
          },
          // { label: '文章发布', value: '/publish/text', icon: <FileOutlined /> },
          {
            label: '图片发布',
            value: '/publish/image',
            icon: <FileImageOutlined />,
          },
          {
            label: '发布记录',
            value: '/publish/pubRecord',
            icon: <ContainerOutlined />,
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
