"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./styles/difyHome.module.scss";
import { directTrans, useTransClient } from "../i18n/client";
import { MAIN_APP_DOWNLOAD_URL, getMainAppDownloadUrl } from "../config/appDownloadConfig";

import logo from '@/assets/images/logo.png';

// 导入SVG图标
import gongzhonghao from '@/assets/images/gongzhonghao.jpg';
import bilibiliIcon from '@/assets/svgs/plat/bilibili.svg';
import douyinIcon from '@/assets/svgs/plat/douyin.svg';
import tiktokIcon from '@/assets/svgs/plat/tiktok.svg';
import ksIcon from '@/assets/svgs/plat/ks.svg';
import wxSphIcon from '@/assets/svgs/plat/wx-sph.svg';
import gongzhonghaoIcon from '@/assets/svgs/plat/gongzhonghao.png';
import xhsIcon from '@/assets/svgs/plat/xhs.svg';
import youtubeIcon from '@/assets/svgs/plat/youtube.png';
import TwitterIcon from '@/assets/svgs/plat/twitter.png';
import FacebookIcon from '@/assets/svgs/plat/facebook.png';
import InstagramIcon from '@/assets/svgs/plat/instagram.png';
import LinkedInIcon from '@/assets/svgs/plat/linkedin.png';
import PinterestIcon from '@/assets/svgs/plat/pinterest.png';
import ThreadsIcon from '@/assets/svgs/plat/threads.png';

// 资料图片
import publish1 from '@/assets/images/publish1.png';


// 外部图片 URL 常量
const IMAGE_URLS = {
  calendar: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/1.%20content%20publish/calendar.jpeg',
  supportChannels: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/1.%20content%20publish/support_channels.jpeg',
  hotspot: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/2.%20content%20hotspot/hotspot.jpg',
  hotspot2: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/2.%20content%20hotspot/hotspot2.jpeg',
  hotspot3: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/2.%20content%20hotspot/hotspot3.jpeg',
  hotspot4: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/2.%20content%20hotspot/hotspot4.jpeg',
  contentSearch: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/3.%20content%20search/contentsearch.gif',
  contentSearch1: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/3.%20content%20search/contentsearch1.jpeg',
  contentSearch2: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/3.%20content%20search/contentsearch2.jpeg',
  contentSearch4: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/3.%20content%20search/contentsearch4.jpeg',
  commentFilter: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/4.%20comments%20search/commentfilter.jpeg',
  commentFilter2: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/app-screenshot/5.%20content%20engagement/commentfilter2.jpeg',
};


import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import { useUserStore } from "@/store/user";
import { useParams } from "next/navigation";
import { AndroidOutlined } from '@ant-design/icons';

