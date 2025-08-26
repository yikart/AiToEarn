"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button, Modal, Calendar, Badge, message } from 'antd';
import { CalendarOutlined, CheckOutlined } from '@ant-design/icons';
import { useTransClient } from '@/app/i18n/client';
import { signInApi, SignInType } from '@/api/signIn';
import styles from './SignInCalendar.module.scss';

interface SignInCalendarProps {
  className?: string;
}

interface CalendarData {
  signedDates: string[]; // 已签到的日期数组，格式: "YYYY-MM-DD"
  todaySigned: boolean; // 今天是否已签到
  consecutiveDays: number; // 连续签到天数
  totalPoints: number; // 总积分
}

const SignInCalendar: React.FC<SignInCalendarProps> = ({ className }) => {
  const { t } = useTransClient('common');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calendarData, setCalendarData] = useState<CalendarData>({
    signedDates: [],
    todaySigned: false,
    consecutiveDays: 0,
    totalPoints: 0
  });
  const [currentDate, setCurrentDate] = useState(new Date());

  // 获取当前年月
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // 获取日历数据
  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const data = await signInApi.getSignInCalendar(currentYear, currentMonth);
      setCalendarData(data);
    } catch (error) {
      console.error('获取签到日历数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 签到
  const handleSignIn = async () => {
    if (calendarData.todaySigned) {
      message.warning(t('signIn.alreadySignedIn'));
      return;
    }

    try {
      setLoading(true);
      await signInApi.createSignInRecord(SignInType.PUL_VIDEO);
      message.success(t('signIn.signInSuccess'));
      // 重新获取日历数据
      await fetchCalendarData();
    } catch (error) {
      console.error('签到失败:', error);
      message.error(t('signIn.signInFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 日历日期渲染
  const dateCellRender = (value: any) => {
    const dateStr = value.format('YYYY-MM-DD');
    const isSigned = calendarData.signedDates.includes(dateStr);
    const isToday = value.isSame(new Date(), 'day');
    
    return (
      <div className={styles.calendarCell}>
        {isSigned && (
          <Badge 
            count={<CheckOutlined style={{ color: '#52c41a', fontSize: '12px' }} />}
            className={styles.signInBadge}
          />
        )}
        <span className={`${styles.dateText} ${isToday ? styles.today : ''}`}>
          {isToday ? t('signIn.today') : value.date()}
        </span>
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
                // 跳转到积分页面
                window.open('/points', '_blank');
              }}
            >
              {t('signIn.myPoints')} &gt;
            </Button>
          </div>
        }
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={500}
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
              <span>{t('signIn.totalPoints')}: {calendarData.totalPoints}</span>
            </div>
          </div>
          
          <Button
            type="primary"
            size="large"
            onClick={handleSignIn}
            loading={loading}
            disabled={calendarData.todaySigned}
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
