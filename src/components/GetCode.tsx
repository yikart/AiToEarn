import styles from '@/views/login/login.module.scss';
import { useRef, useState } from 'react';
import { Statistic } from 'antd';
const { Countdown } = Statistic;

/**
 * 播放视频
 * 验证码倒计时触发组件
 * @param onGetCode
 */
function GetCode({ onGetCode }: { onGetCode: (unlock: () => void) => void }) {
  const [isCode, setIsCode] = useState(false);
  const currTime = useRef(0);

  const lockCode = () => {
    setIsCode(true);
    currTime.current = 60 * 1000;
  };

  return (
    <label
      className={
        styles['loginForm-getCode'] +
        ` ${isCode ? styles['loginForm-getCode--disable'] : ''}`
      }
      style={{ display: 'flex',justifyContent: 'center', alignItems: 'center' }}
      onClick={() => {
        if (isCode) return;
        lockCode();
        onGetCode(() => {
          setIsCode(false);
        });
      }}
    >
      获取验证码
      {isCode ? (
        <>
          （
          <Countdown
            style={{fontSize: '12px'}}
            format="ss"
            value={Date.now() + currTime.current}
            precision={1} 
            onFinish={() => {
              setIsCode(false);
            }}
            onChange={(e) => {
              if (typeof e === 'number') {
                currTime.current = e;
              }
            }}
          />
          s）
        </>
      ) : (
        ''
      )}
    </label>
  );
}

export default GetCode;
