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

export default function TermsOfServicePage() {
  const { t } = useTransClient('common');
  
  return (
    <div className={styles.websitPage}>
      <Header />
      
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>
              {t('websit.termsOfService.title')}
            </h1>
            <p className={styles.lastUpdated}>
              {t('websit.termsOfService.lastUpdated')}: 2024-12-26
            </p>
          </div>
          
          <div className={styles.content}>
            <section className={styles.section}>
              <p className={styles.introduction}>
                {t('websit.termsOfService.content.introduction')}
              </p>
            </section>
            
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                {t('websit.termsOfService.content.acceptance')}
              </h2>
              <p className={styles.sectionContent}>
                {t('websit.termsOfService.content.acceptanceContent')}
              </p>
            </section>
            
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                {t('websit.termsOfService.content.serviceDescription')}
              </h2>
              <p className={styles.sectionContent}>
                {t('websit.termsOfService.content.serviceDescriptionContent')}
              </p>
            </section>
            
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                {t('websit.termsOfService.content.userResponsibilities')}
              </h2>
              <p className={styles.sectionContent}>
                {t('websit.termsOfService.content.userResponsibilitiesContent')}
              </p>
            </section>
            
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                {t('websit.termsOfService.content.privacy')}
              </h2>
              <p className={styles.sectionContent}>
                {t('websit.termsOfService.content.privacyContent')}
              </p>
            </section>
            
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                {t('websit.termsOfService.content.termination')}
              </h2>
              <p className={styles.sectionContent}>
                {t('websit.termsOfService.content.terminationContent')}
              </p>
            </section>
            
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                {t('websit.termsOfService.content.contact')}
              </h2>
              <p className={styles.sectionContent}>
                {t('websit.termsOfService.content.contactContent')}
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
} 