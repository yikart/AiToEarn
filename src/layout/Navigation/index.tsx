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

const Navigation = () => {
  const location = useLocation();
  const [pathname, setPathname] = useState('/');

  useEffect(() => {
    setPathname('/' + (location.pathname.split('/')[1] || ''));
  }, [location]);

  return (
    <nav className={styles.navigation}>
      <div className="navigation_left">
        <div className="navigation-logo">
          <img src={logo} alt="爱团团AiToEarn" className="w-9 h-9" />
          <span>爱团团AiToEarn</span>
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

      <div className="navigation-userinfo">
        <SysMenu />
      </div>
    </nav>
  );
};

export default Navigation;
