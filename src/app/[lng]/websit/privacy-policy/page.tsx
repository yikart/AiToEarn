"use client";

import { useTransClient } from "@/app/i18n/client";
import styles from "../websit.module.scss";

// 导入首页的Header组件
function Header() {
  const { t } = useTransClient('home');
  
  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <div className={styles.logo}>
          <span className={styles.logoText}>{t('header.logo')}</span>
        </div>
        <nav className={styles.nav}>
          <a href="#marketplace" className={styles.navLink}>{t('header.nav.marketplace')}</a>
          <a href="#pricing" className={styles.navLink}>{t('header.nav.pricing')}</a>
          <a href="#docs" className={styles.navLink}>{t('header.nav.docs')}</a>
          <a href="#blog" className={styles.navLink}>{t('header.nav.blog')}</a>
        </nav>
        <button className={styles.getStartedBtn}>{t('header.getStarted')}</button>
      </div>
    </header>
  );
}

export default function PrivacyPolicyPage() {
  const { t } = useTransClient('common');
  
  return (
    <div className={styles.websitPage}>
      <Header />
      
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>
              隐私政策
            </h1>
            <p className={styles.lastUpdated}>
              最后更新时间: 2024-12-26
            </p>
          </div>
          
          <div className={styles.content}>
            <section className={styles.section}>
              <p className={styles.introduction}>
                本隐私政策说明我们如何收集、使用和保护您的个人信息。
              </p>
            </section>
            
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>1. 信息收集</h2>
              <p className={styles.sectionContent}>
                我们收集您主动提供的信息以及您使用服务时自动收集的信息。
              </p>
            </section>
            
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>2. 信息使用</h2>
              <p className={styles.sectionContent}>
                我们使用收集的信息来提供、维护和改进我们的服务。
              </p>
            </section>
            
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>3. 信息共享</h2>
              <p className={styles.sectionContent}>
                我们不会向第三方出售、交易或转让您的个人信息。
              </p>
            </section>
            
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>4. 数据安全</h2>
              <p className={styles.sectionContent}>
                我们采用适当的安全措施来保护您的个人信息。
              </p>
            </section>
            
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>5. 用户权利</h2>
              <p className={styles.sectionContent}>
                您有权访问、更正或删除您的个人信息。
              </p>
            </section>
            
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>6. 联系我们</h2>
              <div className={styles.contactInfo}>
                <h3 className={styles.contactTitle}>隐私相关问题</h3>
                <p className={styles.contactText}>
                  如有隐私相关问题，请联系我们：privacy@example.com
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
} 