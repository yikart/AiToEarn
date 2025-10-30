import { Menu, MenuProps } from 'antd';
import styles from './aiTool.module.scss';
import Ranking from '@/assets/svgs/aiTool/ranking.svg?react';
import AiDraw from '@/assets/svgs/aiTool/aiDraw.svg?react';
import FaceFusion from '@/assets/svgs/aiTool/faceFusion.svg?react';
import DigitalHuman from '@/assets/svgs/aiTool/digitalHuman.svg?react';
import VideoParse from '@/assets/svgs/aiTool/videoParse.svg?react';
import CosyVoice from '@/assets/svgs/aiTool/cosyVoice.svg?react';
import NarratoAI from '@/assets/svgs/aiTool/narratoAI.svg?react';
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
    label: '数字人制作 MuseTalk',
    icon: <Icon component={DigitalHuman} />,
  },
  {
    key: '/aiTool/aiToolWebview?webviewUrl=http://39.100.101.239:5043',
    label: '在线短视频解析',
    icon: <Icon component={VideoParse} />,
  },
  {
    key: '/aiTool/aiToolWebview?webviewUrl=http://39.100.101.239:5042',
    label: 'AI换脸 FaceFusion',
    icon: <Icon component={FaceFusion} />,
  },
  {
    key: '/aiTool/aiToolWebview?webviewUrl=http://39.100.101.239:5046',
    label: '声音克隆CosyVoice',
    icon: <Icon component={CosyVoice} />,
  },
  {
    key: '/aiTool/aiToolWebview?webviewUrl=http://39.100.101.239:6007',
    label: 'AI解说NarratoAI',
    icon: <Icon component={NarratoAI} />,
  },
  {
    key: '/aiTool/aiToolWebview?webviewUrl=http://39.100.101.239:6008',
    label: '一键成片MoneyPrinterTurbo',
    icon: <Icon component={NarratoAI} />,
  },
].map((v) => {
  // @ts-ignore
  v.label = <span title={v.label}>{v.label}</span>;
  return v;
});

export default function Page() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currChooseRoute, setCurrChooseRoute] = useState<string>();

  useEffect(() => {
    setCurrChooseRoute(location.pathname + location.search + location.hash);
  }, [location]);

  return (
    <div className={styles.aiTool}>
      <Menu
        selectedKeys={[currChooseRoute || '']}
        style={{ width: 200 }}
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
