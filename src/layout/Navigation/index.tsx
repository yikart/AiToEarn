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
import { useEffect, useState } from 'react';
import { ipcAppInfo } from '../../icp/app';
import Windowcontrolbuttons from '../../components/WindowControlButtons/WindowControlButtons';

const Navigation = () => {
  const location = useLocation();
  const [pathname, setPathname] = useState('/');
  const [platform, setPlatform] = useState('');

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
        <div className="navigation-line" style={{ marginRight: '10px' }}></div>
        <SysMenu />
        <div className="navigation-line" style={{ marginLeft: '10px' }}></div>
      </div>

      <Windowcontrolbuttons />
    </nav>
  );
};

export default Navigation;
