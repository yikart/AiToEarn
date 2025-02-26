/*
 * @Author: nevin
 * @Date: 2025-01-17 20:13:54
 * @LastEditTime: 2025-01-21 16:22:55
 * @LastEditors: nevin
 * @Description:
 */
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png'; // 请确保这个路径指向您的 logo 图片
import styles from './navigation.module.scss';
import { router } from '@/router';
import SysMenu from '../SysMenu';

const Navigation = () => {
  return (
    <nav className={`flex-none text-white shadow-md ${styles.navigation}`}>
      <div className="flex items-center h-16" style={{ padding: '0 2.5rem' }}>
        <div className="flex items-center mr-12 space-x-3">
          <img src={logo} alt="爱团团AiToEarn" className="w-9 h-9" />
          <span className="text-xl font-semibold tracking-wide text-white">
            爱团团AiToEarn
          </span>
        </div>

        <ul className="flex items-center h-full space-x-2">
          {router[0].children &&
            router[0].children.map((v) => {
              if (!v.meta) return;
              const IconComponent = v.meta!.icon!;
              return (
                <li className="h-full" key={v.meta!.name}>
                  <Link
                    to={v.path || '/'}
                    className="flex items-center px-6 h-full hover:bg-white/10 transition-colors text-[15px]"
                  >
                    <IconComponent className="mr-2 text-lg text-white" />
                    <span className="text-white">{v.meta!.name}</span>
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
