/*
 * @Author: nevin
 * @Date: 2025-01-17 20:05:00
 * @LastEditTime: 2025-02-25 19:25:33
 * @LastEditors: nevin
 * @Description: 登录页
 */
import styles from './login.module.scss';
import { LoginCore } from '@/views/login/components/LoginCore';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/user';
import platformSvg from './svgs/icon-platform.svg';
import accountSvg from './svgs/icon-account.svg';
import mediaSvg from './svgs/icon-media.svg';
import logo from '@/assets/logo.png';
import Windowcontrolbuttons from '../../components/WindowControlButtons/WindowControlButtons';

const Login = () => {
  const features = [
    {
      title: '一键分发多个自媒体平台',
      description: '支持图文、视频、动态一键发送至多个平台',
      icon: platformSvg,
    },
    {
      title: '1000+账号，多账号同步管理',
      description:
        '轻松管理1000+自媒体账号，分组管理，内容自动提醒，一键检测状态',
      icon: accountSvg,
    },
    {
      title: '媒体多开，实现一站式平台内操作',
      description: '无需手动切换登录账号，一站式完成平台内操作',
      icon: mediaSvg,
    },
  ];
  const navigate = useNavigate();
  const userStore = useUserStore();

  useEffect(() => {
    if (userStore.token) {
      navigate('/');
    }
  }, []);

  return (
    <div className={`${styles.login}`}>
      <div className="login-navbar">
        <div className="login-navbar-darg" />
        <Windowcontrolbuttons />
      </div>

      <div className={`${styles.login_wrap} ${styles.login_left}`}>
        <div className={styles.login_left_top}>
          <img src={logo} alt="logo" width={80} />
        </div>
        <ul className={styles.login_left_texts}>
          {features.map((v) => {
            return (
              <li key={v.title}>
                <div className={styles.login_left_texts_svg}>
                  <img src={v.icon} alt="icon" />
                </div>
                <div className={styles.login_left_text}>
                  <strong>{v.title}</strong>
                  <p>{v.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className={styles.login_wrap}>
        <LoginCore />
      </div>
    </div>
  );
};

export default Login;
