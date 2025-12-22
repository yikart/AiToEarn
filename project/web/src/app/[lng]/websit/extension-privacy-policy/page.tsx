'use client'

import styles from '../websit.module.scss'

export default function ExtensionPrivacyPolicyPage() {
  return (
    <div className={styles.websitPage}>

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>
              AiToEarn Extension Privacy Policy
            </h1>
            <p className={styles.lastUpdated}>
              Last Updated: 2024-12-15
            </p>
          </div>

          <div className={styles.content}>
            <section className={styles.section}>
              <p className={styles.introduction}>
                This Privacy Policy describes how AiToEarn Extension ("Extension", "we", "us", or "our") collects, uses, and protects information when you use our browser extension. By installing and using the AiToEarn Extension, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Table of Contents</h2>
              <ul className={styles.listContent}>
                <li><a href="#section1">1. Overview</a></li>
                <li><a href="#section2">2. Information We Collect</a></li>
                <li><a href="#section3">3. Browser Permissions</a></li>
                <li><a href="#section4">4. How We Use Your Information</a></li>
                <li><a href="#section5">5. Data Storage and Security</a></li>
                <li><a href="#section6">6. Third-Party Services</a></li>
                <li><a href="#section7">7. Data Sharing</a></li>
                <li><a href="#section8">8. Your Rights and Choices</a></li>
                <li><a href="#section9">9. Updates to This Policy</a></li>
                <li><a href="#section10">10. Contact Us</a></li>
              </ul>
            </section>

            <section className={styles.section} id="section1">
              <h2 className={styles.sectionTitle}>1. Overview</h2>
              <p className={styles.sectionContent}>
                AiToEarn Extension is a browser extension designed to help users automate content publishing, engagement, and social media tasks seamlessly with the AiToEarn web platform (https://aitoearn.ai). The extension works in conjunction with supported social media platforms including Douyin, Xiaohongshu (Little Red Book), and other services.
              </p>
              <p className={styles.sectionContent}>
                We are committed to protecting your privacy and ensuring transparency about our data practices. This policy explains what data we collect, why we collect it, and how we protect it.
              </p>
            </section>

            <section className={styles.section} id="section2">
              <h2 className={styles.sectionTitle}>2. Information We Collect</h2>

              <h3 className={styles.subSectionTitle}>2.1 Authentication Data</h3>
              <p className={styles.sectionContent}>
                When you use the extension to connect to social media platforms, we may collect and process authentication tokens and session cookies necessary to perform automated actions on your behalf. This data is essential for the extension to function properly.
              </p>

              <h3 className={styles.subSectionTitle}>2.2 Social Media Account Information</h3>
              <p className={styles.sectionContent}>
                We may collect information from your connected social media accounts, including:
              </p>
              <ul className={styles.listContent}>
                <li>Account identifiers and usernames</li>
                <li>Profile information (display name, avatar)</li>
                <li>Content you choose to publish through the extension</li>
                <li>Engagement metrics (likes, comments, shares)</li>
              </ul>

              <h3 className={styles.subSectionTitle}>2.3 Technical Data</h3>
              <p className={styles.sectionContent}>
                We may automatically collect certain technical information, including:
              </p>
              <ul className={styles.listContent}>
                <li>Browser type and version</li>
                <li>Extension version</li>
                <li>Operating system information</li>
                <li>Error logs and diagnostic data</li>
              </ul>

              <h3 className={styles.subSectionTitle}>2.4 Usage Data</h3>
              <p className={styles.sectionContent}>
                We collect information about how you use the extension, such as features accessed and actions performed, to improve our services.
              </p>
            </section>

            <section className={styles.section} id="section3">
              <h2 className={styles.sectionTitle}>3. Browser Permissions</h2>
              <p className={styles.sectionContent}>
                The AiToEarn Extension requires certain browser permissions to function. Here's why we need each permission:
              </p>

              <h3 className={styles.subSectionTitle}>Storage</h3>
              <p className={styles.sectionContent}>
                Used to store your preferences, settings, and cached data locally on your device. This allows the extension to remember your configurations between browser sessions.
              </p>

              <h3 className={styles.subSectionTitle}>Tabs</h3>
              <p className={styles.sectionContent}>
                Required to interact with browser tabs, allowing the extension to open, navigate, and manage tabs when performing automated tasks on social media platforms.
              </p>

              <h3 className={styles.subSectionTitle}>Scripting</h3>
              <p className={styles.sectionContent}>
                Enables the extension to inject scripts into web pages to automate content publishing and engagement tasks on supported platforms.
              </p>

              <h3 className={styles.subSectionTitle}>Cookies (Optional)</h3>
              <p className={styles.sectionContent}>
                When granted, this permission allows the extension to access and manage cookies for authentication purposes with social media platforms. This is an optional permission and you can choose whether to grant it.
              </p>

              <h3 className={styles.subSectionTitle}>Declarative Net Request</h3>
              <p className={styles.sectionContent}>
                Used to modify network requests to ensure proper communication between the extension and supported websites, including handling of authentication headers and CORS policies.
              </p>

              <h3 className={styles.subSectionTitle}>Host Permissions</h3>
              <p className={styles.sectionContent}>
                The extension requires access to specific websites to function properly, including:
              </p>
              <ul className={styles.listContent}>
                <li>douyin.com - For Douyin platform integration</li>
                <li>xiaohongshu.com - For Xiaohongshu platform integration</li>
                <li>aitoearn.ai - For communication with AiToEarn web platform</li>
              </ul>
            </section>

            <section className={styles.section} id="section4">
              <h2 className={styles.sectionTitle}>4. How We Use Your Information</h2>
              <p className={styles.sectionContent}>
                We use the collected information for the following purposes:
              </p>
              <ul className={styles.listContent}>
                <li>To provide and maintain the extension's functionality</li>
                <li>To automate content publishing and engagement tasks on your behalf</li>
                <li>To synchronize data with the AiToEarn web platform</li>
                <li>To authenticate your sessions with connected social media platforms</li>
                <li>To improve and optimize the extension's performance</li>
                <li>To diagnose technical issues and provide customer support</li>
                <li>To send you important notifications about the extension</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section className={styles.section} id="section5">
              <h2 className={styles.sectionTitle}>5. Data Storage and Security</h2>

              <h3 className={styles.subSectionTitle}>Local Storage</h3>
              <p className={styles.sectionContent}>
                Most data collected by the extension is stored locally on your device using the browser's built-in storage mechanisms. This includes your preferences, cached data, and session information.
              </p>

              <h3 className={styles.subSectionTitle}>Server Storage</h3>
              <p className={styles.sectionContent}>
                Certain data may be transmitted to and stored on AiToEarn servers to enable synchronization between the extension and the web platform. This data is encrypted during transmission using industry-standard TLS/SSL protocols.
              </p>

              <h3 className={styles.subSectionTitle}>Security Measures</h3>
              <p className={styles.sectionContent}>
                We implement appropriate technical and organizational measures to protect your data, including:
              </p>
              <ul className={styles.listContent}>
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Secure coding practices</li>
              </ul>

              <div className={styles.warningBox}>
                <h3 className={styles.warningTitle}>Important Notice</h3>
                <p className={styles.warningText}>
                  While we strive to protect your data, no method of electronic storage or transmission is 100% secure. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
                </p>
              </div>
            </section>

            <section className={styles.section} id="section6">
              <h2 className={styles.sectionTitle}>6. Third-Party Services</h2>
              <p className={styles.sectionContent}>
                The extension interacts with third-party social media platforms. When you use the extension to connect to these platforms, you are also subject to their respective privacy policies:
              </p>
              <ul className={styles.listContent}>
                <li>Douyin/TikTok Privacy Policy</li>
                <li>Xiaohongshu (Little Red Book) Privacy Policy</li>
                <li>Other connected platform privacy policies</li>
              </ul>
              <p className={styles.sectionContent}>
                We recommend reviewing the privacy policies of these third-party services to understand how they collect, use, and protect your information.
              </p>
            </section>

            <section className={styles.section} id="section7">
              <h2 className={styles.sectionTitle}>7. Data Sharing</h2>
              <p className={styles.sectionContent}>
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>

              <h3 className={styles.subSectionTitle}>With AiToEarn Platform</h3>
              <p className={styles.sectionContent}>
                Data is shared between the extension and the AiToEarn web platform to provide seamless functionality and synchronization.
              </p>

              <h3 className={styles.subSectionTitle}>With Social Media Platforms</h3>
              <p className={styles.sectionContent}>
                When you authorize the extension to perform actions on social media platforms, necessary data is transmitted to those platforms to execute your requested actions.
              </p>

              <h3 className={styles.subSectionTitle}>Legal Requirements</h3>
              <p className={styles.sectionContent}>
                We may disclose your information if required by law, legal process, or government request, or to protect the rights, property, or safety of AiToEarn, our users, or others.
              </p>
            </section>

            <section className={styles.section} id="section8">
              <h2 className={styles.sectionTitle}>8. Your Rights and Choices</h2>
              <p className={styles.sectionContent}>
                You have the following rights regarding your data:
              </p>

              <h3 className={styles.subSectionTitle}>Access and Portability</h3>
              <p className={styles.sectionContent}>
                You can request access to the personal data we hold about you and receive a copy in a portable format.
              </p>

              <h3 className={styles.subSectionTitle}>Correction</h3>
              <p className={styles.sectionContent}>
                You can request correction of any inaccurate personal data we hold about you.
              </p>

              <h3 className={styles.subSectionTitle}>Deletion</h3>
              <p className={styles.sectionContent}>
                You can request deletion of your personal data. You can also uninstall the extension at any time, which will remove all locally stored data.
              </p>

              <h3 className={styles.subSectionTitle}>Opt-Out</h3>
              <p className={styles.sectionContent}>
                You can disconnect social media accounts or revoke permissions at any time through the extension settings or by uninstalling the extension.
              </p>

              <p className={styles.sectionContent}>
                To exercise any of these rights, please contact us at the email address provided below.
              </p>
            </section>

            <section className={styles.section} id="section9">
              <h2 className={styles.sectionTitle}>9. Updates to This Policy</h2>
              <p className={styles.sectionContent}>
                We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by updating the "Last Updated" date at the top of this policy and, where appropriate, through the extension or by other means.
              </p>
              <p className={styles.sectionContent}>
                We encourage you to review this Privacy Policy periodically to stay informed about our data practices.
              </p>
            </section>

            <section className={styles.section} id="section10">
              <h2 className={styles.sectionTitle}>10. Contact Us</h2>
              <div className={styles.contactInfo}>
                <h3 className={styles.contactTitle}>Contact Information</h3>
                <p className={styles.contactText}>
                  If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                </p>
                <p className={styles.contactText}>
                  <strong>Email:</strong>
                  {' '}
                  hello@aitoearn.ai
                  <br />
                  <strong>Website:</strong>
                  {' '}
                  https://aitoearn.ai
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

