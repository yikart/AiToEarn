"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./styles/difyHome.module.scss";
import { useTransClient } from "../i18n/client";

// 导入SVG图标
import bilibiliIcon from '@/assets/svgs/plat/bilibili.svg';
import douyinIcon from '@/assets/svgs/plat/douyin.svg';
import ksIcon from '@/assets/svgs/plat/ks.svg';
import wxSphIcon from '@/assets/svgs/plat/wx-sph.svg';
import xhsIcon from '@/assets/svgs/plat/xhs.svg';
import youtubeIcon from '@/assets/svgs/plat/youtube.svg';
import TwitterIcon from '@/assets/svgs/plat/twtter.svg';
import FacebookIcon from '@/assets/svgs/plat/facebook.svg';
import InstagramIcon from '@/assets/svgs/plat/instagram.svg';
import LinkedInIcon from '@/assets/svgs/plat/linkedin.svg';
import PinterestIcon from '@/assets/svgs/plat/pinterest.svg';
import ThreadsIcon from '@/assets/svgs/plat/xiancheng.svg';

import logo from '@/assets/images/logo.png';
import hotjietu1 from '@/assets/images/hotjietu1.png';
import hotjietu2 from '@/assets/images/hotjietu2.png';
import hotjietu3 from '@/assets/images/hotjietu3.png';
import publish1 from '@/assets/images/publish1.png';
import gongzhonghao from '@/assets/images/gongzhonghao.jpg';

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import { useUserStore } from "@/store/user"; 

