'use client'

import styles from '../websit.module.scss'

export default function DataDeletionPage() {
  return (
    <div className={styles.websitPage}>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>
              Data Deletion Instructions
            </h1>
            <p className={styles.lastUpdated}>
              Last Updated: 2025.6.27
            </p>
          </div>

          <div className={styles.content}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>For Pre-Launch Users:</h2>
              <p className={styles.sectionContent}>
                Our application is currently in pre-launch phase and does not store real user data.
                If you have interacted with our test systems, contact us for data removal.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Standard Procedure (Post-Launch):</h2>
              <ol className={styles.stepsList}>
                <li className={styles.stepItem}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepText}>Log in to your AiToEarn account</div>
                </li>
                <li className={styles.stepItem}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepText}>Navigate to Settings &gt; Privacy</div>
                </li>
                <li className={styles.stepItem}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepText}>Click "Request Account Deletion"</div>
                </li>
                <li className={styles.stepItem}>
                  <div className={styles.stepNumber}>4</div>
                  <div className={styles.stepText}>Confirmation will be sent to your registered email</div>
                </li>
              </ol>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Contact for Assistance:</h2>
              <div className={styles.contactInfo}>
                <h3 className={styles.contactTitle}>Pre-launch inquiries only</h3>
                <p className={styles.contactText}>
                  <strong>Email:</strong>
                  {' '}
                  metat@aitoearning.com
                </p>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.warningBox}>
                <h3 className={styles.warningTitle}>Important Note:</h3>
                <p className={styles.warningText}>
                  This page will be automatically updated upon app launch
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
