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
  return (
    <div className={styles.websitPage}>
      <Header />
      
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>
              Terms of Service
            </h1>
            <p className={styles.lastUpdated}>
              Last Updated: 2024-12-26
            </p>
          </div>
          
          <div className={styles.content}>
            <section className={styles.section}>
              <p className={styles.introduction}>
                The following sets forth Aitoearn's Terms of Use. We know how tempting it is to skip these Terms of Use, but it's important to establish what you can expect from us as you use Aitoearn's Service, and what we expect from you. The Terms of Use is a binding legal document, and you are required to read and accept it in full in order to use our Service.
              </p>
            </section>
            
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Aitoearn, Inc Terms of Use</h2>
              <p className={styles.sectionContent}>
                Welcome, and thank you for your interest in Aitoearn, Inc. ("Aitoearn," "we," or "us") and our website at aitoearn.ai, along with our related websites, networks, hosted applications, mobile or other downloadable applications, and other services provided by us (collectively, the "Service"). These Terms of Use are a legally binding contract between you and Aitoearn regarding your use of the Service.
              </p>
              <p className={styles.sectionContent}>
                <strong>PLEASE READ THE FOLLOWING TERMS CAREFULLY:</strong><br/>
                BY CLICKING "I ACCEPT,"OR BY DOWNLOADING, INSTALLING, OR OTHERWISE ACCESSING OR USING THE SERVICE, YOU AGREE THAT YOU HAVE READ AND UNDERSTOOD, AND, AS A CONDITION TO YOUR USE OF THE SERVICE, YOU AGREE TO BE BOUND BY, THE FOLLOWING TERMS AND CONDITIONS, INCLUDING Aitoearn'S PRIVACY POLICY https://aitoearn.ai/en/websit/privacy-policy AND ANY ADDITIONAL TERMS AND POLICIES Aitoearn MAY PROVIDE FROM TIME TO TIME (TOGETHER, THESE "TERMS").
              </p>
              <p className={styles.sectionContent}>
                <strong>Arbitration NOTICE.</strong> Except for certain kinds of disputes described in Section 14, you agree that disputes arising under these Terms will be resolved by binding, individual arbitration, and BY ACCEPTING THESE TERMS, YOU AND Aitoearn ARE EACH WAIVING THE RIGHT TO A TRIAL BY JURY OR TO PARTICIPATE IN ANY CLASS ACTION OR REPRESENTATIVE PROCEEDING.
              </p>
            </section>
            
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>1. SERVICE AND ACCOUNT</h2>
              <h3 className={styles.subSectionTitle}>1.1 Service Overview</h3>
              <p className={styles.sectionContent}>
                The Service provides a social media management tool that enables users to release posts on social platforms at a scheduled time, in addition to other design and analytics tools to help bolster users' social media content.
              </p>
              <h3 className={styles.subSectionTitle}>1.2 Modification of the Service</h3>
              <p className={styles.sectionContent}>
                Aitoearn reserves the right to modify or discontinue all or any portion of the Service at any time (including by limiting or discontinuing certain features of the Service), temporarily or permanently, without notice to you. Aitoearn will have no liability for any change to the Service, including any paid-for functionalities of the Service, or any suspension or termination of your access to or use of the Service. Service fees are not refundable.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>2. Eligibility</h2>
              <p className={styles.sectionContent}>
                You must be at least 18-years old to use the Service. By agreeing to these Terms, you represent and warrant to us that: (a) you are at least 18-years old; (b) you have not previously been suspended or removed from the applicable Service; and (c) your registration and your use of the Service is in compliance with any and all laws and regulations. If you are an entity, organization, or company, the individual accepting these Terms on your behalf represents and warrants that they have authority to bind you to these Terms and you agree to be bound by these Terms.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>3. Accounts and Registration</h2>
              <p className={styles.sectionContent}>
                To access most features of the Service, you must register for an account. When you register for an account, you may be required to provide us with some information about yourself, such as your name, email address, or other contact information. You agree that the information you provide to us is accurate, complete, and not misleading, and that you will keep it accurate and up to date at all times. When you register, you will be asked to create a password. You are solely responsible for maintaining the confidentiality of your account and password, and you accept responsibility for all activities that occur under your account. If you believe that your account is no longer secure, then you should immediately notify us at hello@aitoearn.ai.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>4. Payment Terms</h2>
              <p className={styles.sectionContent}>
                Some features of the Service may require you to pay fees upon registering for the applicable subscription. Before you pay any fees, you will have an opportunity to review and accept the fees that you will be charged. All fees are in U.S. Dollars and are non-refundable unless otherwise specifically provided for in these Terms. Fees vary based on the plan, with different pricing schemes for individual users and organizations.
              </p>
              <h3 className={styles.subSectionTitle}>4.1 Price</h3>
              <p className={styles.sectionContent}>
                Aitoearn reserves the right to determine pricing for the Service. Aitoearn will make reasonable efforts to keep pricing information published on our website up to date. We encourage you to check our pricing page periodically for current pricing information. If you cancel your subscription you may forego your current price.
              </p>
              <h3 className={styles.subSectionTitle}>4.2 Authorization</h3>
              <p className={styles.sectionContent}>
                You authorize Aitoearn to charge all sums for the orders that you make and any level of Service you select as described in these Terms or published by Aitoearn, including all applicable taxes, to the payment method specified in your account. If you pay any fees with a credit card, then Aitoearn may seek pre-authorization of your credit card account prior to your purchase to verify that the credit card is valid and has the necessary funds or credit available to cover your purchase.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>5. LICENSE TO Aitoearn SERVICES</h2>
              <h3 className={styles.subSectionTitle}>5.1 Limited License</h3>
              <p className={styles.sectionContent}>
                Subject to your complete and ongoing compliance with these Terms, Aitoearn grants you, solely for your a limited, non-exclusive, non-transferable, non-sublicensable, and revocable license to: (a) install and use one object code copy of any mobile or other downloadable application associated with the Service obtained from a legitimate marketplace (whether installed by you or pre-installed on your mobile device by the device manufacturer or a wireless telephone provider) on a mobile device that you own or control; and (b) access and use the Service.
              </p>
              <h3 className={styles.subSectionTitle}>5.2 License Restrictions</h3>
              <p className={styles.sectionContent}>
                Except and solely to the extent such a restriction is impermissible under applicable law, you may not: (a) reproduce, distribute, publicly display, publicly perform, or create derivative works of the Service; (b) make modifications to the Service; or (c) interfere with or circumvent any feature of the Service, including any security or access control mechanism. If you are prohibited under applicable law from using the Service, then you may not use it.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>6. Ownership; Proprietary Rights</h2>
              <p className={styles.sectionContent}>
                The Service is owned and operated by Aitoearn. The visual interfaces, graphics, design, compilation, information, data, computer code (including source code or object code), products, software, services, domain names, templates, and all other elements of the Service provided by Aitoearn ("Materials") are protected by intellectual property and other laws. All Materials included in the Service are the property of Aitoearn or its third-party licensors. Except as expressly authorized by Aitoearn, you may not make use of the Materials.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>7. USER CONTENT</h2>
              <h3 className={styles.subSectionTitle}>7.1 User Content Generally</h3>
              <p className={styles.sectionContent}>
                Certain features of the Service may permit users to submit, upload, publish, broadcast, or otherwise transmit ("Post") content to or via the Service, including social media posts and other content which may be comprised of messages, reviews, photos, video or audio (including sound or voice recordings and musical recordings embodied in the video or audio), images, folders, data, text, and any other works of authorship or other works ("User Content"). You retain any copyright and other proprietary rights that you may hold in the User Content that you Post to the Service subject to the licenses granted in these Terms.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>8. Prohibited Conduct</h2>
              <p className={styles.sectionContent}>
                BY USING THE SERVICE, YOU AGREE NOT TO:
              </p>
              <ul className={styles.listContent}>
                <li>use the Service for any illegal purpose or in violation of any local, state, national, or international law;</li>
                <li>harass, threaten, demean, embarrass, bully, or otherwise harm any other user of the Service;</li>
                <li>violate, encourage others to violate, or provide instructions on how to violate, any right of a third party, including by infringing or misappropriating any third-party intellectual property right;</li>
                <li>access, search, or otherwise use any portion of the Service through the use of any engine, software, tool, agent, device, or mechanism (including spiders, robots, crawlers, and data mining tools) other than the software or search agents provided by Aitoearn;</li>
                <li>interfere with security-related features of the Service;</li>
                <li>perform any fraudulent activity including impersonating any person or entity, claiming a false affiliation or identify, accessing any other Service account without permission, or falsifying your age or date of birth;</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>9. INTELLECTUAL PROPERTY PROTECTION</h2>
              <p className={styles.sectionContent}>
                Aitoearn respects the intellectual property rights of others, takes the protection of intellectual property rights very seriously, and asks users of the Service to do the same. Infringing activity will not be tolerated on or through the Service.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>10. TERM AND TERMINATION</h2>
              <p className={styles.sectionContent}>
                These Terms are effective beginning when you accept the Terms or first download, install, access, or use the Service, and ending when terminated as described in this section. If you violate any provision of these Terms, then your authorization to access the Service and these Terms automatically terminate. In addition, Aitoearn may, at its sole discretion, terminate these Terms or your account on the Service, or suspend or terminate your access to the Service, at any time for any reason or no reason, with or without notice.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>11. LIMITATION OF LIABILITY</h2>
              <p className={styles.sectionContent}>
                TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT WILL THE Aitoearn ENTITIES BE LIABLE TO YOU FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES (INCLUDING DAMAGES FOR LOSS OF PROFITS, GOODWILL, OR ANY OTHER INTANGIBLE LOSS) ARISING OUT OF OR RELATING TO YOUR ACCESS TO OR USE OF, OR YOUR INABILITY TO ACCESS OR USE, THE SERVICE OR ANY MATERIALS OR CONTENT ON THE SERVICE, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), STATUTE, OR ANY OTHER LEGAL THEORY.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>12. Dispute Resolution and Arbitration</h2>
              <p className={styles.sectionContent}>
                In the interest of resolving disputes between you and Aitoearn in the most expedient and cost effective manner, and except as described in the Arbitration provisions, you and Aitoearn agree that every dispute arising in connection with these Terms, the Service, and communications from us will be resolved by binding arbitration. Arbitration is less formal than a lawsuit in court. YOU UNDERSTAND AND AGREE THAT, BY ENTERING INTO THESE TERMS, YOU AND Aitoearn ARE EACH WAIVING THE RIGHT TO A TRIAL BY JURY OR TO PARTICIPATE IN A CLASS ACTION.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>13. MISCELLANEOUS</h2>
              <p className={styles.sectionContent}>
                These Terms, including the Privacy Policy and any other agreements expressly incorporated by reference into these Terms, are the entire and exclusive understanding and agreement between you and Aitoearn regarding your use of the Service. These Terms are governed by the laws of the State of California without regard to conflict of law principles.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>14. Contact Information</h2>
              <p className={styles.sectionContent}>
                The Service is offered by Aitoearn, Inc. You may contact us by emailing us at hello@aitoearn.ai.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
} 