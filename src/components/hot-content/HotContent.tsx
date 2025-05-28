import React from 'react';
import { Pagination, DatePicker, Popover } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/zh_CN';
import { PlatformRanking, RankingContent } from '@/api/hot';
import './HotContent.css';

interface HotContentProps {
  rankingList: PlatformRanking[];
  selectedRanking: PlatformRanking | null;
  rankingContents: RankingContent[];
  rankingLoading: boolean;
  pagination: any;
  categories: string[];
  selectedCategory: string;
  isExpanded: boolean;
  selectedDate: string;
  rankingMinDate: string;
  rankingMaxDate: string;
  onRankingSelect: (ranking: PlatformRanking) => void;
  onCategorySelect: (category: string) => void;
  onDateChange: (date: dayjs.Dayjs | null) => void;
  onPageChange: (page: number) => void;
  onContentClick: (url: string, title: string) => void;
  onExpandToggle: () => void;
  getImageUrl: (path: string) => string;
  formatNumber: (num: number | null) => string;
  anaAdd?: {
    addCollectedCunt: number;
    addCommentCount: number;
    addLikeCount: number;
    addShareCount: number;
    addViewCount: number | null;
    addInteractiveCount: number | null;
    addCollectCount: number | null;
    collectedCount: number;
    interactiveCount: number;
    pred_readnum: number;
    useCollectCount: number;
    useCommentCount: number;
    useLikeCount: number;
    useShareCount: number;
    useViewCount: number | null;
  };
}

const DataInfoContent: React.FC<{ ranking: PlatformRanking }> = ({ ranking }) => (
  <div className="data-info">
    <div className="info-item">
      <span className="info-label">更新时间：</span>
      {ranking.updateFrequency}
    </div>
    <div className="info-item">
      <span className="info-label">统计数据截止：</span>
      {new Date(ranking.updateTime).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })}
    </div>
    <div className="info-item">
      <span className="info-label">时间查看：</span>
      按日
    </div>
    <div className="info-item">
      <span className="info-label">排序规则：</span>
      统计当日点赞量前500名的作品推荐
    </div>
  </div>
);

