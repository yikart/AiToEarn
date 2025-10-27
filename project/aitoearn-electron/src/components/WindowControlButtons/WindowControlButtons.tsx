import { ForwardedRef, forwardRef, memo, useEffect, useState } from 'react';
import styles from './windowControlButtons.module.scss';
import {
  BorderOutlined,
  CloseOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import { ipcAppInfo } from '../../icp/app';

export interface IWindowcontrolbuttonsRef {}

export interface IWindowcontrolbuttonsProps {}

const Windowcontrolbuttons = memo(
  forwardRef(
    (
      {}: IWindowcontrolbuttonsProps,
      ref: ForwardedRef<IWindowcontrolbuttonsRef>,
    ) => {
      const [platform, setPlatform] = useState('');

      useEffect(() => {
        ipcAppInfo().then((res) => {
          setPlatform(res.platform);
        });
      }, []);

      if (platform !== 'win32') return;

      return (
        <div className={styles.windowControlButtons}>
          <div
            className={styles.minimize}
            onClick={() => {
              window.ipcRenderer.invoke('window-minimize');
            }}
          >
            <MinusOutlined />
          </div>
          <div
            className={styles.maximize}
            onClick={() => {
              window.ipcRenderer.invoke('window-maximize');
            }}
          >
            <BorderOutlined />
          </div>
          <div
            className={styles.close}
            onClick={() => {
              window.ipcRenderer.invoke('window-close');
            }}
          >
            <CloseOutlined />
          </div>
        </div>
      );
    },
  ),
);
Windowcontrolbuttons.displayName = 'Windowcontrolbuttons';

export default Windowcontrolbuttons;
