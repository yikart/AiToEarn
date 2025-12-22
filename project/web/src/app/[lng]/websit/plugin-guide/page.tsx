'use client'

import { useTransClient } from '@/app/i18n/client'
import Image from 'next/image'
import styles from './pluginGuide.module.scss'
import image1 from './images/gyude-image1.png'
import image2 from './images/gyude-image2.png'
import image4 from './images/gyude-image4.png'
import image5 from './images/gyude-image5.png'
import image6 from './images/gyude-image6.png'
import image7 from './images/gyude-image7.png'
import image8 from './images/gyude-image8.png'
import image9 from './images/gyude-image9.png'
import image10 from './images/gyude-image10.png'

/**
 * 教程步骤组件
 */
interface GuideStepProps {
  stepNumber: number
  title: string
  content: string
  image: any
  imageAlt: string
  note?: {
    title: string
    items: string[]
  }
}

function GuideStep({ stepNumber, title, content, image, imageAlt, note }: GuideStepProps) {
  return (
    <div className={styles.guideStep}>
      <div className={styles.stepHeader}>
        <span className={styles.stepNumber}>{stepNumber}</span>
        <h2 className={styles.stepTitle}>{title}</h2>
      </div>
      <p className={styles.stepContent}>{content}</p>
      {note && (
        <div className={styles.noteBox}>
          <div className={styles.noteTitle}>{note.title}</div>
          <ul className={styles.noteList}>
            {note.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      <div className={styles.imageWrapper}>
        <Image 
          src={image} 
          alt={imageAlt} 
          className={styles.guideImage}
          placeholder="blur"
        />
      </div>
    </div>
  )
}

/**
 * 浏览器插件图文教学页面
 */
export default function PluginGuidePage() {
  const { t } = useTransClient('pluginGuide')

  return (
    <div className={styles.pluginGuidePage}>
      <main className={styles.main}>
        <div className={styles.container}>
          {/* 页面标题 */}
          <div className={styles.pageHeader}>
            <h1 className={styles.title}>{t('title')}</h1>
            <p className={styles.lastUpdated}>{t('lastUpdated')}: 2024-12-15</p>
          </div>

          {/* 简介 */}
          <div className={styles.introduction}>
            <p>{t('introduction')}</p>
          </div>

          {/* 教程步骤 */}
          <div className={styles.stepsContainer}>
            {/* 第一步 */}
            <GuideStep
              stepNumber={1}
              title={t('steps.step1.title')}
              content={t('steps.step1.content')}
              image={image1}
              imageAlt={t('steps.step1.title')}
            />

            {/* 第二步 */}
            <GuideStep
              stepNumber={2}
              title={t('steps.step2.title')}
              content={t('steps.step2.content')}
              image={image2}
              imageAlt={t('steps.step2.title')}
              note={{
                title: t('steps.step2.note'),
                items: [
                  t('steps.step2.noteItem1'),
                  t('steps.step2.noteItem2'),
                ],
              }}
            />

            {/* 第三步 */}
            <GuideStep
              stepNumber={3}
              title={t('steps.step3.title')}
              content={t('steps.step3.content')}
              image={image4}
              imageAlt={t('steps.step3.title')}
            />

            {/* 第四步 */}
            <GuideStep
              stepNumber={4}
              title={t('steps.step4.title')}
              content={t('steps.step4.content')}
              image={image5}
              imageAlt={t('steps.step4.title')}
            />

            {/* 第五步 */}
            <GuideStep
              stepNumber={5}
              title={t('steps.step5.title')}
              content={t('steps.step5.content')}
              image={image6}
              imageAlt={t('steps.step5.title')}
            />

            {/* 第六步 */}
            <GuideStep
              stepNumber={6}
              title={t('steps.step6.title')}
              content={t('steps.step6.content')}
              image={image7}
              imageAlt={t('steps.step6.title')}
            />

            {/* 第七步 */}
            <GuideStep
              stepNumber={7}
              title={t('steps.step7.title')}
              content={t('steps.step7.content')}
              image={image8}
              imageAlt={t('steps.step7.title')}
            />

            {/* 第八步 */}
            <GuideStep
              stepNumber={8}
              title={t('steps.step8.title')}
              content={t('steps.step8.content')}
              image={image9}
              imageAlt={t('steps.step8.title')}
            />

            {/* 完成 */}
            <div className={styles.completeSection}>
              <div className={styles.completeIcon}>🎉</div>
              <h2 className={styles.completeTitle}>{t('steps.complete.title')}</h2>
              <p className={styles.completeContent}>{t('steps.complete.content')}</p>
            </div>
          </div>

          {/* FAQ 部分 */}
          <div className={styles.faqSection}>
            <h2 className={styles.faqTitle}>{t('faq.title')}</h2>
            <div className={styles.faqItem}>
              <div className={styles.faqQuestion}>
                <span className={styles.questionIcon}>Q</span>
                <span>{t('faq.q1.question')}</span>
              </div>
              <div className={styles.faqAnswer}>
                <span className={styles.answerIcon}>A</span>
                <span>{t('faq.q1.answer')}</span>
              </div>
              <div className={styles.imageWrapper}>
                <Image 
                  src={image10} 
                  alt={t('faq.q1.question')} 
                  className={styles.guideImage}
                  placeholder="blur"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