// 版本发布横幅
function ReleaseBanner() {
  const { t } = useTransClient('home');

  return (
    <div className={styles.releaseBanner}>
      <div className={styles.bannerContent}>
        {/* <span className={styles.releaseTag}>{t('releaseBanner.tag')}</span> */}
        <span className={styles.releaseText}>{t('releaseBanner.text')}</span>
        <svg className={styles.arrowIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="m6 12 4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}


// Hero 主标题区
function Hero() {
  const { t } = useTransClient('home');
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [hideCursor, setHideCursor] = useState(false);
  const [startTyping, setStartTyping] = useState(false);
  const router = useRouter();

  // 要显示的完整文本
  const fullText = t('hero.title');
  const typingSpeed = 120; // 打字速度（毫秒）
  const initialDelay = 800; // 初始延迟（毫秒）
  const cursorHideDelay = 2000; // 打字完成后光标消失的延迟

  useEffect(() => {
    // 初始延迟后开始打字
    const startTimer = setTimeout(() => {
      setStartTyping(true);
    }, initialDelay);

    return () => clearTimeout(startTimer);
  }, []);

  useEffect(() => {
    if (startTyping && currentIndex < fullText.length) {
      const currentChar = fullText[currentIndex];

      // 根据字符类型调整打字速度
      let currentSpeed = typingSpeed;
      if (currentChar === '\n') {
        currentSpeed = typingSpeed * 2; // 换行时稍作停顿
      } else if (currentChar === ' ') {
        currentSpeed = typingSpeed * 0.5; // 空格快一点
      } else if (/[，。！？；：]/.test(currentChar)) {
        currentSpeed = typingSpeed * 1.5; // 标点符号稍作停顿
      } else {
        // 添加一些随机性，使打字更自然
        currentSpeed = typingSpeed + Math.random() * 50 - 25;
      }

      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + fullText[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, currentSpeed);

      return () => clearTimeout(timer);
    } else if (currentIndex >= fullText.length && !isTypingComplete) {
      setIsTypingComplete(true);
      // 打字完成后延迟隐藏光标
      setTimeout(() => {
        setHideCursor(true);
      }, cursorHideDelay);
    }
  }, [startTyping, currentIndex, fullText, typingSpeed, isTypingComplete, cursorHideDelay]);

  // 将文本转换为JSX，处理换行
  const renderText = () => {
    return displayedText.split('\n').map((line, index, array) => (
      <span key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </span>
    ));
  };

  return (
    <section className={styles.hero}>
      <div className={styles.heroContainer}>
        <div className={styles.githubStars} onClick={() => {
          window.open('https://github.com/yikart/AiToEarn/releases', '_blank');
        }}>
          <img src={'https://img.shields.io/github/stars/yikart/AiToEarn.svg'} alt="logo" className={styles.logo} />
          <span className={styles.starText}>{t('hero.starsText')}</span>
          <span className={styles.githubText}>{t('hero.github')}</span>
        </div>

        <h1 className={styles.heroTitle}>
          {renderText()}
          <span className={`${styles.cursor} ${hideCursor ? styles.cursorHidden : styles.cursorVisible}`}>|</span>
        </h1>

        <p className={styles.heroSubtitle}>
          {t('hero.subtitle')}
        </p>

        <button onClick={() => {
          router.push("/accounts");
        }} className={styles.heroBtn}>
          {t('hero.getStarted')}
          <svg className={styles.btnArrow} width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="m6 12 4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <p
          className={styles.heroMobileLink}
          style={{ marginTop: '10px' }}
          onClick={() => {
            const el = document.getElementById('download');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          {t('hero.useMobilePhone' as any)}
        </p>
      </div>
    </section>
  );
}

// 品牌合作伙伴 Logo 区 - 社交媒体平台（无限滚动）
function BrandBar() {
  const { t } = useTransClient('home');
  const { lng } = useParams();

  // 平台数据配置
  const platforms = [
    { name: 'YouTube', key: 'YouTube', hasIcon: true, iconPath: youtubeIcon.src },
    { name: 'TikTok', key: 'TikTok', hasIcon: true, iconPath: tiktokIcon },
    { name: '小红书', key: 'Rednote', hasIcon: true, iconPath: xhsIcon },
    { name: '抖音', key: 'Douyin', hasIcon: true, iconPath: douyinIcon },
    { name: '快手', key: 'Kwai', hasIcon: true, iconPath: ksIcon },
    { name: '公众号', key: 'Wechat Offical Account', hasIcon: true, iconPath: gongzhonghaoIcon.src },
    { name: '视频号', key: 'Wechat Channels', hasIcon: true, iconPath: wxSphIcon },
    { name: 'Bilibili', key: 'Bilibili', hasIcon: true, iconPath: bilibiliIcon },
    { name: 'Facebook', key: 'Facebook', hasIcon: true, iconPath: FacebookIcon.src },
    { name: 'Instagram', key: 'Instagram', hasIcon: true, iconPath: InstagramIcon.src },
    { name: 'LinkedIn', key: 'LinkedIn', hasIcon: true, iconPath: LinkedInIcon.src },
    { name: 'Pinterest', key: 'Pinterest', hasIcon: true, iconPath: PinterestIcon.src },
    { name: 'Threads', key: 'Threads', hasIcon: true, iconPath: ThreadsIcon.src },
    { name: 'X (Twitter)', key: 'X (Twitter)', hasIcon: true, iconPath: TwitterIcon.src },
  ];

  // 为了实现无缝滚动，复制一份数据
  const duplicatedPlatforms = [...platforms, ...platforms];

  // 获取平台显示名称
  const getPlatformDisplayName = (platform: any) => {
    if (lng === 'en') {
      return platform.key;
    }
    return platform.name;
  };

  return (
    <section className={styles.brandBar}>
      <div className={styles.brandContainer}>
        <div className={styles.brandTitle}>{t('brandBar.title')}</div>
        <div className={styles.scrollContainer}>
          <div className={styles.scrollTrack}>
            {duplicatedPlatforms.map((platform, index) => (
              <div key={index} className={styles.platformItem}>
                <div className={styles.platformIcon}>
                  {platform.hasIcon ? (
                    <img
                      src={platform.iconPath}
                      alt={`${getPlatformDisplayName(platform)} logo`}
                      className={styles.platformSvg}
                    />
                  ) : (
                    <span className={styles.platformEmoji}>{getPlatformDisplayName(platform)}</span>
                  )}
                </div>
                <span className={styles.platformName}>{getPlatformDisplayName(platform)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// 1. Content Publishing — 一键发布 · 多平台触达
function ContentPublishingSection() {
  const { t } = useTransClient('home');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const images = [IMAGE_URLS.calendar, IMAGE_URLS.supportChannels];
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // 自动轮播
  useEffect(() => {
    if (autoRotate) {
      autoRotateRef.current = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % images.length);
      }, 3000);
    } else {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current);
        autoRotateRef.current = null;
      }
    }

    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current);
      }
    };
  }, [autoRotate, images.length]);

  // 滚轮控制
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (carouselRef.current && carouselRef.current.contains(e.target as Node)) {
        e.preventDefault();

        if (e.deltaY > 0) {
          if (currentImageIndex < images.length - 1) {
            setCurrentImageIndex(prev => prev + 1);
            setAutoRotate(false);
          } else {
            setAutoRotate(true);
            return;
          }
        } else {
          if (currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1);
            setAutoRotate(false);
          }
        }

        setTimeout(() => {
          setAutoRotate(true);
        }, 3000);
      }
    };

    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        carousel.removeEventListener('wheel', handleWheel);
      };
    }
  }, [currentImageIndex, images.length]);

  return (
    <section className={styles.buildSection}>
      <div className={styles.buildContainer}>
        <div className={styles.sectionBadge}>
          <div className={styles.badgeIcon}></div>
          <span>{t('buildSection.badge')}</span>
        </div>

        <div className={styles.buildContent}>
          <div className={styles.buildLeft}>
            <h2 className={styles.buildTitle}>
              {t('buildSection.title')}
              <span className={styles.titleBlue}>{t('buildSection.titleBlue')}</span>
            </h2>

                         <div className={styles.featureList}>
               <div className={styles.featureItem}>
                 <h3>{t('buildSection.features.hotTopic.title')}</h3>
                 <p>{t('buildSection.features.hotTopic.description')}</p>
               </div>

               <div className={styles.featureItem}>
                 <h3>{t('buildSection.features.international.title')}</h3>
                 <p>{t('buildSection.features.international.description')}</p>
               </div>
             </div>
           </div>

           <div className={styles.buildRight}>
             <div
               className={styles.imageCarousel}
               ref={carouselRef}
             >
               <div className={`${styles.carouselContainer} ${styles.mobileContainer}`}>
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`${styles.carouselSlide} ${index === currentImageIndex ? styles.active : ''}`}
                  >
                                         <img
                       src={image}
                       alt={`Content Publishing ${index + 1}`}
                       className={styles.mobileCarouselImage}
                     />
                  </div>
                ))}
              </div>

              <div className={styles.carouselIndicators}>
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.indicator} ${index === currentImageIndex ? styles.active : ''}`}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setAutoRotate(false);
                      setTimeout(() => setAutoRotate(true), 3000);
                    }}
                  />
                ))}
              </div>

              <div className={styles.carouselHint}>
                <span>使用滚轮切换图片</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 2. Content Hotspot — 爆款灵感引擎
function ContentHotspotSection() {
  const { t } = useTransClient('home');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const images = [IMAGE_URLS.hotspot, IMAGE_URLS.hotspot2, IMAGE_URLS.hotspot3, IMAGE_URLS.hotspot4];
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // 自动轮播
  useEffect(() => {
    if (autoRotate) {
      autoRotateRef.current = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % images.length);
      }, 3000);
    } else {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current);
        autoRotateRef.current = null;
      }
    }

    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current);
      }
    };
  }, [autoRotate, images.length]);

  // 滚轮控制
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (carouselRef.current && carouselRef.current.contains(e.target as Node)) {
        e.preventDefault();

        if (e.deltaY > 0) {
          if (currentImageIndex < images.length - 1) {
            setCurrentImageIndex(prev => prev + 1);
            setAutoRotate(false);
          } else {
            setAutoRotate(true);
            return;
          }
        } else {
          if (currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1);
            setAutoRotate(false);
          }
        }

        setTimeout(() => {
          setAutoRotate(true);
        }, 3000);
      }
    };

    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        carousel.removeEventListener('wheel', handleWheel);
      };
    }
  }, [currentImageIndex, images.length]);

  return (
    <section className={styles.buildSection}>
      <div className={styles.buildContainer}>
        <div className={styles.sectionBadge}>
          <div className={styles.badgeIcon}></div>
          <span>{t('hotspotSection.badge' as any)}</span>
        </div>

        <div className={styles.buildContent}>
          <div className={styles.buildLeft}>
            <h2 className={styles.buildTitle}>
              {t('hotspotSection.title' as any)}
              <span className={styles.titleBlue}>{t('hotspotSection.titleBlue' as any)}</span>
            </h2>

                         <div className={styles.featureList}>
               <div className={styles.featureItem}>
                 <h3>{t('hotspotSection.features.hotTopic.title' as any)}</h3>
                 <p>{t('hotspotSection.features.hotTopic.description' as any)}</p>
               </div>

               <div className={styles.featureItem}>
                 <h3>{t('hotspotSection.features.international.title' as any)}</h3>
                 <p>{t('hotspotSection.features.international.description' as any)}</p>
               </div>
             </div>
           </div>

           <div className={styles.buildRight}>
             <div
               className={styles.imageCarousel}
               ref={carouselRef}
             >
               <div className={`${styles.carouselContainer} ${styles.mobileContainer}`}>
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`${styles.carouselSlide} ${index === currentImageIndex ? styles.active : ''}`}
                  >
                                         <img
                       src={image}
                       alt={`Content Hotspot ${index + 1}`}
                       className={styles.mobileCarouselImage}
                     />
                  </div>
                ))}
              </div>

              <div className={styles.carouselIndicators}>
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.indicator} ${index === currentImageIndex ? styles.active : ''}`}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setAutoRotate(false);
                      setTimeout(() => setAutoRotate(true), 3000);
                    }}
                  />
                ))}
              </div>

              <div className={styles.carouselHint}>
                <span>使用滚轮切换图片</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 3. Content Search — 品牌与市场洞察
