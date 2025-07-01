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

// BUILD 功能介绍区
function BuildSection() {
  return (
    <section className={styles.buildSection}>
      <div className={styles.buildContainer}>
        <div className={styles.sectionBadge}>
          <div className={styles.badgeIcon}></div>
          <span>BUILD</span>
        </div>
        
        <div className={styles.buildContent}>
          <div className={styles.buildLeft}>
            <h2 className={styles.buildTitle}>
              From sketch to live,<br />
              <span className={styles.titleBlue}>bring your AI vision to life and beyond.</span>
            </h2>
            
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <h3>Sophisticated Workflow in Minutes</h3>
                <p>Drag and drop to visually create AI apps and workflows that are capable of diverse tasks and evolving needs.</p>
              </div>
              
              <div className={styles.featureItem}>
                <h3>Publish in the Way You Want</h3>
                <p>Choose from flexible publishing options tailored to your diverse needs, while Dify's Backend-as-a-Service handles the complexities.</p>
              </div>
              
              <div className={styles.featureItem}>
                <h3>Build Upon Other's Creation</h3>
                <p>Loop everyone in to build AI workflow: Dify's DSL format makes it easy to save, share, and contribute seamless for the entire team.</p>
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
          <span>CONNECT</span>
        </div>
        
        <div className={styles.connectContent}>
          <div className={styles.connectLeft}>
            <h2 className={styles.connectTitle}>
              Supercharge AI applications with <span className={styles.titleBlue}>global large language models, RAG pipelines, tools, agent strategies, and more.</span>
            </h2>
            
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <h3>Get Your Data LLM Ready</h3>
                <p>Extract data from various sources, transform it, and index it into vector databases for optimal LLM use.</p>
                <div className={styles.integrationLogos}>
                  {/* 集成服务 logos */}
                </div>
              </div>
              
              <div className={styles.featureItem}>
                <h3>Amplify with Any Global Large Language Models</h3>
                <p>Access, switch and compare performance of different LLMs worldwide, including open-source, proprietary, and more.</p>
              </div>
              
              <div className={styles.featureItem}>
                <h3>Add Wings with Tools</h3>
                <p>Expand capabilities of your AI application with a versatile set of plugins.</p>
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

// Production Ready 区块
function ProductionSection() {
  return (
    <section className={styles.productionSection}>
      <div className={styles.productionContainer}>
        <h2 className={styles.productionTitle}>
          Production Ready since Day One<br />
          <span className={styles.titleBlue}>You're All Set</span>
        </h2>
        
        <div className={styles.productionFeatures}>
          <div className={styles.productionFeature}>
            <div className={styles.featureNumber}>01</div>
            <h3>Scalable</h3>
            <p>Effortlessly handle increasing traffic and evolving needs.</p>
          </div>
          
          <div className={styles.productionFeature}>
            <div className={styles.featureNumber}>02</div>
            <h3>Stable</h3>
            <p>Operate with peace of mind knowing you have a rock-solid foundation.</p>
          </div>
          
          <div className={styles.productionFeature}>
            <div className={styles.featureNumber}>03</div>
            <h3>Secure</h3>
            <p>Enterprise-grade security for your critical data assets.</p>
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
              <h4>RESOURCES</h4>
              <a href="#docs">Docs</a>
              <a href="#blog">Blog</a>
              <a href="#education">Education</a>
              <a href="#partner">Partner</a>
              <a href="#support">Support</a>
              <a href="#roadmap">Roadmap</a>
            </div>
            
            <div className={styles.footerColumn}>
              <h4>COMPANY</h4>
              <a href="#talk">Talk to Us</a>
              <a href="#terms">Terms of Service</a>
              <a href="#privacy">Privacy Policy</a>
              <a href="#cookies">Cookie Settings</a>
              <a href="#data">Data Protection Agreement</a>
              <a href="#marketplace">Marketplace Agreement</a>
              <a href="#brand">Brand Guidelines</a>
            </div>
          </div>
          
          <div className={styles.footerInfo}>
            <div className={styles.footerText}>
              Unlock Agentic AI with Dify. Develop, deploy, and manage autonomous agents, RAG pipelines, and more for teams at any scale, effortlessly.
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
            imagine 
            <span 
              className={styles.ifText}
              style={{
                backgroundImage: isHovered ? `url(${backgroundImages[currentImageIndex]})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: isHovered ? 'transparent' : '#1f2937'
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
      <ProductionSection />
      <EnterpriseSection />
      <StatsSection />
      <CommunitySection />
      <Footer />
    </div>
  );
}
