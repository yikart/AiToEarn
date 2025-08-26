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

          <a href="#docs" className={styles.navLink}>{t('header.nav.docs')}</a>
          <a href="#blog" className={styles.navLink}>{t('header.nav.blog')}</a>
        </nav>
        <button className={styles.getStartedBtn}>{t('header.getStarted')}</button>
      </div>
    </header>
  );
}

export default function DataProtectionAgreementPage() {
  return (
    <div className={styles.websitPage}>
      <Header />
      
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>
              Data Protection Agreement
            </h1>
            <p className={styles.lastUpdated}>
              Last Updated: 2024-12-26
            </p>
          </div>
          
          <div className={styles.content}>
            <section className={styles.section}>
              <p className={styles.introduction}>
                This Data Protection Agreement outlines how we handle, protect, and process your personal data in compliance with applicable data protection laws, including the General Data Protection Regulation (GDPR) and other relevant privacy regulations.
              </p>
            </section>
            
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>1. Data Controller Information</h2>
              <p className={styles.sectionContent}>
                Aitoearn, Inc. acts as the data controller for personal data collected through our services. We are responsible for determining the purposes and means of processing your personal data.
              </p>
              <div className={styles.contactInfo}>
                <h3 className={styles.contactTitle}>Contact Information</h3>
                <p className={styles.contactText}>
                  Email: privacy@aiearn.ai<br/>
                  Address: [Company Address]<br/>
                  Data Protection Officer: dpo@aiearn.ai
                </p>
              </div>
            </section>
            
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>2. Types of Data We Collect</h2>
              <p className={styles.sectionContent}>
                We collect and process the following categories of personal data:
              </p>
              <ul className={styles.listContent}>
                <li><strong>Account Information:</strong> Name, email address, username, password</li>
                <li><strong>Profile Data:</strong> Profile pictures, bio information, social media links</li>
                <li><strong>Content Data:</strong> Posts, comments, media files, scheduling information</li>
                <li><strong>Usage Data:</strong> Platform interactions, feature usage, analytics data</li>
                <li><strong>Technical Data:</strong> IP address, device information, browser type, session data</li>
                <li><strong>Communication Data:</strong> Support tickets, feedback, correspondence</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>3. Legal Basis for Processing</h2>
              <p className={styles.sectionContent}>
                We process your personal data based on the following legal grounds:
              </p>
              <ul className={styles.listContent}>
                <li><strong>Contract Performance:</strong> To provide our services and fulfill our contractual obligations</li>
                <li><strong>Legitimate Interest:</strong> To improve our services, prevent fraud, and ensure security</li>
                <li><strong>Consent:</strong> For marketing communications and optional features (where required)</li>
                <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>4. Data Sharing and Third Parties</h2>
              <p className={styles.sectionContent}>
                We may share your personal data with:
              </p>
              <ul className={styles.listContent}>
                <li><strong>Service Providers:</strong> Cloud hosting, analytics, customer support</li>
                <li><strong>Social Media Platforms:</strong> When you connect and publish content to external platforms</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect our legal rights</li>
                <li><strong>Business Partners:</strong> With your explicit consent for specific integrations</li>
              </ul>
              <p className={styles.sectionContent}>
                We ensure all third parties maintain appropriate data protection standards through contractual agreements.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>5. International Data Transfers</h2>
              <p className={styles.sectionContent}>
                Your personal data may be transferred to and processed in countries outside your residence. We ensure adequate protection through:
              </p>
              <ul className={styles.listContent}>
                <li>European Commission adequacy decisions</li>
                <li>Standard Contractual Clauses (SCCs)</li>
                <li>Data Processing Agreements with appropriate safeguards</li>
                <li>Certification schemes and codes of conduct</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>6. Your Rights Under Data Protection Laws</h2>
              <p className={styles.sectionContent}>
                You have the following rights regarding your personal data:
              </p>
              <ul className={styles.listContent}>
                <li><strong>Right of Access:</strong> Request copies of your personal data</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                <li><strong>Right to Data Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Right to Object:</strong> Object to certain types of processing</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for consent-based processing</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>7. Data Retention</h2>
              <p className={styles.sectionContent}>
                We retain your personal data for different periods depending on the purpose:
              </p>
              <ul className={styles.listContent}>
                <li><strong>Account Data:</strong> Until account deletion plus 30 days for backup recovery</li>
                <li><strong>Content Data:</strong> Until deletion by user or account termination</li>
                <li><strong>Usage Analytics:</strong> Aggregated data retained for 2 years</li>
                <li><strong>Legal/Compliance Data:</strong> As required by applicable laws</li>
                <li><strong>Marketing Data:</strong> Until consent withdrawal or 3 years of inactivity</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>8. Data Security Measures</h2>
              <p className={styles.sectionContent}>
                We implement comprehensive security measures to protect your personal data:
              </p>
              <ul className={styles.listContent}>
                <li>End-to-end encryption for data transmission</li>
                <li>Advanced encryption standards (AES-256) for data storage</li>
                <li>Multi-factor authentication and access controls</li>
                <li>Regular security audits and penetration testing</li>
                <li>Employee training on data protection practices</li>
                <li>Incident response and breach notification procedures</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>9. Data Breach Notification</h2>
              <p className={styles.sectionContent}>
                In the event of a personal data breach that is likely to result in a high risk to your rights and freedoms, we will:
              </p>
              <ul className={styles.listContent}>
                <li>Notify relevant supervisory authorities within 72 hours</li>
                <li>Inform affected individuals without undue delay</li>
                <li>Provide clear information about the breach and our response</li>
                <li>Take immediate measures to contain and mitigate the breach</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>10. Data Subject Requests</h2>
              <p className={styles.sectionContent}>
                To exercise your data protection rights, please contact us at:
              </p>
              <div className={styles.contactInfo}>
                <h3 className={styles.contactTitle}>Data Protection Requests</h3>
                <p className={styles.contactText}>
                  Email: privacy@aiearn.ai<br/>
                  Subject Line: Data Protection Request - [Type of Request]<br/>
                  Response Time: Within 30 days of receipt
                </p>
              </div>
              <p className={styles.sectionContent}>
                We may require additional information to verify your identity before processing your request.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>11. Children's Privacy</h2>
              <p className={styles.sectionContent}>
                Our services are not intended for children under 13 years of age (or 16 in the EU). We do not knowingly collect personal data from children. If we become aware that we have collected personal data from a child, we will take immediate steps to delete such information.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>12. Supervisory Authority</h2>
              <p className={styles.sectionContent}>
                You have the right to lodge a complaint with a supervisory authority if you believe our processing of your personal data violates applicable data protection laws. You can contact your local data protection authority or the authority in the country where the alleged violation occurred.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>13. Updates to This Agreement</h2>
              <p className={styles.sectionContent}>
                We may update this Data Protection Agreement from time to time to reflect changes in our practices or applicable laws. We will notify you of material changes through our platform or via email. Continued use of our services after such changes constitutes acceptance of the updated agreement.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>14. Contact Information</h2>
              <div className={styles.contactInfo}>
                <h3 className={styles.contactTitle}>Data Protection Inquiries</h3>
                <p className={styles.contactText}>
                  For any questions about this Data Protection Agreement or our data processing practices:<br/><br/>
                  Email: privacy@aiearn.ai<br/>
                  Data Protection Officer: dpo@aiearn.ai<br/>
                  General Contact: hello@aiearn.ai
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
} 