function ContentSearchSection() {
  const { t } = useTransClient('home');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const images = [IMAGE_URLS.contentSearch, IMAGE_URLS.contentSearch1, IMAGE_URLS.contentSearch2, IMAGE_URLS.contentSearch4];
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // 自动轮播
  useEffect(() => {
    if (autoRotate) {
      autoRotateRef.current = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % images.length);
      }, 3000);
    } else {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current);
        autoRotateRef.current = null;
      }
    }

    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current);
      }
    };
  }, [autoRotate, images.length]);

  // 滚轮控制
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (carouselRef.current && carouselRef.current.contains(e.target as Node)) {
        e.preventDefault();

        if (e.deltaY > 0) {
          if (currentImageIndex < images.length - 1) {
            setCurrentImageIndex(prev => prev + 1);
            setAutoRotate(false);
          } else {
            setAutoRotate(true);
            return;
          }
        } else {
          if (currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1);
            setAutoRotate(false);
          }
        }

        setTimeout(() => {
          setAutoRotate(true);
        }, 3000);
      }
    };

    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        carousel.removeEventListener('wheel', handleWheel);
      };
    }
  }, [currentImageIndex, images.length]);

  return (
    <section className={styles.buildSection}>
      <div className={styles.buildContainer}>
        <div className={styles.sectionBadge}>
          <div className={styles.badgeIcon}></div>
          <span>{t('searchSection.badge' as any)}</span>
        </div>

        <div className={styles.buildContent}>
          <div className={styles.buildLeft}>
            <h2 className={styles.buildTitle}>
              {t('searchSection.title' as any)}
              <span className={styles.titleBlue}>{t('searchSection.titleBlue' as any)}</span>
            </h2>

                         <div className={styles.featureList}>
               <div className={styles.featureItem}>
                 <h3>{t('searchSection.features.hotTopic.title' as any)}</h3>
                 <p>{t('searchSection.features.hotTopic.description' as any)}</p>
               </div>

               <div className={styles.featureItem}>
                 <h3>{t('searchSection.features.international.title' as any)}</h3>
                 <p>{t('searchSection.features.international.description' as any)}</p>
               </div>
             </div>
           </div>

           <div className={styles.buildRight}>
             <div
               className={styles.imageCarousel}
               ref={carouselRef}
             >
               <div className={`${styles.carouselContainer} ${styles.mobileContainer}`}>
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`${styles.carouselSlide} ${index === currentImageIndex ? styles.active : ''}`}
                  >
                                         <img
                       src={image}
                       alt={`Content Search ${index + 1}`}
                       className={styles.mobileCarouselImage}
                     />
                  </div>
                ))}
              </div>

              <div className={styles.carouselIndicators}>
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.indicator} ${index === currentImageIndex ? styles.active : ''}`}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setAutoRotate(false);
                      setTimeout(() => setAutoRotate(true), 3000);
                    }}
                  />
                ))}
              </div>

              <div className={styles.carouselHint}>
                <span>使用滚轮切换图片</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 4. Comments Search — 精准用户挖掘
function CommentsSearchSection() {
  const { t } = useTransClient('home');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const images = [IMAGE_URLS.commentFilter];
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // 自动轮播
  useEffect(() => {
    if (autoRotate) {
      autoRotateRef.current = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % images.length);
      }, 3000);
    } else {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current);
        autoRotateRef.current = null;
      }
    }

    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current);
      }
    };
  }, [autoRotate, images.length]);

  // 滚轮控制
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (carouselRef.current && carouselRef.current.contains(e.target as Node)) {
        e.preventDefault();

        if (e.deltaY > 0) {
          if (currentImageIndex < images.length - 1) {
            setCurrentImageIndex(prev => prev + 1);
            setAutoRotate(false);
          } else {
            setAutoRotate(true);
            return;
          }
        } else {
          if (currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1);
            setAutoRotate(false);
          }
        }

        setTimeout(() => {
          setAutoRotate(true);
        }, 3000);
      }
    };

    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        carousel.removeEventListener('wheel', handleWheel);
      };
    }
  }, [currentImageIndex, images.length]);

  return (
    <section className={styles.buildSection}>
      <div className={styles.buildContainer}>
        <div className={styles.sectionBadge}>
          <div className={styles.badgeIcon}></div>
          <span>{t('commentsSection.badge' as any)}</span>
        </div>

        <div className={styles.buildContent}>
          <div className={styles.buildLeft}>
            <h2 className={styles.buildTitle}>
              {t('commentsSection.title' as any)}
              <span className={styles.titleBlue}>{t('commentsSection.titleBlue' as any)}</span>
            </h2>

                         <div className={styles.featureList}>
               <div className={styles.featureItem}>
                 <h3>{t('commentsSection.features.hotTopic.title' as any)}</h3>
                 <p>{t('commentsSection.features.hotTopic.description' as any)}</p>
               </div>

               <div className={styles.featureItem}>
                 <h3>{t('commentsSection.features.international.title' as any)}</h3>
                 <p>{t('commentsSection.features.international.description' as any)}</p>
               </div>
             </div>
           </div>

           <div className={styles.buildRight}>
             <div
               className={styles.imageCarousel}
               ref={carouselRef}
             >
               <div className={`${styles.carouselContainer} ${styles.mobileContainer}`}>
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`${styles.carouselSlide} ${index === currentImageIndex ? styles.active : ''}`}
                  >
                                         <img
                       src={image}
                       alt={`Comments Search ${index + 1}`}
                       className={styles.mobileCarouselImage}
                     />
                  </div>
                ))}
              </div>

              <div className={styles.carouselIndicators}>
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.indicator} ${index === currentImageIndex ? styles.active : ''}`}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setAutoRotate(false);
                      setTimeout(() => setAutoRotate(true), 3000);
                    }}
                  />
                ))}
              </div>

              <div className={styles.carouselHint}>
                <span>使用滚轮切换图片</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 5. Content Engagement — 互动与增长引擎
