/*
 * @Author: nevin
 * @Date: 2025-01-17 20:13:54
 * @LastEditTime: 2025-01-21 16:22:55
 * @LastEditors: nevin
 * @Description:
 */
import { Link, useLocation } from 'react-router-dom';
import logo from '@/assets/logo.png';
import styles from './navigation.module.scss';
import { router } from '@/router';
import SysMenu from '../SysMenu';
import { useEffect, useState, useRef } from 'react';
import { ipcAppInfo } from '../../icp/app';
import Windowcontrolbuttons from '../../components/WindowControlButtons/WindowControlButtons';
import Bellmessage from '../BellMessage';
import { BellOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import SignInCard from '@/components/SignInCard';
import treeSvg from '@/assets/svgs/tree.svg';

const Navigation = () => {
  const location = useLocation();
  const [pathname, setPathname] = useState('/');
  const [platform, setPlatform] = useState('');

  const signInCardRef = useRef<any>(null);

  useEffect(() => {
    setPathname('/' + (location.pathname.split('/')[1] || ''));
  }, [location]);

  useEffect(() => {
    ipcAppInfo().then((res) => {
      setPlatform(res.platform);
    });
  }, []);

  return (
    <nav className={`${styles.navigation} ${styles['navigation-' + platform]}`}>
      <div className="navigation_left">
        <div className="navigation-logo">
          <img src={logo} alt="哎哟赚AiToEarn" className="w-9 h-9" />
          <span>哎哟赚AiToEarn</span>
        </div>

        <ul className="navigation-list">
          {router[0].children &&
            router[0].children.map((v) => {
              if (!v.meta) return;
              const IconComponent = v.meta!.icon!;
              return (
                <li
                  className={[
                    'navigation-list-item',
                    pathname === v.path && 'navigation-list-item--active',
                  ].join(' ')}
                  key={v.meta!.name}
                >
                  <Link to={v.path || '/'}>
                    <IconComponent />
                    <span className="navigation-list-text">{v.meta!.name}</span>
                  </Link>
                </li>
              );
            })}
        </ul>
      </div>

      <div className="navigation_drag" />

      <div className="navigation-userinfo">
        {/* 免登录状态显示 */}
        <div className="navigation-icon" style={{ color: '#52c41a' }}>
          <span className="navigation-icon-text">✓ 已免登录</span>
        </div>
        <div className="navigation-line"></div>

        <Popover
          content={<SignInCard ref={signInCardRef} />}
          trigger="hover"
          placement="bottom"
          onOpenChange={(open) => {
            if (open) {
              signInCardRef.current?.fetchSignInList();
            }
          }}
        >
          <div className="navigation-icon">
            <img
              src={treeSvg}
              alt="小树苗"
              style={{ width: 20, height: 20, verticalAlign: 'middle' }}
            />
            <span className="navigation-icon-text">小树苗</span>
          </div>
        </Popover>
        <div className="navigation-line"></div>

        <Bellmessage>
          <div className="navigation-icon">
            <BellOutlined />
            <span className="navigation-icon-text">消息</span>
          </div>
        </Bellmessage>

        <div className="navigation-line"></div>
        <SysMenu />
        <div className="navigation-line"></div>
      </div>

      <Windowcontrolbuttons />
    </nav>
  );
};

export default Navigation;
