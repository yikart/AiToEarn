"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./styles/difyHome.module.scss";
import { useTransClient } from "../i18n/client";

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
import youtubeIcon from '@/assets/svgs/plat/youtube.svg';
import TwitterIcon from '@/assets/svgs/plat/twtter.svg';
import FacebookIcon from '@/assets/svgs/plat/facebook.svg';
import InstagramIcon from '@/assets/svgs/plat/instagram.svg';
import LinkedInIcon from '@/assets/svgs/plat/linkedin.svg';
import PinterestIcon from '@/assets/svgs/plat/pinterest.svg';
import ThreadsIcon from '@/assets/svgs/plat/xiancheng.svg';

// 资料图片
import publish1 from '@/assets/images/publish1.png';


import calendar from '@/assets/images/app-screenshot/1. content publish/calendar.jpeg';
import supportChannels from '@/assets/images/app-screenshot/1. content publish/support_channels.jpeg';
import hotspot from '@/assets/images/app-screenshot/2. content hotspot/hotspot.jpg';
import hotspot2 from '@/assets/images/app-screenshot/2. content hotspot/hotspot2.jpeg';
import hotspot3 from '@/assets/images/app-screenshot/2. content hotspot/hotspot3.jpeg';
import hotspot4 from '@/assets/images/app-screenshot/2. content hotspot/hotspot4.jpeg';
import contentSearch from '@/assets/images/app-screenshot/3. content search/contentsearch.gif';
import contentSearch1 from '@/assets/images/app-screenshot/3. content search/contentsearch1.jpeg';
import contentSearch2 from '@/assets/images/app-screenshot/3. content search/contentsearch2.jpeg';
import contentSearch4 from '@/assets/images/app-screenshot/3. content search/contentsearch4.jpeg';
import commentFilter from '@/assets/images/app-screenshot/4. comments search/commentfilter.jpeg';
import commentFilter2 from '@/assets/images/app-screenshot/5. content engagement/commentfilter2.jpeg';

