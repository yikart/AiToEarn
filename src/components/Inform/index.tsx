/*
 * @Author: nevin
 * @Date: 2025-03-23 14:53:37
 * @LastEditTime: 2025-03-23 15:16:11
 * @LastEditors: nevin
 * @Description: 通知的全局组件
 */
//
import { SendChannelEnum } from '@@/UtilsEnum';
import React, { FC, useEffect } from 'react';

interface InformProps {
  onChooseItem: () => void;
}
const Inform: FC<InformProps> = ({}) => {
  useEffect(() => {
    const e = window.ipcRenderer.on(SendChannelEnum.AutoRunError, (e, args) => {
      // window.ipcRenderer.off('AutoRunError', e);
      console.log('---------');
      console.log('--------- e', e);
      console.log('--------- args', args);
    });
  }, []);

  function onChooseItem() {
    console.log('onChooseItem');
  }
  return <></>;
};
export default Inform;
