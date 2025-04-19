import { Menu, MenuProps } from 'antd';
import styles from './aiTool.module.scss';
import Ranking from '@/assets/svgs/aiTool/ranking.svg?react';
import AiDraw from '@/assets/svgs/aiTool/aiDraw.svg?react';
import DigitalHuman from '@/assets/svgs/aiTool/digitalHuman.svg?react';
import VideoParse from '@/assets/svgs/aiTool/videoParse.svg?react';
import Icon from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

type MenuItem = Required<MenuProps>['items'][number];

const items: MenuItem[] = [
  {
    key: '/aiTool/aiRanking',
    label: 'AI工具排行榜',
    icon: <Icon component={Ranking} />,
  },
  {
    key: `/aiTool/aiToolWebview?webviewUrl=${encodeURIComponent('https://www.yikart.cn/chat?isHideNav=true&mask=100005#new-chat?mask=100005')}`,
    label: '吉卜力版GPT-4o',
    icon: <Icon component={AiDraw} />,
  },
  {
    key: '/aiTool/aiToolWebview?webviewUrl=http://39.100.101.239:6006',
    label: 'MuseTalk',
    icon: <Icon component={DigitalHuman} />,
  },
  {
    key: '/aiTool/aiToolWebview?webviewUrl=http://39.100.101.239:5043',
    label: '在线短视频解析',
    icon: <Icon component={VideoParse} />,
  },
];

export default function Page() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currChooseRoute, setCurrChooseRoute] = useState<string>();

  useEffect(() => {
    console.log(location);
    setCurrChooseRoute(location.pathname + location.search + location.hash);
  }, [location]);

  return (
    <div className={styles.aiTool}>
      <Menu
        selectedKeys={[currChooseRoute || '']}
        style={{ width: 180 }}
        inlineIndent={15}
        mode="inline"
        items={items}
        onClick={(e) => {
          navigate(e.key);
        }}
      />
      <Outlet />
    </div>
  );
}
