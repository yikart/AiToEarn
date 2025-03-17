import {
  DownOutlined,
  InfoCircleOutlined,
  CloudSyncOutlined,
  LogoutOutlined,
  UserOutlined,
  PhoneOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Dropdown, Avatar } from 'antd';
import React, { useEffect, useState } from 'react';
import Update from '@/components/update';
import { useUserStore } from '@/store/user';
import { ipcAppInfo } from '@/icp/app';

const App: React.FC = () => {
  const [appInfo, setAppInfo] = useState<{ version: string }>({
    version: '',
  });
  const userStore = useUserStore();

  async function getAppInfo() {
    const res = await ipcAppInfo();
    setAppInfo(res);
  }

  useEffect(() => {
    getAppInfo();
  }, []);

  const items: MenuProps['items'] = [
    {
      key: 'userInfo',
      label: (
        <div className="px-2 py-2">
          <div className="flex items-center space-x-2 mb-2">
            <UserOutlined className="text-[#a66ae4]" />
            <span className="text-gray-600">用户名：</span>
            <span className="text-gray-900 font-medium">
              {userStore.userInfo?.name || '-'}
            </span>
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <IdcardOutlined className="text-[#a66ae4]" />
            <span className="text-gray-600">ID：</span>
            <span className="text-gray-900 font-medium">
              {userStore.userInfo?.id || '-'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <PhoneOutlined className="text-[#a66ae4]" />
            <span className="text-gray-600">手机：</span>
            <span className="text-gray-900 font-medium">
              {userStore.userInfo?.phone || '-'}
            </span>
          </div>
        </div>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: '0',
      label: (
        <div className="px-2 py-1 text-center">
          <p className="text-gray-600 mb-0">当前版本 {appInfo.version}</p>
        </div>
      ),
      icon: <InfoCircleOutlined className="text-[#a66ae4]" />,
    },
    {
      type: 'divider',
    },
    {
      key: '1',
      label: <Update />,
      icon: <CloudSyncOutlined className="text-[#a66ae4]" />,
    },
    {
      type: 'divider',
    },
    {
      key: '2',
      label: (
        <Button
          type="text"
          danger
          className="w-full text-left pl-0"
          onClick={() => {
            userStore.logout();
          }}
        >
          {'   '}退出登录
        </Button>
      ),
      icon: <LogoutOutlined className="text-red-500" />,
    },
  ];

  return (
    <Dropdown
      menu={{ items }}
      trigger={['hover']}
      placement="bottomRight"
      overlayClassName="min-w-[240px]"
      overlayStyle={{ marginTop: '8px' }}
    >
      <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-3 py-1.5 rounded-full transition-all duration-300 group">
        <Avatar
          size="small"
          icon={<UserOutlined />}
          className="bg-[#a66ae4] group-hover:shadow-sm transition-all duration-300"
        />
        <span className="text-gray-600 text-sm">
          {userStore.userInfo?.name || '未登录'}
        </span>
        <DownOutlined className="text-gray-400 text-xs transition-transform duration-300 group-hover:rotate-180" />
      </div>
    </Dropdown>
  );
};

export default App;