// 版本发布横幅
function ReleaseBanner() {
  const { t } = useTransClient('home');
  
  return (
    <div className={styles.releaseBanner}>
      <div className={styles.bannerContent}>
        <span className={styles.releaseTag}>{t('releaseBanner.tag')}</span>
        <span className={styles.releaseText}>{t('releaseBanner.text')}</span>
        <svg className={styles.arrowIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="m6 12 4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

// Header 顶部导航
function Header() {
  const { t } = useTransClient('home');
  const router = useRouter();
  const userStore = useUserStore();

  const userInfo = useUserStore((state) => state.userInfo)!;
  const toggleLanguage = () => {
    const newLng = userStore.lang === "zh-CN" ? "en" : "zh-CN";
    userStore.setLang(newLng);
    router.push(
      `/${newLng}${location.pathname.replace(`/${userStore.lang}`, "")}`,
    );
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
      <Link href="/">
        <div className={styles.logo}>
          <Image src={logo} alt="logo" width={50} />
          <span className={styles.logoText}>{t('header.logo')}</span>
        </div>
        </Link>
        <nav className={styles.nav}>
          <a href="#marketplace" className={styles.navLink}>{t('header.nav.marketplace')}</a>
          <a href="#pricing" className={styles.navLink}>{t('header.nav.pricing')}</a>
          <a href="#docs" className={styles.navLink}>{t('header.nav.docs')}</a>
          <a href="#blog" className={styles.navLink}>{t('header.nav.blog')}</a>
        </nav>

        <div className={styles.headerRight}>
        <Button
              type="text"
              icon={<GlobalOutlined />}
              onClick={toggleLanguage}
              className={styles.languageButton}
            >
              {userStore.lang === "zh-CN" ? "EN" : "中文"}
            </Button>

            <button onClick={() => {
              router.push("/accounts");
            }} className={styles.getStartedBtn}>
              {t('header.getStarted')}
            </button>
        </div>
        
      </div>
    </header>
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
          window.open('https://github.com/yikart/AiToEarn/releases/tag/v0.8.0', '_blank');
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
      </div>
    </section>
  );
}

// 品牌合作伙伴 Logo 区 - 社交媒体平台（无限滚动）
function BrandBar() {
  const { t } = useTransClient('home');
  
  // 平台数据配置
  const platforms = [
    { name: 'YouTube', hasIcon: true, iconPath: youtubeIcon.src },
    { name: 'Rednote', hasIcon: true, iconPath: xhsIcon.src },
    { name: '抖音(TikTok)', hasIcon: true, iconPath: douyinIcon.src },
    { name: '快手', hasIcon: true, iconPath: ksIcon.src },
    { name: '视频号', hasIcon: true, iconPath: wxSphIcon.src },
    { name: 'bilibili', hasIcon: true, iconPath: bilibiliIcon.src },
    { name: 'Facebook', hasIcon: true, iconPath: FacebookIcon.src },
    { name: 'Instagram', hasIcon: true, iconPath: InstagramIcon.src },
    { name: 'LinkedIn', hasIcon: true, iconPath: LinkedInIcon.src },
    { name: 'Pinterest', hasIcon: true, iconPath: PinterestIcon.src },
    { name: 'Threads', hasIcon: true, iconPath: ThreadsIcon.src },
    { name: 'X (Twitter)', hasIcon: true, iconPath: TwitterIcon.src },
  ];

  // 为了实现无缝滚动，复制一份数据
  const duplicatedPlatforms = [...platforms, ...platforms];

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
                      alt={`${platform.name} logo`}
                      className={styles.platformSvg}
                    />
                  ) : (
                    <span className={styles.platformEmoji}>{platform.name}</span>
                  )}
                </div>
                <span className={styles.platformName}>{platform.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// 灵感创意
function BuildSection() {
  const { t } = useTransClient('home');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const images = [hotjietu1.src, hotjietu2.src, hotjietu3.src];
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
      // 检查是否在轮播区域内
      if (carouselRef.current && carouselRef.current.contains(e.target as Node)) {
        e.preventDefault();
        
        if (e.deltaY > 0) {
          // 向下滚动
          if (currentImageIndex < images.length - 1) {
            setCurrentImageIndex(prev => prev + 1);
            setAutoRotate(false); // 用户操作时暂停自动轮播
          } else {
            // 到达最后一张图，恢复页面滚动
            setAutoRotate(true);
            return;
          }
        } else {
          // 向上滚动
          if (currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1);
            setAutoRotate(false);
          }
        }
        
        // 3秒后恢复自动轮播
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
              
              <div className={styles.featureItem}>
                <h3>{t('buildSection.features.domestic.title')}</h3>
                <p>{t('buildSection.features.domestic.description')}</p>
              </div>
            </div>
          </div>
          
          <div className={styles.buildRight}>
            <div 
              className={styles.imageCarousel}
              ref={carouselRef}
            >
              <div className={styles.carouselContainer}>
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`${styles.carouselSlide} ${index === currentImageIndex ? styles.active : ''}`}
                  >
                    <img 
                      src={image} 
                      alt={`AI ToEarn Feature ${index + 1}`} 
                      className={styles.carouselImage}
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
                <span>{t('buildSection.carouselHint')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 功能介绍区
function ConnectSection() {
  const { t } = useTransClient('home');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const images = [hotjietu3.src, hotjietu2.src, hotjietu1.src ]; // 功能介绍相关的图片
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
      // 检查是否在轮播区域内
      if (carouselRef.current && carouselRef.current.contains(e.target as Node)) {
        e.preventDefault();
        
        if (e.deltaY > 0) {
          // 向下滚动
          if (currentImageIndex < images.length - 1) {
            setCurrentImageIndex(prev => prev + 1);
            setAutoRotate(false); // 用户操作时暂停自动轮播
          } else {
            // 到达最后一张图，恢复页面滚动
            setAutoRotate(true);
            return;
          }
        } else {
          // 向上滚动
          if (currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1);
            setAutoRotate(false);
          }
        }
        
        // 3秒后恢复自动轮播
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
    <section className={styles.connectSection}>
      <div className={styles.connectContainer}>
        <div className={styles.sectionBadge}>
          <div className={styles.badgeIcon}></div>
          <span>{t('connectSection.badge')}</span>
        </div>
        
        <div className={styles.connectContent}>
          <div className={styles.connectLeft}>
            <h2 className={styles.connectTitle}>
            {t('connectSection.title')} <span className={styles.titleBlue}>{t('connectSection.titleBlue')}</span>
            </h2>
            
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <h3>{t('connectSection.features.creation.title')}</h3>
                <p>{t('connectSection.features.creation.description')}</p>
                <div className={styles.integrationLogos}>
                  {/* 集成服务 logos */}
                </div>
              </div>
              
              <div className={styles.featureItem}>
                <h3>{t('connectSection.features.distribution.title')}</h3>
                <p>{t('connectSection.features.distribution.description')}</p>
              </div>
              
              <div className={styles.featureItem}>
                <h3>{t('connectSection.features.interaction.title')}</h3>
                <p>{t('connectSection.features.interaction.description')}</p>
              </div>

              <div className={styles.featureItem}>
                <h3>{t('connectSection.features.analytics.title')}</h3>
                <p>{t('connectSection.features.analytics.description')}</p>
              </div>
            </div>
          </div>
          
          <div className={styles.connectRight}>
            <div 
              className={styles.imageCarousel}
              ref={carouselRef}
            >
              <div className={styles.carouselContainer}>
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`${styles.carouselSlide} ${index === currentImageIndex ? styles.active : ''}`}
                  >
                    <img 
                      src={image} 
                      alt={`AI ToEarn Function ${index + 1}`} 
                      className={styles.carouselImage}
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
                <span>{t('connectSection.carouselHint')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 移动应用下载区
function DownloadSection() {
  const { t } = useTransClient('home');
  
  return (
    <section className={styles.downloadSection}>
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
              <a href="#app-store" className={styles.downloadBtn}>
                <div className={styles.downloadBtnContent}>
                  <svg className={styles.downloadIcon} width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" fill="currentColor"/>
                  </svg>
                  <div className={styles.downloadBtnText}>
                    <span className={styles.downloadOn}>{t('downloadSection.appStore.text')}</span>
                    <span className={styles.downloadStore}>{t('downloadSection.appStore.store')}</span>
                  </div>
                </div>
              </a>
              
              <a href="#google-play" className={styles.downloadBtn}>
                <div className={styles.downloadBtnContent}>
                  <svg className={styles.downloadIcon} width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" fill="currentColor"/>
                  </svg>
                  <div className={styles.downloadBtnText}>
                    <span className={styles.downloadOn}>{t('downloadSection.googlePlay.text')}</span>
                    <span className={styles.downloadStore}>{t('downloadSection.googlePlay.store')}</span>
                  </div>
                </div>
              </a>
            </div>
          </div>
          
          <div className={styles.downloadRight}>
            <div className={styles.phoneContainer}>
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
              
              <div className={styles.qrCode}>
                <div className={styles.qrCodeImage}>
                  <div className={styles.qrCodePattern}></div>
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
                <p className={styles.qrCodeText}>扫码关注微信公众号</p>
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
                <p className={styles.qrCodeText}>扫码加入社区群</p>
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
  
  // 背景图片数组
  const backgroundImages = [
    // '/src/assets/images/logo.png',
    // '/src/assets/images/vipcard.png',
    'https://picsum.photos/400/200?random=1',
    'https://picsum.photos/400/200?random=2',
    'https://picsum.photos/400/200?random=3',
    'https://picsum.photos/400/200?random=4',
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
              {/* <a href="#talk">{t('footer.company.links.talk')}</a> */}
              <a href="#terms">{t('footer.company.links.terms')}</a>
              <a href="#privacy">{t('footer.company.links.privacy')}</a>
              {/* <a href="#cookies">{t('footer.company.links.cookies')}</a> */}
              <a href="#data">{t('footer.company.links.data')}</a>
              {/* <a href="#marketplace">{t('footer.company.links.marketplace')}</a> */}
              {/* <a href="#brand">{t('footer.company.links.brand')}</a> */}
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
                color: isHovered ? 'transparent' : '#733DEC'
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
      <ReleaseBanner />
      <Header />
      <Hero />
      <BrandBar />
      <BuildSection />
      <ConnectSection />
      {/* <DownloadSection />
      <EnterpriseSection />
      <StatsSection /> */}
      <CommunitySection />
      <Footer />
    </div>
  );
}