function ContentEngagementSection() {
  const { t } = useTransClient('home');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const images = [IMAGE_URLS.commentFilter2];
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // 自动轮播
  useEffect(() => {
    if (autoRotate) {
      autoRotateRef.current = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % images.length);
      }, 3000);
    } else {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current);
        autoRotateRef.current = null;
      }
    }

    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current);
      }
    };
  }, [autoRotate, images.length]);

  // 滚轮控制
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (carouselRef.current && carouselRef.current.contains(e.target as Node)) {
        e.preventDefault();

        if (e.deltaY > 0) {
          if (currentImageIndex < images.length - 1) {
            setCurrentImageIndex(prev => prev + 1);
            setAutoRotate(false);
          } else {
            setAutoRotate(true);
            return;
          }
        } else {
          if (currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1);
            setAutoRotate(false);
          }
        }

        setTimeout(() => {
          setAutoRotate(true);
        }, 3000);
      }
    };

    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        carousel.removeEventListener('wheel', handleWheel);
      };
    }
  }, [currentImageIndex, images.length]);

  return (
    <section className={styles.buildSection}>
      <div className={styles.buildContainer}>
        <div className={styles.sectionBadge}>
          <div className={styles.badgeIcon}></div>
          <span>{t('connectSection.badge' as any)}</span>
        </div>

        <div className={styles.buildContent}>
          <div className={styles.buildLeft}>
            <h2 className={styles.buildTitle}>
              {t('connectSection.title' as any)}
              <span className={styles.titleBlue}>{t('connectSection.titleBlue' as any)}</span>
            </h2>

                         <div className={styles.featureList}>
               <div className={styles.featureItem}>
                 <h3>{t('connectSection.features.creation.title' as any)}</h3>
                 <p>{t('connectSection.features.creation.description' as any)}</p>
               </div>

               <div className={styles.featureItem}>
                 <h3>{t('connectSection.features.distribution.title' as any)}</h3>
                 <p>{t('connectSection.features.distribution.description' as any)}</p>
               </div>
             </div>
           </div>

           <div className={styles.buildRight}>
             <div
               className={styles.imageCarousel}
               ref={carouselRef}
             >
               <div className={`${styles.carouselContainer} ${styles.mobileContainer}`}>
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`${styles.carouselSlide} ${index === currentImageIndex ? styles.active : ''}`}
                  >
                                         <img
                       src={image}
                       alt={`Content Engagement ${index + 1}`}
                       className={styles.mobileCarouselImage}
                     />
                  </div>
                ))}
              </div>

              <div className={styles.carouselIndicators}>
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.indicator} ${index === currentImageIndex ? styles.active : ''}`}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setAutoRotate(false);
                      setTimeout(() => setAutoRotate(true), 3000);
                    }}
                  />
                ))}
              </div>

              <div className={styles.carouselHint}>
                <span>使用滚轮切换图片</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 6-8. 即将上线功能整合模块
function UpcomingFeaturesSection() {
  const { t } = useTransClient('home');

  return (
    <section className={styles.buildSection}>
      <div className={styles.buildContainer}>
        <div className={styles.sectionBadge}>
          <div className={styles.badgeIcon}></div>
          <span>{t('upcomingSection.badge' as any)}</span>
        </div>

        <div className={styles.buildContent}>
          <div className={styles.buildLeft}>
            <h2 className={styles.buildTitle}>
              {t('upcomingSection.title' as any)}
              <span className={styles.titleBlue}>{t('upcomingSection.titleBlue' as any)}</span>
            </h2>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <h3>{t('upcomingSection.features.smartImport.title' as any)}</h3>
                <p>{t('upcomingSection.features.smartImport.description' as any)}</p>
              </div>

              <div className={styles.featureItem}>
                <h3>{t('upcomingSection.features.analytics.title' as any)}</h3>
                <p>{t('upcomingSection.features.analytics.description' as any)}</p>
              </div>

              <div className={styles.featureItem}>
                <h3>{t('upcomingSection.features.aiCreation.title' as any)}</h3>
                <p>{t('upcomingSection.features.aiCreation.description' as any)}</p>
              </div>

              <div className={styles.featureItem}>
                <h3>{t('upcomingSection.features.marketplace.title' as any)}</h3>
                <p>{t('upcomingSection.features.marketplace.description' as any)}</p>
              </div>
            </div>
          </div>

          <div className={styles.buildRight} style={{ minHeight: '500px' }}>
            <div className={styles.imageCarousel}>
              <div className={styles.carouselContainer}>
                                 <div className={`${styles.carouselSlide} ${styles.active}`}>
                   <video
                     src={'https://aitoearn.s3.ap-southeast-1.amazonaws.com/production/temp/uploads/890044ad-c3a3-4a4c-8981-0eb72abff538.mp4'}
                     controls
                     className={styles.desktopCarouselImage}
                     style={{ borderRadius: '16px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)' }}
                   />
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 移动应用下载区
import { QRCode } from 'react-qrcode-logo';
import HomeHeader from "@/app/layout/HomeHeader";
function DownloadSection() {
  const { t } = useTransClient('home');

  return (
    <section className={styles.downloadSection} id="download">
      <div className={styles.downloadContainer}>
        <div className={styles.downloadContent}>
          <div className={styles.downloadLeft}>
            <h2 className={styles.downloadTitle}>
              {t('downloadSection.title')}<br />
              <span className={styles.titleBlue}>{t('downloadSection.titleBlue')}</span>
            </h2>

            <p className={styles.downloadDescription}>
              {t('downloadSection.description')}
            </p>

            <div className={styles.downloadButtons}>
              <a href={getMainAppDownloadUrl()} className={styles.downloadBtn} target="_blank" rel="noopener noreferrer">
                <div className={styles.downloadBtnContent}>
                  <AndroidOutlined className={styles.downloadIcon} style={{ fontSize: '24px' }} />
                  <div className={styles.downloadBtnText}>
                    <span className={styles.downloadOn}>立即下载</span>
                    <span className={styles.downloadStore}>Android APK</span>
                  </div>
                </div>
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.yika.aitoearn.aitoearn_app" className={styles.downloadBtn} target="_blank" rel="noopener noreferrer">
                <div className={styles.downloadBtnContent}>
                  <AndroidOutlined className={styles.downloadIcon} style={{ fontSize: '24px' }} />
                  <div className={styles.downloadBtnText}>
                    <span className={styles.downloadOn}>Get it on</span>
                    <span className={styles.downloadStore}>Google Play</span>
                  </div>
                </div>
              </a>
            </div>
          </div>

          <div className={styles.downloadRight}>
            <div className={styles.phoneContainer}>

            <div className={styles.qrCode}>
                {/* <div className={styles.qrCodeImage}> */}
                  <QRCode
                    value={getMainAppDownloadUrl()}
                    size={120}
                  />
                {/* </div> */}
                <p className={styles.qrCodeText}>{t('downloadSection.qrCodeText' as any)}</p>
              </div>


              <div className={styles.phoneFrame}>
                <div className={styles.phoneScreen}>
                  <div className={styles.phoneStatusBar}>
                    <span className={styles.phoneTime}>9:41</span>
                    <div className={styles.phoneSignals}>
                      <div className={styles.phoneSignal}></div>
                      <div className={styles.phoneBattery}></div>
                    </div>
                  </div>

                  <div className={styles.phoneContent}>
                    <div className={styles.phoneHeader}>
                      <h3>Create</h3>
                      <span className={styles.phoneCounter}>280</span>
                    </div>

                    <div className={styles.phoneVideoCard}>
                      <span className={styles.phoneVideoTitle}>Example video</span>
                      <div className={styles.phoneVideoPreview}>
                        <img src={publish1.src} alt="Video preview" className={styles.phoneVideoImg} />
                      </div>
                      <div className={styles.phoneVideoMeta}>
                        <span>Consumer</span>
                        <span>⌚ 15</span>
                      </div>
                    </div>

                    <div className={styles.phoneCreatePrompt}>
                      <div className={styles.phoneAddBtn}>+</div>
                      <span>What do you want to create?</span>
                    </div>
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



// Enterprise 区块
function EnterpriseSection() {
  const { t } = useTransClient('home');

  return (
    <section className={styles.enterpriseSection}>
      <div className={styles.enterpriseContainer}>
        <div className={styles.sectionBadge}>
          <div className={styles.badgeIcon}></div>
          <span>{t('enterpriseSection.badge')}</span>
        </div>

        <h2 className={styles.enterpriseTitle}>
          {t('enterpriseSection.title')}<br />
          <span className={styles.titleBlue}>{t('enterpriseSection.titleBlue')}</span>
        </h2>

        <p className={styles.enterpriseSubtitle}>
          {t('enterpriseSection.subtitle')}
        </p>
      </div>
    </section>
  );
}

// 数据统计区
function StatsSection() {
  const { t } = useTransClient('home');

  return (
    <section className={styles.statsSection}>
      <div className={styles.statsContainer}>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>{t('statsSection.stats.users.number')}</div>
            <div className={styles.statLabel}>{t('statsSection.stats.users.label')}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>{t('statsSection.stats.platforms.number')}</div>
            <div className={styles.statLabel}>{t('statsSection.stats.platforms.label')}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>{t('statsSection.stats.countries.number')}</div>
            <div className={styles.statLabel}>{t('statsSection.stats.countries.label')}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>{t('statsSection.stats.content.number')}</div>
            <div className={styles.statLabel}>{t('statsSection.stats.content.label')}</div>
          </div>
        </div>

        <div className={styles.testimonialCard}>
          <div className={styles.testimonialContent}>
            <p>"{t('statsSection.testimonial.quote')}"</p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorName}>{t('statsSection.testimonial.author')}</div>
              <div className={styles.authorTitle}>{t('statsSection.testimonial.title')}</div>
            </div>
          </div>
        </div>

        <div className={styles.caseStudies}>
          <div className={styles.caseStudy}>
            <div className={styles.caseTitle}>{t('statsSection.caseStudies.timeSaved.title')}</div>
            <div className={styles.caseNumber}>{t('statsSection.caseStudies.timeSaved.number')}</div>
          </div>
          <div className={styles.caseStudy}>
            <div className={styles.caseTitle}>{t('statsSection.caseStudies.aiAssistant.title')}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 社区区块
function CommunitySection() {
  const { t } = useTransClient('home');
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  return (
    <section className={styles.communitySection}>
      <div className={styles.communityContainer}>
        <div className={styles.sectionBadge}>
          <div className={styles.badgeIcon}></div>
          <span>{t('communitySection.badge')}</span>
        </div>

        <h2 className={styles.communityTitle}>
          {t('communitySection.title')}<br />
          <span className={styles.titleBlue}>{t('communitySection.titleBlue')}</span>
        </h2>

        <p className={styles.communitySubtitle}>
          {t('communitySection.subtitle')}
        </p>

        <div className={styles.communityButtons}>
          <div className={styles.buttonWrapper}>
            <button
              className={styles.githubBtn}
              onMouseEnter={() => setHoveredButton('wechat')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              {t('communitySection.buttons.wechat')}
              <svg className={styles.btnArrow} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="m6 12 4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {hoveredButton === 'wechat' && (
              <div className={styles.qrCodePopup}>
                <Image src={gongzhonghao} alt="微信公众号" width={200} height={200} className={styles.qrCodeImage} />
                <p className={styles.qrCodeText}>{t('communitySection.wechatPopup' as any)}</p>
              </div>
            )}
          </div>

          <div className={styles.buttonWrapper}>
            <button
              className={styles.discordBtn}
              onMouseEnter={() => setHoveredButton('community')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              {t('communitySection.buttons.community')}
              <svg className={styles.btnArrow} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="m6 12 4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {hoveredButton === 'community' && (
              <div className={styles.qrCodePopup}>
                <Image src={gongzhonghao} alt="社区公众号" width={200} height={200} className={styles.qrCodeImage} />
                <p className={styles.qrCodeText}>{t('communitySection.communityPopup' as any)}</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.communityStats}>
          <div className={styles.communityStat}>
            <div className={styles.statNumber}>{t('communitySection.stats.downloads.number')}</div>
            <div className={styles.statLabel}>{t('communitySection.stats.downloads.label')}</div>
          </div>
          <div className={styles.communityStat}>
            <div className={styles.statNumber}>{t('communitySection.stats.members.number')}</div>
            <div className={styles.statLabel}>{t('communitySection.stats.members.label')}</div>
          </div>
          <div className={styles.communityStat}>
            <div className={styles.statNumber}>{t('communitySection.stats.creators.number')}</div>
            <div className={styles.statLabel}>{t('communitySection.stats.creators.label')}</div>
          </div>
        </div>

        <div className={styles.tweets}>
          {/* 用户分享卡片区域 */}
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  const { t } = useTransClient('home');
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  // 背景图片数组
  const backgroundImages = [
    IMAGE_URLS.hotspot,
    IMAGE_URLS.hotspot2,
    IMAGE_URLS.hotspot3,
    IMAGE_URLS.hotspot4,
  ];

  useEffect(() => {
    if (isHovered) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % backgroundImages.length);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCurrentImageIndex(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHovered, backgroundImages.length]);

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* 上半部分：Resources 和 Company */}
        <div className={styles.footerTop}>
          <div className={styles.footerColumns}>
            {/* <div className={styles.footerColumn}>
              <h4>{t('footer.resources.title')}</h4>
              <a href="#docs">{t('footer.resources.links.docs')}</a>
              <a href="#blog">{t('footer.resources.links.blog')}</a>
              <a href="#education">{t('footer.resources.links.education')}</a>
              <a href="#partner">{t('footer.resources.links.partner')}</a>
              <a href="#support">{t('footer.resources.links.support')}</a>
              <a href="#roadmap">{t('footer.resources.links.roadmap')}</a>
            </div> */}

            <div className={styles.footerColumn}>
              <h4>{t('footer.company.title')}</h4>
              <a onClick={() => {
                router.push("/websit/terms-of-service");
              }}>{t('footer.company.links.terms')}</a>
              <a onClick={() => {
                router.push("/websit/privacy-policy");
              }}>{t('footer.company.links.privacy')}</a>
              <a onClick={() => {
                router.push("/websit/data-deletion");
              }}>{t('footer.company.links.data')}</a>
            </div>
          </div>

          <div className={styles.footerInfo}>
            <div className={styles.footerText}>
              {t('footer.description')}
            </div>

            {/* <div className={styles.socialLinks}>
              <a href="#github">{t('footer.social.github')}</a>
              <a href="#discord">{t('footer.social.discord')}</a>
              <a href="#youtube">{t('footer.social.youtube')}</a>
              <a href="#linkedin">{t('footer.social.linkedin')}</a>
              <a href="#twitter">{t('footer.social.twitter')}</a>
            </div> */}
          </div>
        </div>

        {/* 下半部分：imagine if */}
        <div className={styles.footerBottom}>
          <div
            className={styles.bigText}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {t('footer.bigText')}
            <span
              className={styles.ifText}
              style={{
                marginLeft: '80px',
                backgroundImage: isHovered ? `url(${backgroundImages[currentImageIndex]})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: isHovered ? 'transparent' : '#733DEC',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}
            >
              Earn
            </span>
          </div>

          <div className={styles.footerCopyright}>
            <div className={styles.copyright}>{t('footer.copyright')}</div>
            <div className={styles.tagline}>{t('footer.tagline')}</div>
          </div>

          {/* <div className={styles.dataDeletionDoc}>
            <h1>{t('footer.dataDeletion.title')}</h1>

            <p><strong>Last Updated:</strong> 2025.6.27</p>

            <h2>For Pre-Launch Users:</h2>
            <p>{t('footer.dataDeletion.prelaunch')}</p>

            <h2>{t('footer.dataDeletion.standardTitle')}</h2>
            <ol>
                <li>{t('footer.dataDeletion.standardSteps.0')}</li>
                <li>{t('footer.dataDeletion.standardSteps.1')}</li>
                <li>{t('footer.dataDeletion.standardSteps.2')}</li>
                <li>{t('footer.dataDeletion.standardSteps.3')}</li>
            </ol>

            <h2>{t('footer.dataDeletion.contactTitle')}</h2>
            <p>{t('footer.dataDeletion.contactEmail')}</p>
          </div> */}
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className={styles.difyHome}>
      {/* <ReleaseBanner /> */}
      <Hero />
      <BrandBar />
      <ContentPublishingSection />
      <ContentHotspotSection />
      <ContentSearchSection />
      <CommentsSearchSection />
      <ContentEngagementSection />
      <UpcomingFeaturesSection />
      <DownloadSection />
      {/*<EnterpriseSection />
      <StatsSection /> */}
      {/* <CommunitySection /> */}
      <Footer />
    </div>
  );
}
