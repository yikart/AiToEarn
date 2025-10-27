/*
 * @Author: nevin
 * @Date: 2025-03-23 14:53:37
 * @LastEditTime: 2025-03-23 18:23:23
 * @LastEditors: nevin
 * @Description: 通知的全局组件
 */
//
import { SendChannelEnum } from '@@/UtilsEnum';
import { notification } from 'antd';
import React, { FC, useEffect } from 'react';

interface InformProps {
  onChooseItem: () => void;
}
const Inform: FC<InformProps> = ({}) => {
  const e = window.ipcRenderer.on(SendChannelEnum.AutoRun, (e, args) => {
    console.log('--------- e', e);
    console.log('--------- args', args);

    notification.open({
      message: '自动化任务',
      description:
        'This is the content of the notification. This is the content of the notification. This is the content of the notification.',
      onClick: () => {
        console.log('Notification Clicked!');
      },
    });
  });

  useEffect(() => {}, []);

  function onChooseItem() {
    console.log('onChooseItem');
  }
  return <></>;
};
export default Inform;
