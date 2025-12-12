'use client'

import { useTransClient } from '@/app/i18n/client'
import styles from '../websit.module.scss'

// 导入首页的Header组件
function Header() {
  const { t } = useTransClient('home')

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
          {/* <a href="#blog" className={styles.navLink}>{t('header.nav.blog')}</a> */}
        </nav>
        <button className={styles.getStartedBtn}>{t('header.getStarted')}</button>
      </div>
    </header>
  )
}

export default function PrivacyPolicyPage() {
  return (
    <div className={styles.websitPage}>
      <Header />

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>
              Privacy Policy
            </h1>
            <p className={styles.lastUpdated}>
              Last Updated: 2024-12-26
            </p>
          </div>

          <div className={styles.content}>
            <section className={styles.section}>
              <p className={styles.introduction}>
                Aitoearn provides this Privacy Policy to inform you of our policies and procedures regarding the collection, use, protection, and disclosure of Personal Information received from your use of this website, located at https://aitoearn.ai (“Site”), as well as all related websites including our subdomains, applications, browser extensions, and other services provided by us (collectively, together with the Site, our “Service”), and in connection with our customer, vendor, and partner relationships. This Privacy Policy also tells you about your rights and choices with respect to your Personal Information, and how you can reach us to update your contact information or get answers to questions you may have about our privacy practices.
              </p>
              <p className={styles.sectionContent}>
                In addition to the activities described in this Privacy Policy, we may process Personal Information on behalf of our commercial customers when they use the Service. We process such Personal Information as a data processor of our commercial customers, which are the entities responsible for the data processing. To understand how a commercial customer processes your Personal Information, please refer to that customer’s privacy policy.
              </p>
              <p className={styles.sectionContent}>
                Registration with, use of, and access to the Service is subject to this Privacy Policy and our Terms of Use located at https://aitoearn.ai/en/websit/terms-of-service.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Table of Contents</h2>
              <ul className={styles.listContent}>
                <li><a href="#section1">1. Personal Information We May Collect</a></li>
                <li><a href="#section2">2. Personal Information Provided by You</a></li>
                <li><a href="#section2a">2a. Personal Information Collected from Connected Social Media Accounts</a></li>
                <li><a href="#section2b">2b. Personal Information Automatically Obtained from Your Interactions with the Service</a></li>
                <li><a href="#section3">3. How We May Use Your Personal Information</a></li>
                <li><a href="#section4">4. How We Share Your Personal Information</a></li>
                <li><a href="#section5">5. How We Protect Your Personal Information</a></li>
                <li><a href="#section6">6. Your Rights and Choices</a></li>
                <li><a href="#section7">7. Data Transfers</a></li>
                <li><a href="#section8">8. Children's Privacy</a></li>
                <li><a href="#section9">9. Updates to this Privacy Policy</a></li>
                <li><a href="#section11">10. How to Contact Us</a></li>
              </ul>
            </section>

            <section className={styles.section} id="section1">
              <h2 className={styles.sectionTitle}>1. Personal Information We May Collect</h2>
              <p className={styles.sectionContent}>
                For the purpose of this Privacy Policy, "Personal Information" means any information relating to an identified or identifiable individual. We obtain Personal Information relating to you from various sources described below.
              </p>
              <p className={styles.sectionContent}>
                Where applicable, we indicate whether and why you must provide us with your Personal Information, as well as the consequences of failing to do so. If you do not provide Personal Information when requested, you may not be able to benefit from our Service if that information is necessary to provide you with the service or if we are legally required to collect it.
              </p>
            </section>

            <section className={styles.section} id="section2">
              <h2 className={styles.sectionTitle}>2. Personal Information Provided by You</h2>

              <h3 className={styles.subSectionTitle}>Registration</h3>
              <p className={styles.sectionContent}>
                If you desire to have access to certain restricted sections of the Site or request to receive marketing materials, you may be required to become a registered user, and to submit the following types of Personal Information to Aitoearn: your name, email address, phone number, full user name, password, city, and time zone.
              </p>

              <h3 className={styles.subSectionTitle}>Customer Support</h3>
              <p className={styles.sectionContent}>
                We may collect information through your communications with our customer support team or other communications that you may send us and their contents.
              </p>

              <h3 className={styles.subSectionTitle}>Making a Purchase</h3>
              <p className={styles.sectionContent}>
                When you make payments through the Service, you will need to provide Personal Information such as your credit card number and billing address.
              </p>

              <h3 className={styles.subSectionTitle}>Social Media</h3>
              <p className={styles.sectionContent}>
                In order to allow you to post to your social media platforms, we may ask you to provide your username, account ids, social handle, timezones, and email address.
              </p>
            </section>

            <section className={styles.section} id="section2a">
              <h2 className={styles.sectionTitle}>2a. Personal Information Collected from Connected Social Media Accounts</h2>
              <p className={styles.sectionContent}>
                If you connect your third party social media account to your Aitoearn account, we may collect certain information stored in your social media account such as:
              </p>

              <h3 className={styles.subSectionTitle}>Facebook</h3>
              <p className={styles.sectionContent}>
                Aitoearn may allow you to connect a Facebook page or profile to your Aitoearn account, in which case we will access certain information from Facebook regarding your account. In particular, we may collect profile image, display name, username / page ID or profile ID, access tokens, sent posts. This includes the content of your post and engagement data (such as click rates, likes, re-shares, impressions, as well as general engagement counts), to the extent permitted by applicable law.
              </p>

              <h3 className={styles.subSectionTitle}>Twitter</h3>
              <p className={styles.sectionContent}>
                Aitoearn may allow you to connect a Twitter profile to your Aitoearn account, in which case we will access certain information from Twitter regarding your account. In particular, we may collect profile image, display name, username / profile ID, access tokens, and sent posts. This includes the content of your post and engagement data (such as click rates, likes, retweets, re-shares, impressions, as well as general engagement counts), to the extent permitted by applicable law.
              </p>

              <h3 className={styles.subSectionTitle}>Instagram</h3>
              <p className={styles.sectionContent}>
                Aitoearn may allow you to connect an Instagram profile to your Aitoearn account, in which case we will access certain information from Instagram regarding your account. In particular, we may collect profile image, display name, username / profile ID, access tokens, and sent posts.
              </p>

              <h3 className={styles.subSectionTitle}>LinkedIn</h3>
              <p className={styles.sectionContent}>
                Aitoearn may allow you to connect a LinkedIn profile to your Aitoearn account, in which case we will access certain information from LinkedIn regarding your account. In particular, we may collect profile image, display name, username / profile ID, access tokens, and sent posts.
              </p>

              <h3 className={styles.subSectionTitle}>TikTok</h3>
              <p className={styles.sectionContent}>
                Aitoearn may allow you to connect a TikTok profile to your Aitoearn account, in which case we will access certain information from TikTok regarding your account. In particular, we may collect profile image, display name, username / profile ID, access tokens, and sent posts.
              </p>

              <h3 className={styles.subSectionTitle}>YouTube</h3>
              <p className={styles.sectionContent}>
                Aitoearn may allow you to connect a YouTube channel to your Aitoearn account, in which case we will access certain information from Google and YouTube regarding your account. In particular, we may collect profile image, display name, profile ID, access tokens, existing videos. Aitoearn uses YouTube API Services and by using the YouTube integration via Aitoearn, you agree to be bound by the YouTube Terms of Service.
              </p>
            </section>

            <section className={styles.section} id="section2b">
              <h2 className={styles.sectionTitle}>2b. Personal Information Automatically Obtained from Your Interactions with the Service</h2>

              <h3 className={styles.subSectionTitle}>Log Data</h3>
              <p className={styles.sectionContent}>
                When you use our Service, our servers automatically record information that your browser sends whenever you visit a website ("Log Data"). This Log Data may include information such as your IP address, browser type or the domain from which you are visiting, the web-pages you visit, the search terms you use, and any advertisements on which you click.
              </p>

              <h3 className={styles.subSectionTitle}>Cookies and Similar Technologies</h3>
              <p className={styles.sectionContent}>
                Like many websites, we also use "cookie" technology to collect additional website usage data and to improve the Site and our Service. A cookie is a small data file that we transfer to your computer's hard disk. Aitoearn may use both session cookies and persistent cookies to better understand how you interact with the Site and our Service.
              </p>
              <p className={styles.sectionContent}>
                You can instruct your browser, by editing its options, to stop accepting cookies or to prompt you before accepting a cookie from the websites you visit. Please note that if you delete, or choose not to accept, cookies from the Service, you may not be able to utilize the features of the Service to their fullest potential.
              </p>
            </section>

            <section className={styles.section} id="section3">
              <h2 className={styles.sectionTitle}>3. How We May Use Your Personal Information</h2>
              <p className={styles.sectionContent}>
                We may use the Personal Information we obtain about you to:
              </p>
              <ul className={styles.listContent}>
                <li>create and manage your account, provide our Service, process payments, and respond to your inquiries;</li>
                <li>manage account authentication such as two-factor authentication;</li>
                <li>communicate with you to verify your account and for informational and operational purposes;</li>
                <li>tailor our Service (e.g., we may use cookies and similar technologies to remember your preferences);</li>
                <li>publish your content, comments or messages on social media platforms;</li>
                <li>provide tailored advertising, for Aitoearn services, via Google AdWords;</li>
                <li>aggregate your Personal Information for analytical purposes;</li>
                <li>provide customer support;</li>
                <li>operate, evaluate and improve our business;</li>
                <li>send you marketing communications about products, services, offers, programs and promotions;</li>
                <li>ensure the security of our Service;</li>
                <li>enforce our agreements related to our Service and our other legal rights;</li>
                <li>comply with applicable legal requirements, industry standards and our policies.</li>
              </ul>
            </section>

            <section className={styles.section} id="section4">
              <h2 className={styles.sectionTitle}>4. How We Share Your Personal Information</h2>
              <p className={styles.sectionContent}>
                We may disclose the Personal Information we collect about you as described below or otherwise disclosed to you at the time the data is collected.
              </p>

              <h3 className={styles.subSectionTitle}>Service Providers</h3>
              <p className={styles.sectionContent}>
                We engage certain trusted third parties to perform functions and provide services to us, including hosting and maintenance, error monitoring, debugging, performance monitoring, billing, customer relationship, database storage and management, and direct marketing campaigns. We may share your personal information with these third parties, but only to the extent necessary to perform these functions and provide such services.
              </p>

              <h3 className={styles.subSectionTitle}>Compliance with Laws and Law Enforcement</h3>
              <p className={styles.sectionContent}>
                Aitoearn cooperates with government and law enforcement officials or private parties to enforce and comply with the law. To the extent permitted under applicable law, we may disclose any information about you to government or law enforcement officials or private parties as we believe is necessary or appropriate to investigate, respond to, and defend against claims.
              </p>

              <h3 className={styles.subSectionTitle}>Business Transfers</h3>
              <p className={styles.sectionContent}>
                Aitoearn may sell, transfer or otherwise share some or all of its assets, including personal information, in connection with a merger, acquisition, reorganization, sale of assets, or similar transaction, or in the event of insolvency or bankruptcy.
              </p>
            </section>

            <section className={styles.section} id="section5">
              <h2 className={styles.sectionTitle}>5. How We Protect Your Personal Information</h2>
              <p className={styles.sectionContent}>
                Aitoearn cares deeply about safeguarding the confidentiality of your personal information. We employ administrative and electronic measures designed to appropriately protect your personal information against accidental or unlawful destruction, accidental loss, unauthorized alteration, unauthorized disclosure or access, misuse, and any other unlawful form of processing of the personal information in our possession.
              </p>
              <p className={styles.sectionContent}>
                Please be aware that no security measures are perfect or impenetrable. We cannot guarantee that information about you will not be accessed, viewed, disclosed, altered, or destroyed by breach of any of our administrative, physical, and electronic safeguards.
              </p>
              <p className={styles.sectionContent}>
                We will make any legally-required disclosures of any breach of the security, confidentiality, or integrity of your unencrypted electronically stored personal information to you via email or conspicuous posting on our site in the most expedient time possible and without unreasonable delay.
              </p>
            </section>

            <section className={styles.section} id="section6">
              <h2 className={styles.sectionTitle}>6. Your Rights and Choices</h2>
              <p className={styles.sectionContent}>
                If you decide at any time that you no longer wish to receive marketing communications from us, please follow the unsubscribe instructions provided in any of the communications. You may also opt out from receiving commercial email from us by sending your request to us by email at hello@aitoearn.ai.
              </p>
              <p className={styles.sectionContent}>
                In certain jurisdictions you have the right to request access and receive information about the personal information we maintain about you, to update and correct inaccuracies in your personal information, to restrict or object to the processing of your personal information, to have the information blocked, anonymized or deleted, as appropriate, or to exercise your right to data portability to transfer your personal information to another company.
              </p>
              <p className={styles.sectionContent}>
                Where required by law, we obtain your consent for the processing of certain personal information collected by cookies or similar technologies, or used to send you direct marketing communications, or when we carry out other processing activities for which consent may be required.
              </p>
            </section>

            <section className={styles.section} id="section7">
              <h2 className={styles.sectionTitle}>7. Data Transfers</h2>
              <p className={styles.sectionContent}>
                Personal information that we collect may be transferred to, and stored at, any of our affiliates, partners or service providers which may be inside or outside the European Economic Area (EEA), the United Kingdom (UK) or Switzerland, including in the US. Your personal information may be transferred to countries that do not have the same data protection laws as the country in which you initially provided the information.
              </p>
              <p className={styles.sectionContent}>
                Aitoearn complies with the EU-U.S. Data Privacy Framework, the Swiss-U.S. Data Privacy Framework, and the UK Extension to the Data Privacy Framework (the "DPFs") to transfer personal information outside the EEA, the UK and Switzerland to the U.S.
              </p>
            </section>

            <section className={styles.section} id="section8">
              <h2 className={styles.sectionTitle}>8. Children's Privacy</h2>
              <p className={styles.sectionContent}>
                The site is not directed to persons under 16. If a parent or guardian becomes aware that his or her child has provided us with personal information without their consent, he or she should contact us at hello@aitoearn.ai. We do not knowingly collect personal information from children under 16. If we become aware that a child under 16 has provided us with personal information, we will delete such information from our files.
              </p>
            </section>

            <section className={styles.section} id="section9">
              <h2 className={styles.sectionTitle}>9. Updates to this Privacy Policy</h2>
              <p className={styles.sectionContent}>
                This privacy policy may be updated from time to time for any reason; each version will apply to information collected while it was in place. We will notify you of any modifications to our privacy policy by posting the new privacy policy on our site and indicating the date of the latest revision.
              </p>
              <p className={styles.sectionContent}>
                In the event that the modifications materially alter your rights or obligations hereunder, we will make reasonable efforts to notify you of the change. For example, we may send a message to your email address or generate a pop-up or similar notification when you access the service for the first time after such material changes are made.
              </p>
            </section>

            <section className={styles.section} id="section11">
              <h2 className={styles.sectionTitle}>10. How to Contact Us</h2>
              <div className={styles.contactInfo}>
                <h3 className={styles.contactTitle}>Contact Information</h3>
                <p className={styles.contactText}>
                  Aitoearn Inc. is the entity responsible for the processing of your personal information. If you have any questions or comments regarding this privacy policy, or if you would like to exercise your rights to your personal information, you may contact us:
                </p>
                <p className={styles.contactText}>
                  <strong>Email:</strong>
                  {' '}
                  hello@aitoearn.ai
                  <br />
                  <strong>Privacy Questions:</strong>
                  {' '}
                  privacy@aitoearn.ai
                </p>
                <p className={styles.contactText}>
                  If you have any thoughts or questions about this privacy policy please let us know at hello@aitoearn.ai
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