import dataCenter from '@/assets/images/data_center.png';



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
          {/* <a href="#marketplace" className={styles.navLink}>{t('header.nav.marketplace')}</a> */}
          <a href="/pricing" className={styles.navLink}>{t('header.nav.pricing')}</a>
          <a href="https://status.aitoearn.ai/" target="_blank" rel="noopener noreferrer" className={styles.navLink}>{t('header.nav.status' as any)}</a>
          {/* <a href="#docs" className={styles.navLink}>{t('header.nav.docs')}</a> */}
          {/* <a href="#blog" className={styles.navLink}>{t('header.nav.blog')}</a> */}
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
  const { lng } = useParams();
  
  // 平台数据配置
  const platforms = [
    { name: 'YouTube', key: 'YouTube', hasIcon: true, iconPath: youtubeIcon.src },
    { name: 'TikTok', key: 'TikTok', hasIcon: true, iconPath: tiktokIcon.src },
    { name: '小红书', key: 'Rednote', hasIcon: true, iconPath: xhsIcon.src },
    { name: '抖音', key: 'Douyin', hasIcon: true, iconPath: douyinIcon.src },
    { name: '快手', key: 'Kwai', hasIcon: true, iconPath: ksIcon.src },
    { name: '公众号', key: 'Wechat Offical Account', hasIcon: true, iconPath: gongzhonghaoIcon.src },
    { name: '视频号', key: 'Wechat Channels', hasIcon: true, iconPath: wxSphIcon.src },
    { name: 'Bilibili', key: 'Bilibili', hasIcon: true, iconPath: bilibiliIcon.src },
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const images = [calendar.src, supportChannels.src];
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
          <span>功能1</span>
        </div>
        
        <div className={styles.buildContent}>
          <div className={styles.buildLeft}>
            <h2 className={styles.buildTitle}>
              Content Publishing — 一键发布 · 多平台触达
              <span className={styles.titleBlue}>从创意灵感到多平台分发，再到数据分析和商业化</span>
            </h2>
            
                         <div className={styles.featureList}>
               <div className={styles.featureItem}>
                 <h3>多平台分发</h3>
                 <p>支持全球最多主流社交平台（Douyin, Kwai, Wechat, Bilibili, Rednote, Facebook, Instagram, TikTok, LinkedIn, Threads, Bluesky, YouTube Shorts, Pinterest, Google Business, Mastodon, X）。</p>
               </div>
               
               <div className={styles.featureItem}>
                 <h3>日历编排</h3>
                 <p>像操作日历一样规划内容，实现多平台协同发布。</p>
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const images = [hotspot.src, hotspot2.src, hotspot3.src, hotspot4.src];
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
          <span>功能2</span>
        </div>
        
        <div className={styles.buildContent}>
          <div className={styles.buildLeft}>
            <h2 className={styles.buildTitle}>
              Content Hotspot — 爆款灵感引擎
              <span className={styles.titleBlue}>爆款案例库与趋势捕捉</span>
            </h2>
            
                         <div className={styles.featureList}>
               <div className={styles.featureItem}>
                 <h3>爆款案例库</h3>
                 <p>随时查看他人如何打造 10,000+ 点赞的内容。</p>
               </div>
               
               <div className={styles.featureItem}>
                 <h3>趋势捕捉</h3>
                 <p>快速发现流行趋势，降低创作焦虑。</p>
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const images = [contentSearch.src, contentSearch1.src, contentSearch2.src, contentSearch4.src];
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
          <span>功能3</span>
        </div>
        
        <div className={styles.buildContent}>
          <div className={styles.buildLeft}>
            <h2 className={styles.buildTitle}>
              Content Search — 品牌与市场洞察
              <span className={styles.titleBlue}>品牌监控与内容搜索</span>
            </h2>
            
                         <div className={styles.featureList}>
               <div className={styles.featureItem}>
                 <h3>品牌监控</h3>
                 <p>实时追踪品牌相关讨论，第一时间响应。</p>
               </div>
               
               <div className={styles.featureItem}>
                 <h3>内容搜索</h3>
                 <p>找到目标帖子和话题，高效互动，精准拓展市场。</p>
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const images = [commentFilter.src];
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
          <span>功能4</span>
        </div>
        
        <div className={styles.buildContent}>
          <div className={styles.buildLeft}>
            <h2 className={styles.buildTitle}>
              Comments Search — 精准用户挖掘
              <span className={styles.titleBlue}>智能评论搜索与精准转化</span>
            </h2>
            
                         <div className={styles.featureList}>
               <div className={styles.featureItem}>
                 <h3>智能评论搜索</h3>
                 <p>快速发现"求链接""怎么购买"等高转化信号。</p>
               </div>
               
               <div className={styles.featureItem}>
                 <h3>精准转化</h3>
                 <p>主动回复，提升流量变现效率。</p>
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const images = [commentFilter2.src];
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
          <span>功能5</span>
        </div>
        
        <div className={styles.buildContent}>
          <div className={styles.buildLeft}>
            <h2 className={styles.buildTitle}>
              Content Engagement — 互动与增长引擎
              <span className={styles.titleBlue}>统一后台与主动运营</span>
            </h2>
            
                         <div className={styles.featureList}>
               <div className={styles.featureItem}>
                 <h3>统一后台</h3>
                 <p>集中管理所有内容，互动零遗漏。</p>
               </div>
               
               <div className={styles.featureItem}>
                 <h3>主动运营</h3>
                 <p>参与热门话题，与潜在用户双向互动。把"被动内容运营"变成"主动流量经营"。</p>
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
  return (
    <section style={{marginTop: '100px'}} className={`${styles.buildSection} ${styles.upcomingFeaturesSection}`}>
      <div className={styles.buildContainer}>
        <div className={styles.sectionBadge}>
          <div className={styles.badgeIcon}></div>
          <span>即将上线</span>
        </div>
        
        <div className={`${styles.buildContent} ${styles.upcomingFeaturesLayout}`}>
          <div className={styles.buildLeft}>
            <h2 className={styles.buildTitle}>
              AI 驱动的全链路内容增长与变现平台
              <span className={styles.titleBlue}>即将上线功能，敬请期待</span>
            </h2>
            
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <h3>智能导入</h3>
                <p>直接导入历史内容，快速编辑、二次分发。例如：小红书创作者可一键同步到 YouTube，让更多用户看到。</p>
              </div>
              
              <div className={styles.featureItem}>
                <h3>Content Analytics — 全景化数据视图</h3>
                <p>多平台对比：一个平台不给流量，不代表所有平台不给。全链路监控：追踪内容表现，助力打造下一个百万博主。</p>
              </div>
              
              <div className={styles.featureItem}>
                <h3>AI Content Creation — 全流程 AI 助手</h3>
                <p>AI 文案生成：自动生成标题、描述，高效产出。AI 评论生成：主动出击，获取流量。图文卡片生成，全流程加速创作。支持主流 AI 视频模型和图片模型。</p>
              </div>
              
              <div className={styles.featureItem}>
                <h3>Content Marketplace — 内容交易与变现</h3>
                <p>创作者变现：在平台直接出售内容，让优质作品快速找到买家。品牌采购：企业可直接购买现成内容，节省时间与成本。让创作变成收益 —— Let's use AI to earn. Let's earn money together!</p>
              </div>
            </div>
          </div>
          
          {/* <div className={styles.buildRight}>
            <div className={styles.imageCarousel}>
              <div className={styles.carouselContainer}>
                <div className={`${styles.carouselSlide} ${styles.active}`}>
                  <img 
                    src={dataCenter.src} 
                    alt="Data Center Analytics" 
                    className={styles.desktopCarouselImage}
                  />
                </div>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </section>
  );
}

// 移动应用下载区
import { QRCode } from 'react-qrcode-logo';
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
              <a href="https://yikart.oss-cn-beijing.aliyuncs.com/aitoearn-1.0.9.1.apk" className={styles.downloadBtn} target="_blank" rel="noopener noreferrer">
                <div className={styles.downloadBtnContent}>
                  <AndroidOutlined className={styles.downloadIcon} style={{ fontSize: '24px' }} />
                  <div className={styles.downloadBtnText}>
                    <span className={styles.downloadOn}>立即下载</span>
                    <span className={styles.downloadStore}>Android APK</span>
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
                {/* <div className={styles.qrCodeImage}> */}
                  <QRCode
                    value="https://yikart.oss-cn-beijing.aliyuncs.com/aitoearn-1.0.9.1.apk"
                    size={120}
                  />
                {/* </div> */}
                <p className={styles.qrCodeText}>扫描二维码下载</p>
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
    hotspot.src,
    hotspot2.src,
    hotspot3.src,
    hotspot4.src,
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
      <Header />
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
