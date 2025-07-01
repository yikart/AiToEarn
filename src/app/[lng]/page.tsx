"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./styles/difyHome.module.scss";

// 导入SVG图标
import bilibiliIcon from '@/assets/svgs/plat/bilibili.svg';
import douyinIcon from '@/assets/svgs/plat/douyin.svg';
import ksIcon from '@/assets/svgs/plat/ks.svg';
import wxSphIcon from '@/assets/svgs/plat/wx-sph.svg';
import xhsIcon from '@/assets/svgs/plat/xhs.svg';
import youtubeIcon from '@/assets/svgs/plat/youtube.svg';

// 版本发布横幅
function ReleaseBanner() {
  return (
    <div className={styles.releaseBanner}>
      <div className={styles.bannerContent}>
        <span className={styles.releaseTag}>Release v1.5.0</span>
        <span className={styles.releaseText}>Build and Extend AI Workflows with Plugins and a Thriving Marketplace.</span>
        <svg className={styles.arrowIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="m6 12 4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

// Header 顶部导航
function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <div className={styles.logo}>
          <span className={styles.logoText}>AIToEran</span>
        </div>
        <nav className={styles.nav}>
          <a href="#marketplace" className={styles.navLink}>市场</a>
          <a href="#pricing" className={styles.navLink}>价格</a>
          <a href="#docs" className={styles.navLink}>问题</a>
          <a href="#blog" className={styles.navLink}>博客</a>
        </nav>
        <button className={styles.getStartedBtn}>立即开始</button>
      </div>
    </header>
  );
}

// Hero 主标题区
function Hero() {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [hideCursor, setHideCursor] = useState(false);
  const [startTyping, setStartTyping] = useState(false);
  
  // 要显示的完整文本
  const fullText = '成为最好用的内容营销\nAI Agent';
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
        <div className={styles.githubStars}>
          <span className={styles.starCount}>105.2k</span>
          <span className={styles.starText}>stars on</span>
          <span className={styles.githubText}>GitHub</span>
        </div>
        
        <h1 className={styles.heroTitle}>
          {renderText()}
          <span className={`${styles.cursor} ${hideCursor ? styles.cursorHidden : styles.cursorVisible}`}>|</span>
        </h1>
        
        <p className={styles.heroSubtitle}>
        从今天起，使用AI轻松管理你的社交媒体。AITOEARN提供从灵感创意、内容制作，内容分发内容互动管理等一站式能力，让AI触手可及。
        </p>
        
        <button className={styles.heroBtn}>
          立即开始
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
  // 平台数据配置
  const platforms = [
    { name: 'YouTube', hasIcon: true, iconPath: youtubeIcon.src },
    { name: 'Rednote', hasIcon: true, iconPath: xhsIcon.src },
    { name: 'Douyin', hasIcon: true, iconPath: douyinIcon.src },
    { name: 'Kwai', hasIcon: true, iconPath: ksIcon.src },
    { name: 'WeChat Channels', hasIcon: true, iconPath: wxSphIcon.src },
    { name: 'bilibili', hasIcon: true, iconPath: bilibiliIcon.src },
    { name: 'Facebook', hasIcon: false, icon: '📘' },
    { name: 'Instagram', hasIcon: false, icon: '📷' },
    { name: 'LinkedIn', hasIcon: false, icon: '💼' },
    { name: 'Pinterest', hasIcon: false, icon: '📌' },
    { name: 'Threads', hasIcon: false, icon: '🧵' },
    { name: 'TikTok', hasIcon: false, icon: '🎵' },
    { name: 'X (Twitter)', hasIcon: false, icon: '🐦' },
  ];

  // 为了实现无缝滚动，复制一份数据
  const duplicatedPlatforms = [...platforms, ...platforms];

  return (
    <section className={styles.brandBar}>
      <div className={styles.brandContainer}>
        <div className={styles.brandTitle}>支持的社交媒体平台</div>
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
                    <span className={styles.platformEmoji}>{platform.icon}</span>
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

// 功能介绍区
function BuildSection() {
  return (
    <section className={styles.buildSection}>
      <div className={styles.buildContainer}>
        <div className={styles.sectionBadge}>
          <div className={styles.badgeIcon}></div>
          <span>灵感创意</span>
        </div>
        
        <div className={styles.buildContent}>
          <div className={styles.buildLeft}>
            <h2 className={styles.buildTitle}>
              灵感枯竭? 
              <span className={styles.titleBlue}>来看看全网有哪些热点吧</span>
            </h2>
            
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <h3>AI热点抓取，全网热点一网打尽</h3>
                <p>通过AI抓取全网热点，AI分析一键生成同款爆款内容,热点流量一网打尽</p>
              </div>
              
              <div className={styles.featureItem}>
                <h3>国际站：YouTube 、 TikTok 、 Facebook 、 Instagram 、 LinkedIn 、 X (Twitter) 、 Rednote</h3>
                <p>海外站热点抓取，让你第一时间了解最新动态</p>
              </div>
              
              <div className={styles.featureItem}>
                <h3>国内站：抖音 、 快手 、 微信 、 Bilibili</h3>
                <p>支持国内站的热点抓取，让你不错过每一条热点流量</p>
              </div>
            </div>
          </div>
          
          <div className={styles.buildRight}>
            <div className={styles.productScreenshot}>
              <img src="/api/placeholder/600/400" alt="Dify Workflow Interface" className={styles.screenshotImg} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// CONNECT 功能介绍区
function ConnectSection() {
  return (
    <section className={styles.connectSection}>
      <div className={styles.connectContainer}>
        <div className={styles.sectionBadge}>
          <div className={styles.badgeIcon}></div>
          <span>功能介绍</span>
        </div>
        
        <div className={styles.connectContent}>
          <div className={styles.connectLeft}>
            <h2 className={styles.connectTitle}>
            自媒体运营平台一站式解决方案 <span className={styles.titleBlue}>从灵感创意到内容制作，从内容分发到内容互动管理</span>
            </h2>
            
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <h3>内容创作</h3>
                <p>AI内容创作，AI图片生成，图文创作等AI能力，让你的内容更加生动有趣</p>
                <div className={styles.integrationLogos}>
                  {/* 集成服务 logos */}
                </div>
              </div>
              
              <div className={styles.featureItem}>
                <h3>内容分发</h3>
                <p>支持国内外多平台分发，让你的内容触达更多用户，一键式管理，让你的内容触达更多用户</p>
              </div>
              
              <div className={styles.featureItem}>
                <h3>内容互动管理</h3>
                <p>支持国内外多平台互动管理，让你的内容互动更加高效，一键式管理，让你的内容互动更加高效</p>
              </div>

              <div className={styles.featureItem}>
                <h3>数据分析</h3>
                <p>支持国内外多平台数据分析，让你的数据分析更加高效，一键式管理，让你的数据分析更加高效</p>
              </div>
            </div>
          </div>
          
          <div className={styles.connectRight}>
            <div className={styles.productScreenshot}>
              <img src="/api/placeholder/600/400" alt="Dify Data Source Interface" className={styles.screenshotImg} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 移动应用下载区
function DownloadSection() {
  return (
    <section className={styles.downloadSection}>
      <div className={styles.downloadContainer}>
        <div className={styles.downloadContent}>
          <div className={styles.downloadLeft}>
            <h2 className={styles.downloadTitle}>
              随时随地开始创作<br />
              <span className={styles.titleBlue}>移动端也能轻松管理</span>
            </h2>
            
            <p className={styles.downloadDescription}>
              借助 AI ToEarn 移动应用，您的创作不再局限于桌面端。我们还为您提供 iOS 和 Android 移动应用，随时随地释放您的创造力，仅需一部手机即可！
            </p>
            
            <div className={styles.downloadButtons}>
              <a href="#app-store" className={styles.downloadBtn}>
                <div className={styles.downloadBtnContent}>
                  <svg className={styles.downloadIcon} width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" fill="currentColor"/>
                  </svg>
                  <div className={styles.downloadBtnText}>
                    <span className={styles.downloadOn}>Download on the</span>
                    <span className={styles.downloadStore}>App Store</span>
                  </div>
                </div>
              </a>
              
              <a href="#google-play" className={styles.downloadBtn}>
                <div className={styles.downloadBtnContent}>
                  <svg className={styles.downloadIcon} width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" fill="currentColor"/>
                  </svg>
                  <div className={styles.downloadBtnText}>
                    <span className={styles.downloadOn}>GET IT ON</span>
                    <span className={styles.downloadStore}>Google Play</span>
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
                        <img src="/api/placeholder/300/200" alt="Video preview" className={styles.phoneVideoImg} />
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
  return (
    <section className={styles.enterpriseSection}>
      <div className={styles.enterpriseContainer}>
        <div className={styles.sectionBadge}>
          <div className={styles.badgeIcon}></div>
          <span>ENTERPRISE</span>
        </div>
        
        <h2 className={styles.enterpriseTitle}>
          Solid AI Infrastructure<br />
          <span className={styles.titleBlue}>for Enterprise Success</span>
        </h2>
        
        <p className={styles.enterpriseSubtitle}>
          The AI transformation for enterprise requires not just tools, but grounded infrastructure. Dify offers a reliable platform to distribute AI capabilities across multiple departments for unparalleled efficiency.
        </p>
      </div>
    </section>
  );
}

// 数据统计区
function StatsSection() {
  return (
    <section className={styles.statsSection}>
      <div className={styles.statsContainer}>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>10K+</div>
            <div className={styles.statLabel}>Teams</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>60+</div>
            <div className={styles.statLabel}>Industries</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>150+</div>
            <div className={styles.statLabel}>Countries</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>1M+</div>
            <div className={styles.statLabel}>Applications</div>
          </div>
        </div>
        
        <div className={styles.testimonialCard}>
          <div className={styles.testimonialContent}>
            <p>"In this climate of perpetual beta, tools enabling rapid validation aren't just helpful, they're existential. For Volvo Cars, strategically navigating this AI frontier, this is where Dify delivers indispensable value."</p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorName}>EWEN WANG</div>
              <div className={styles.authorTitle}>HEAD OF AI & DATA APAC</div>
            </div>
          </div>
        </div>
        
        <div className={styles.caseStudies}>
          <div className={styles.caseStudy}>
            <div className={styles.caseTitle}>Estimated an annual reduction of</div>
            <div className={styles.caseNumber}>18,000 hours.</div>
          </div>
          <div className={styles.caseStudy}>
            <div className={styles.caseTitle}>Enterprise Q&A Bot: Serve 19000+ employees across 20+ departments.</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 社区区块
function CommunitySection() {
  return (
    <section className={styles.communitySection}>
      <div className={styles.communityContainer}>
        <div className={styles.sectionBadge}>
          <div className={styles.badgeIcon}></div>
          <span>COMMUNITY</span>
        </div>
        
        <h2 className={styles.communityTitle}>
          Become Part of Our<br />
          <span className={styles.titleBlue}>Vibrant Community</span>
        </h2>
        
        <p className={styles.communitySubtitle}>
          Dify is powered by the community of AI innovators worldwide. Join us and push the boundary of GenAI app development platform.
        </p>
        
        <div className={styles.communityButtons}>
          <button className={styles.githubBtn}>
            GitHub
            <svg className={styles.btnArrow} width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="m6 12 4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className={styles.discordBtn}>
            Discord Community
            <svg className={styles.btnArrow} width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="m6 12 4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div className={styles.communityStats}>
          <div className={styles.communityStat}>
            <div className={styles.statNumber}>5M+</div>
            <div className={styles.statLabel}>Downloads</div>
          </div>
          <div className={styles.communityStat}>
            <div className={styles.statNumber}>105.2k</div>
            <div className={styles.statLabel}>Stars</div>
          </div>
          <div className={styles.communityStat}>
            <div className={styles.statNumber}>800+</div>
            <div className={styles.statLabel}>Contributors</div>
          </div>
        </div>
        
        <div className={styles.tweets}>
          {/* 推文卡片区域 */}
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
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
            <div className={styles.footerColumn}>
              <h4>资源</h4>
              <a href="#docs">文档</a>
              <a href="#blog">博客</a>
              <a href="#education">教育</a>
              <a href="#partner">合作伙伴</a>
              <a href="#support">服务支持</a>
              <a href="#roadmap">产品线路图</a>
            </div>
            
            <div className={styles.footerColumn}>
              <h4>公司</h4>
              <a href="#talk">联系我们</a>
              <a href="#terms">服务条款</a>
              <a href="#privacy">隐私政策</a>
              <a href="#cookies">Cookie 设置</a>
              <a href="#data">数据保护协议</a>
              <a href="#marketplace">市场协议</a>
              <a href="#brand">品牌指南</a>
            </div>
          </div>
          
          <div className={styles.footerInfo}>
            <div className={styles.footerText}>
              AI ToEarn 自媒体运营平台一站式解决方案，从灵感创意到内容制作，从内容分发到内容互动管理
            </div>
            
            <div className={styles.socialLinks}>
              <a href="#github">GitHub</a>
              <a href="#discord">Discord</a>
              <a href="#youtube">YouTube</a>
              <a href="#linkedin">LinkedIn</a>
              <a href="#twitter">Twitter</a>
            </div>
          </div>
        </div>
        
        {/* 下半部分：imagine if */}
        <div className={styles.footerBottom}>
          <div 
            className={styles.bigText}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            AI ToEarn 
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
              if
            </span>
          </div>
          
          <div className={styles.footerCopyright}>
            <div className={styles.copyright}>© 2025 LangGenius, Inc.</div>
            <div className={styles.tagline}>Build Production-Ready Agentic AI Solutions</div>
          </div>
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
      <DownloadSection />
      <EnterpriseSection />
      <StatsSection />
      <CommunitySection />
      <Footer />
    </div>
  );
}
