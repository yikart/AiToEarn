import { Menu, MenuProps } from 'antd';
import styles from './aiTool.module.scss';
import Ranking from '@/assets/svgs/aiTool/ranking.svg?react';
import AiDraw from '@/assets/svgs/aiTool/aiDraw.svg?react';
// import DigitalHuman from '@/assets/svgs/aiTool/digitalHuman.svg?react';
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
    key: '/aiTool/chatAiDraw',
    label: 'Chat Ai绘图',
    icon: <Icon component={AiDraw} />,
  },
  // {
  //   key: '/aiTool/digitalHuman',
  //   label: '数字人制作',
  //   icon: <Icon component={DigitalHuman} />,
  // },
];

export default function Page() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currChooseRoute, setCurrChooseRoute] = useState<string>();

  useEffect(() => {
    setCurrChooseRoute(location.pathname);
  }, [location]);

  return (
    <div className={styles.aiTool}>
      <Menu
        selectedKeys={[currChooseRoute || '']}
        style={{ width: 160 }}
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
