import { useEffect, useState } from 'react';
import { signInApi, SignInType } from '@/api/signIn';
import { Button, Progress, message } from 'antd';
import { CheckCircleFilled, ClockCircleOutlined } from '@ant-design/icons';
import styles from './SignInCard.module.scss';
import treeSvg from '@/assets/svgs/tree.svg';

export default function SignInCard() {
  const [loading, setLoading] = useState(false);
  const [signInList, setSignInList] = useState<any[]>([]);
  const [thisWeekSigned, setThisWeekSigned] = useState(false);
  const [continueWeeks, setContinueWeeks] = useState(0);

  // 获取打卡列表
  const fetchSignInList = async () => {
    setLoading(true);
    try {
      const res = await signInApi.getSignInList({ type: SignInType.PUL_VIDEO });
      const list = res?.items || [];
      console.log('dak',list)
      setSignInList(list);

      // 计算本周是否已打卡和连续周数
      const now = new Date();
      const getWeek = (date: Date) => {
        const firstDay = new Date(date.getFullYear(), 0, 1);
        const dayOfYear = Math.floor((date.getTime() - firstDay.getTime()) / 86400000) + 1;
        return Math.ceil(dayOfYear / 7);
      };
      const thisYear = now.getFullYear();
      const thisWeek = getWeek(now);

      let signed = false;
      let maxContinue = 0;
      let curContinue = 0;
      let lastYear = thisYear, lastWeek = thisWeek;

      for (const item of list) {
        const d = new Date(item.createTime);
        const y = d.getFullYear();
        const w = getWeek(d);
        if (y === thisYear && w === thisWeek) signed = true;
        if ((y === lastYear && w === lastWeek) || (y === lastYear && w === lastWeek - 1) || (y === lastYear - 1 && lastWeek === 1 && w === 52)) {
          curContinue++;
          lastYear = y;
          lastWeek = w - 1;
        } else {
          break;
        }
      }
      maxContinue = curContinue;
      setThisWeekSigned(signed);
      setContinueWeeks(maxContinue);
    } catch (e) {
      message.error('获取打卡信息失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSignInList();
  }, []);

  // 打卡
  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInApi.createSignInRecord();
      message.success('打卡成功！');
      fetchSignInList();
    } catch {
      message.error('打卡失败');
    }
    setLoading(false);
  };

  const totalWeeks = 7;
  const diff = totalWeeks - continueWeeks;

  return (
    <div className={styles.signInCard}>
      <div className={styles.icon}>
        <img 
          src={treeSvg} 
          alt="tree" 
          style={{
            width: 48, 
            filter: thisWeekSigned ? 'none' : 'grayscale(100%)',
            opacity: thisWeekSigned ? 1 : 0.6
          }} 
        />
      </div>
      <div className={styles.title}>每周使用一键发布视频即可为小树苗浇水</div>
      <div className={styles.status}>
        {thisWeekSigned ? (
          <div className={styles.signed}>
            <CheckCircleFilled style={{ color: '#52c41a', marginRight: 4 }} /> 本周已完成浇水
          </div>
        ) : (
          <div className={styles.notSigned}>
            <ClockCircleOutlined style={{ color: '#aaa', marginRight: 4 }} /> 本周待浇水
            <div style={{ color: 'red', marginTop: 4, fontSize: 13 }}>如果未浇水，小树苗就会枯死</div>
          </div>
        )}
      </div>
      <div className={styles.progress}>
        <span>连续浇水进度</span>
        <span style={{ float: 'right' }}>{continueWeeks}/{totalWeeks}周</span>
        <Progress percent={Math.round((continueWeeks / totalWeeks) * 100)} showInfo={false} style={{ margin: '4px 0' }} />
      </div>
      <div className={styles.desc}>
        你已连续浇水 <b>{continueWeeks}</b> 周<br />
        距离获得「快速提现」权益，仅差 <b>{diff}</b> 周
      </div>
      <Button
        type="primary"
        block
        disabled={thisWeekSigned}
        loading={loading}
        onClick={handleSignIn}
        style={{ marginTop: 16 }}
      >
        立即发布视频
      </Button>
    </div>
  );
} 