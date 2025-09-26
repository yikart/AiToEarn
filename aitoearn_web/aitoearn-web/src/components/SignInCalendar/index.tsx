"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button, Modal, Calendar, Badge, message } from 'antd';
import { CalendarOutlined, CheckOutlined } from '@ant-design/icons';
import { useTransClient } from '@/app/i18n/client';
import { signInApi, SignInType, SignInResponse, PublishDayInfoResponse, PublishInfoResponse } from '@/api/signIn';
import { useUserStore } from '@/store/user';
import { useRouter } from 'next/navigation';
import styles from './SignInCalendar.module.scss'; 

interface SignInCalendarProps {
  className?: string;
}

interface CalendarData {
  signedDates: string[]; // 已签到的日期数组，格式: "YYYY-MM-DD"
  todaySigned: boolean; // 今天是否已签到
  consecutiveDays: number; // 连续签到天数
}

const SignInCalendar: React.FC<SignInCalendarProps> = ({ className }) => {
  const { t } = useTransClient('common');
  const userStore = useUserStore();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calendarData, setCalendarData] = useState<CalendarData>({
    signedDates: [],
    todaySigned: false,
    consecutiveDays: 0
  });
  const [currentDate, setCurrentDate] = useState(new Date());

  // 获取当前年月
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // 获取日历数据
  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      
      // 并行获取日历数据和连续签到天数
      const [calendarResponse, consecutiveResponse] = await Promise.all([
        signInApi.getSignInCalendar(currentYear, currentMonth),
        signInApi.getConsecutiveDays()
      ]);
      
      // 处理日历数据，将 createdAt 转换为签到日期
      const signedDates: string[] = [];
      let todaySigned = false;
      let consecutiveDays = 0;
      
      if (calendarResponse.list && calendarResponse.list.length > 0) {
        // 提取所有签到日期
        calendarResponse.list.forEach(item => {
          const date = new Date(item.createdAt);
          const dateStr = date.toISOString().split('T')[0]; // 格式: YYYY-MM-DD
          signedDates.push(dateStr);
          
          // 检查今天是否已签到
          const today = new Date().toISOString().split('T')[0];
          if (dateStr === today) {
            todaySigned = true;
          }
        });
      }
      
      // 从连续签到接口获取连续签到天数
      if (consecutiveResponse && consecutiveResponse.data) {
        consecutiveDays = consecutiveResponse.data.days || 0;
      }
      
      setCalendarData({
        signedDates,
        todaySigned,
        consecutiveDays
      });
    } catch (error) {
      console.error('获取签到日历数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 签到
  const handleSignIn = async () => {
    // if (calendarData.todaySigned) {
    //   message.warning(t('signIn.alreadySignedIn'));
    //   return;
    // }

    // 关闭当前弹窗
    setVisible(false);
    
    // 跳转到 accounts 页面并传递参数表示需要打开发布弹窗
    const currentPath = window.location.pathname;
    if (currentPath === '/accounts' || currentPath.startsWith('/accounts/')) {
      // 如果已经在 accounts 页面，触发打开发布弹窗的事件
      window.dispatchEvent(new CustomEvent('openPublishDialog', {
        detail: { fromSignIn: true }
      }));
    } else {
      // 如果不在 accounts 页面，使用路由跳转并传递参数
      router.push('/accounts?openPublish=true&fromSignIn=true');
    }
  };

  // 日历日期渲染
  const dateCellRender = (value: any) => {
    const dateStr = value.format('YYYY-MM-DD');
    const isSigned = calendarData.signedDates.includes(dateStr);
    const isToday = value.isSame(new Date(), 'day');
    
    return (
      <div className={styles.calendarCell}>
        <div className={styles.dateContainer}>
          <span style={{ minHeight: '6px' }} className={`${styles.dateText} ${isToday ? styles.today : ''}`}>
            {isToday ? t('signIn.today') : ''}
          </span>
          <div className={`${styles.signInStatus} ${isSigned ? styles.signed : styles.notSigned}`}>
            {isSigned ? (
              <div className={styles.signedCircle} />
            ) : (
              <div className={styles.emptyCircle} />
            )}
          </div>
        </div>
      </div>
    );
  };

  // 月份变化处理
  const onPanelChange = (value: any) => {
    setCurrentDate(value.toDate());
  };

  // 监听月份变化，重新获取数据
  useEffect(() => {
    if (visible) {
      fetchCalendarData();
    }
  }, [currentYear, currentMonth, visible]);

  return (
    <>
      <Button
        type="text"
        icon={<CalendarOutlined />}
        onClick={() => setVisible(true)}
        className={`${styles.signInButton} ${className || ''}`}
        title={t('signIn.title')}
      />
      
      <Modal
        title={
          <div className={styles.modalHeader}>
            <span>{t('signIn.title')}</span>
            <Button 
              type="link" 
              className={styles.pointsLink}
              onClick={() => {
                // 跳转到个人中心页面
                window.open('/profile', '_blank');
              }}
            >
              {t('signIn.myPoints')} &gt;
            </Button>
          </div>
        }
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={600}
        className={styles.signInModal}
      >
        <div className={styles.calendarContainer}>
          <Calendar
            fullscreen={false}
            dateCellRender={dateCellRender}
            onPanelChange={onPanelChange}
            headerRender={({ value, onChange }) => {
              const year = value.year();
              const month = value.month() + 1;
              return (
                <div className={styles.calendarHeader}>
                  <span>{year} / {month.toString().padStart(2, '0')}</span>
                </div>
              );
            }}
          />
          
          <div className={styles.signInRules}>
            <h4>{t('signIn.rules')}:</h4>
            <ul>
              <li>{t('signIn.rules1')}</li>
              <li>{t('signIn.rules2')}</li>
              <li>{t('signIn.rules3')}</li>
            </ul>
          </div>
          
          <div className={styles.signInInfo}>
            <div className={styles.infoItem}>
              <span>{t('signIn.consecutiveDays')}: {calendarData.consecutiveDays}</span>
            </div>
            <div className={styles.infoItem}>
              <span>{t('signIn.totalPoints')}: {userStore.userInfo?.score || 0}</span>
            </div>
          </div>
          
          <Button
            type="primary"
            size="large"
            onClick={handleSignIn}
            // disabled={calendarData.todaySigned}
            className={styles.signInActionButton}
            block
          >
            {calendarData.todaySigned ? t('signIn.signedIn') : t('signIn.signIn')}
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default SignInCalendar;
