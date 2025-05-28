import React from 'react';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { Platform } from '@/api/hot';
import './SideMenu.css';

interface SideMenuProps {
  platforms: Platform[];
  selectedPlatform: Platform | null;
  loading: boolean;
  contentExpanded: boolean;
  topicExpanded: boolean;
  hotEventExpanded: boolean;
  viralTitleExpanded: boolean;
  talkExpanded: boolean;
  hotPlatformExpanded: boolean;
  viralTitleLoading: boolean;
  viralTitlePlatforms: Platform[];
  selectedViralPlatform: Platform | null;
  msgTypeList: string[];
  selectedMsgType: string;
  onPlatformSelect: (platform: Platform) => void;
  onContentExpand: () => void;
  onTopicExpand: () => void;
  onHotEventExpand: () => void;
  onViralTitleExpand: () => void;
  onTalkExpand: () => void;
  onHotPlatformExpand: () => void;
  onViralPlatformSelect: (platform: Platform, timeType: string) => void;
  onMsgTypeClick: (type: string) => void;
  getImageUrl: (path: string) => string;
  onHotContentClick: () => void;
  onViralTitleCategorySelect: (category: string) => void;
}

const SideMenu: React.FC<SideMenuProps> = ({
  platforms,
  selectedPlatform,
  loading,
  contentExpanded,
  topicExpanded,
  hotEventExpanded,
  viralTitleExpanded,
  talkExpanded,
  hotPlatformExpanded,
  viralTitleLoading,
  viralTitlePlatforms,
  selectedViralPlatform,
  msgTypeList,
  selectedMsgType,
  onPlatformSelect,
  onContentExpand,
  onTopicExpand,
  onHotEventExpand,
  onViralTitleExpand,
  onTalkExpand,
  onHotPlatformExpand,
  onViralPlatformSelect,
  onMsgTypeClick,
  getImageUrl,
  onHotContentClick,
  onViralTitleCategorySelect,
}) => {
  return (
    <div className="side-menu">
      {/* 热门内容 */}
      <div className="menu-section">
        <div className="menu-header" onClick={() => { onContentExpand(); onHotContentClick(); }}>
          <span className="menu-title">热门内容</span>
          {contentExpanded ? <DownOutlined /> : <RightOutlined />}
        </div>
        {contentExpanded && (
          <ul className="menu-list">
            {loading ? (
              <div className="loading">加载中...</div>
            ) : (
              platforms.map((platform) => (
                <li
                  key={platform.id}
                  className={`menu-item ${
                    selectedPlatform?.id === platform.id ? 'active' : ''
                  }`}
                  onClick={() => onPlatformSelect(platform)}
                >
                  <img
                    src={getImageUrl(platform.icon)}
                    alt={platform.name}
                    className="platform-icon"
                  />
                  <span>{platform.name}</span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {/* 热点事件 */}
      <div className="menu-section">
        <div className="menu-header" onClick={onHotEventExpand}>
          <span className="menu-title">热点事件</span>
          {hotEventExpanded ? <DownOutlined /> : <RightOutlined />}
        </div>
        {hotEventExpanded && (
          <ul className="menu-list">
            <li
              className={`menu-item ${hotPlatformExpanded ? 'active' : ''}`}
              onClick={onHotPlatformExpand}
            >
              <span>八大平台热点</span>
            </li>
          </ul>
        )}
      </div>

      {/* 热门专题 */}
      <div className="menu-section">
        <div className="menu-header" onClick={onTopicExpand}>
          <span className="menu-title">热门专题</span>
          {topicExpanded ? <DownOutlined /> : <RightOutlined />}
        </div>
        {topicExpanded && (
          <ul className="menu-list">
            {loading ? (
              <div className="loading">加载中...</div>
            ) : (
              msgTypeList.map((type) => (
                <li
                  key={type}
                  className={`menu-item ${selectedMsgType === type ? 'active' : ''}`}
                  onClick={() => onMsgTypeClick(type)}
                >
                  <span>{type}</span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {/* 爆款标题 */}
      <div className="menu-section">
        <div className="menu-header" onClick={onViralTitleExpand}>
          <span className="menu-title">爆款标题</span>
          {viralTitleExpanded ? <DownOutlined /> : <RightOutlined />}
        </div>
        {viralTitleExpanded && (
          <ul className="menu-list">
            {viralTitleLoading ? (
              <div className="loading">加载中...</div>
            ) : (
              viralTitlePlatforms.map((platform) => (
                <li
                  key={platform.id}
                  className={`menu-item ${
                    selectedViralPlatform?.id === platform.id ? 'active' : ''
                  }`}
                  onClick={() => onViralPlatformSelect(platform, '')}
                >
                  <img
                    src={getImageUrl(platform.icon)}
                    alt={platform.name}
                    className="platform-icon"
                  />
                  <span>{platform.name}</span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SideMenu; 