const HotContent: React.FC<HotContentProps> = ({
  rankingList,
  selectedRanking,
  rankingContents,
  rankingLoading,
  pagination,
  categories,
  selectedCategory,
  isExpanded,
  selectedDate,
  rankingMinDate,
  rankingMaxDate,
  onRankingSelect,
  onCategorySelect,
  onDateChange,
  onPageChange,
  onContentClick,
  onExpandToggle,
  getImageUrl,
  formatNumber,
}) => {
  return (
    <div className="hot-content">

      {/* 榜单选择 */}
      {rankingList.length > 1 && (
        <div className="ranking-selector">
          <div className="ranking-list">
            {rankingList
              .filter((ranking) => !ranking.parentId)
              .map((ranking) => (
                <button
                  key={ranking.id}
                  className={`ranking-button ${
                    selectedRanking?.id === ranking.id ? 'active' : ''
                  }`}
                  onClick={() => onRankingSelect(ranking)}
                >
                  {ranking.name}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* 筛选区域 */}
      <div className="filter-section">
        {/* 分类筛选 */}
        <div className="category-filter">
          <div className="category-grid">
            <div className="category-list">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`category-button ${
                    selectedCategory === category ? 'active' : ''
                  }`}
                  onClick={() => onCategorySelect(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            {categories.length > 8 && (
              <button
                className="expand-button"
                onClick={onExpandToggle}
              >
                <span>{isExpanded ? '收起' : '展开'}</span>
                <InfoCircleOutlined
                  className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
                />
              </button>
            )}
          </div>
        </div>

        {/* 日期选择和子榜单选择 */}
        <div className="date-section">
          <div className="date-picker-wrapper">
            <DatePicker
              value={dayjs(selectedDate)}
              onChange={onDateChange}
              locale={locale}
              allowClear={false}
              className="date-picker"
              placeholder="选择日期"
              disabledDate={(current) => {
                return (
                  current < dayjs(rankingMinDate) ||
                  current > dayjs(rankingMaxDate)
                );
              }}
            />

            {/* 子榜单选择 */}
            {selectedRanking &&
              rankingList.filter(
                (ranking) =>
                  ranking.parentId ===
                  (selectedRanking.parentId || selectedRanking.id),
              ).length > 0 && (
                <div className="sub-ranking-list">
                  {rankingList
                    .filter(
                      (ranking) =>
                        ranking.parentId ===
                        (selectedRanking.parentId || selectedRanking.id),
                    )
                    .map((ranking) => (
                      <button
                        key={ranking.id}
                        className={`sub-ranking-button ${
                          selectedRanking?.id === ranking.id ? 'active' : ''
                        }`}
                        onClick={() => onRankingSelect(ranking)}
                      >
                        {ranking.name}
                      </button>
                    ))}
                </div>
              )}
          </div>

          {selectedRanking && (
            <Popover
              content={<DataInfoContent ranking={selectedRanking} />}
              title="数据说明"
              trigger="hover"
              placement="bottomRight"
              overlayClassName="data-info-popover"
            >
              <div className="data-info-trigger">
                <InfoCircleOutlined />
                <span>数据说明</span>
              </div>
            </Popover>
          )}
        </div>
      </div>

      {/* 内容列表 */}
      <div className="content-list">
        {rankingLoading ? (
          <div className="loading">加载榜单数据中...</div>
        ) : rankingContents.length > 0 ? (
          <>
            {/* 表头 */}
            <div className="list-header">
              <div className="header-left">
                <div className="rank-column">排名</div>
                <div className="info-column">笔记信息</div>
              </div>
              <div className="header-right">
                <div className="category-column">作品分类</div>
                <div className="stats-columns">
                  {/* 快手增量榜单 */}
                  {selectedRanking?.name.includes('增量') && selectedRanking?.platform?.id === 'ks' && (
                    <>
                      <div className="stat-column">互动增量</div>
                      <div className="stat-column">新增播放</div>
                      <div className="stat-column">新增分享</div>
                      <div className="stat-column">新增评论</div>
                    </>
                  )}
                  
                  {/* 其他平台增量榜单 */}
                  {selectedRanking?.name.includes('增量') && selectedRanking?.platform?.id !== 'ks' && (
                    <>
                      <div className="stat-column">互动增量</div>
                      <div className="stat-column">新增收藏</div>
                      <div className="stat-column">新增分享</div>
                      <div className="stat-column">新增评论</div>
                    </>
                  )}

                  {/* 阅读榜和低粉爆文榜 */}
                  {(selectedRanking?.name.includes('阅读榜') || selectedRanking?.name.includes('低粉爆文榜')) && (
                    <>
                      <div className="stat-column">在看数</div>
                      <div className="stat-column">阅读数</div>
                      <div className="stat-column">点赞数</div>
                      <div className="stat-column">转发数</div>
                    </>
                  )}

                  {/* 默认榜单 */}
                  {!selectedRanking?.name.includes('增量') &&
                   !selectedRanking?.name.includes('阅读榜') &&
                   !selectedRanking?.name.includes('低粉爆文榜') && (
                    <>
                      <div className="stat-column">点赞</div>
                      <div className="stat-column">评论</div>
                      <div className="stat-column">分享</div>
                      <div className="stat-column">收藏</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 内容项 */}
            {rankingContents.map((item) => (
              <div
                key={item.id}
                className="content-item"
                onClick={() => onContentClick(item.url, item.title)}
              >
                <div className="rank">{item.rankingPosition}</div>
                <div className="content-info">
                  <div className="thumbnail">
                    {item.cover ? (
                      <img
                        src={getImageUrl(item.cover)}
                        alt={item.title}
                        className="cover-image"
                      />
                    ) : (
                      <div className="no-image">暂无图片</div>
                    )}
                  </div>
                  <div className="info">
                    <h3 className="title">{item.title}</h3>
                    <div className="author-info">
                      {item.author && (
                        <>
                          <img
                            src={getImageUrl(item.author.avatar)}
                            alt={item.author.name}
                            className="avatar"
                          />
                          <span className="author-name">
                            {item.author.name}
                          </span>
                          {item.author.fansCount && (
                            <span className="fans-count">
                              粉丝数 {item.author.fansCount.toLocaleString()}
                            </span>
                          )}
                          <span className="publish-time">
                            发布于{' '}
                            {dayjs(item.publishTime).format('YYYY-MM-DD HH:mm')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="content-stats">
                  <div className="category">{item.category}</div>
                  <div className="stats">
                    {/* 快手增量榜单 */}
                    {selectedRanking?.name.includes('增量') && selectedRanking?.platform?.id === 'ks' && (
                      <>
                        <div className="stat">
                          <div className="stat-total">
                            {item.anaAdd?.addInteractiveCount ? (
                              <>
                                <span className="arrow">↑</span>
                                {formatNumber(item.anaAdd.addInteractiveCount)}
                              </>
                            ) : '-'}
                          </div>
                          <div className="stat-add">
                            {item.anaAdd?.interactiveCount ? (
                              <>
                                <span className="arrow">↑</span>
                                总{formatNumber(item.anaAdd.interactiveCount)}
                              </>
                            ) : '-'}
                          </div>
                        </div>
                        <div className="stat">
                          <div className="stat-total">
                            <span className="arrow">↑</span>
                            {item.anaAdd?.addViewCount ? formatNumber(item.anaAdd.addViewCount) : '-'}
                          </div>
                          <div className="stat-add">
                            总{item.anaAdd?.useViewCount ? formatNumber(item.anaAdd.useViewCount) : '-'}
                          </div>
                        </div>
                        <div className="stat">
                          <div className="stat-total">
                            <span className="arrow">↑</span>
                            {item.anaAdd?.addShareCount ? formatNumber(item.anaAdd.addShareCount) : '-'}
                          </div>
                          <div className="stat-add">
                            总{item.anaAdd?.useShareCount ? formatNumber(item.anaAdd.useShareCount) : '-'}
                          </div>
                        </div>
                        <div className="stat">
                          <div className="stat-total">
                            <span className="arrow">↑</span>
                            {item.anaAdd?.addCommentCount ? formatNumber(item.anaAdd.addCommentCount) : '-'}
                          </div>
                          <div className="stat-add">
                            总{item.anaAdd?.useCommentCount ? formatNumber(item.anaAdd.useCommentCount) : '-'}
                          </div>
                        </div>
                      </>
                    )}

                    {/* 其他平台增量榜单 */}
                    {selectedRanking?.name.includes('增量') && selectedRanking?.platform?.id !== 'ks' && (
                      <>
                        <div className="stat">
                          <div className="stat-total">
                            {item.anaAdd?.addInteractiveCount ? (
                              <>
                                <span className="arrow">↑</span>
                                {formatNumber(item.anaAdd.addInteractiveCount)}
                              </>
                            ) : '-'}
                          </div>
                          <div className="stat-add">
                            {item.anaAdd?.interactiveCount ? (
                              <>
                                <span className="arrow">↑</span>
                                总{formatNumber(item.anaAdd.interactiveCount)}
                              </>
                            ) : '-'}
                          </div>
                        </div>
                        <div className="stat">
                          <div className="stat-total">
                            <span className="arrow">↑</span>
                            {item.anaAdd?.addCollectedCunt ? formatNumber(item.anaAdd.addCollectedCunt) : '-'}
                          </div>
                          <div className="stat-add">
                            总{item.anaAdd?.collectedCount ? formatNumber(item.anaAdd.collectedCount) : '-'}
                          </div>
                        </div>
                        <div className="stat">
                          <div className="stat-total">
                            <span className="arrow">↑</span>
                            {item.anaAdd?.addShareCount ? formatNumber(item.anaAdd.addShareCount) : '-'}
                          </div>
                          <div className="stat-add">
                            总{item.anaAdd?.useShareCount ? formatNumber(item.anaAdd.useShareCount) : '-'}
                          </div>
                        </div>
                        <div className="stat">
                          <div className="stat-total">
                            <span className="arrow">↑</span>
                            {item.anaAdd?.addCommentCount ? formatNumber(item.anaAdd.addCommentCount) : '-'}
                          </div>
                          <div className="stat-add">
                            总{item.anaAdd?.useCommentCount ? formatNumber(item.anaAdd.useCommentCount) : '-'}
                          </div>
                        </div>
                      </>
                    )}

                    {/* 阅读榜和低粉爆文榜 */}
                    {(selectedRanking?.name.includes('阅读榜') || selectedRanking?.name.includes('低粉爆文榜')) && (
                      <>
                        <div className="stat">
                          <div className="stat-total">{item.stats.watchCount || '-'}</div>
                        </div>
                        <div className="stat">
                          <div className="stat-total">{item.stats.viewCount || '-'}</div>
                        </div>
                        <div className="stat">
                          <div className="stat-total">{item.stats.likeCount || '-'}</div>
                        </div>
                        <div className="stat">
                          <div className="stat-total">{(item as any).shareCount || '-'}</div>
                        </div>
                      </>
                    )}

                    {/* 默认榜单 */}
                    {!selectedRanking?.name.includes('增量') &&
                     !selectedRanking?.name.includes('阅读榜') &&
                     !selectedRanking?.name.includes('低粉爆文榜') && (
                      <>
                        <div className="stat">
                          <div className="stat-total">{item.stats.likeCount || '-'}</div>
                        </div>
                        <div className="stat">
                          <div className="stat-total">{item.stats.commentCount || '-'}</div>
                        </div>
                        <div className="stat">
                          <div className="stat-total">{(item as any).shareCount || '-'}</div>
                        </div>
                        <div className="stat">
                          <div className="stat-total">{(item as any).collectCount || '-'}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* 分页 */}
            {pagination && pagination.totalPages > 1 && (
              <div className="pagination-wrapper">
                <Pagination
                  current={pagination.currentPage}
                  total={pagination.totalItems}
                  pageSize={pagination.itemsPerPage}
                  showSizeChanger={false}
                  showQuickJumper
                  showTotal={(total) => `共 ${total} 条`}
                  onChange={onPageChange}
                />
              </div>
            )}
          </>
        ) : (
          <div className="no-data">暂无榜单数据</div>
        )}
      </div>
    </div>
  );
};

export default HotContent; 