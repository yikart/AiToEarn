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

export default function DataDeletionPage() {
  const { t } = useTransClient('common');
  
  return (
    <div className={styles.websitPage}>
      <Header />
      
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>
              申请删除数据
            </h1>
            <p className={styles.lastUpdated}>
              最后更新时间: 2024-12-26
            </p>
          </div>
          
          <div className={styles.content}>
            <section className={styles.section}>
              <p className={styles.introduction}>
                如果您希望删除您的个人数据，请按照以下步骤操作
              </p>
            </section>
            
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>对于预发布用户：</h2>
              <p className={styles.sectionContent}>
                我们目前处于预发布阶段，如需删除数据，请直接联系我们的支持团队。
              </p>
            </section>
            
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>标准删除流程：</h2>
              <ul className={styles.stepsList}>
                <li className={styles.stepItem}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepText}>登录您的账户并进入设置页面</div>
                </li>
                <li className={styles.stepItem}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepText}>点击「数据管理」选项</div>
                </li>
                <li className={styles.stepItem}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepText}>选择「删除我的数据」</div>
                </li>
                <li className={styles.stepItem}>
                  <div className={styles.stepNumber}>4</div>
                  <div className={styles.stepText}>确认删除操作并等待处理完成</div>
                </li>
              </ul>
            </section>
            
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>联系方式：</h2>
              <div className={styles.contactInfo}>
                <h3 className={styles.contactTitle}>数据删除申请</h3>
                <p className={styles.contactText}>
                  如需帮助，请发送邮件至：datadeletion@example.com
                </p>
              </div>
            </section>
            
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>处理时间：</h2>
              <p className={styles.sectionContent}>
                数据删除请求通常在 7-14 个工作日内处理完成。
              </p>
            </section>
            
            <section className={styles.section}>
              <div className={styles.warningBox}>
                <h3 className={styles.warningTitle}>重要提示：</h3>
                <p className={styles.warningText}>
                  数据删除后无法恢复，请谨慎操作。某些法律要求保留的数据可能无法删除。
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
} 