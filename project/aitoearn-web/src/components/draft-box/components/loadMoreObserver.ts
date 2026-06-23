/**
 * 统一的上拉加载观察器配置
 * 提前 500px 触发下一页加载，避免滚动到底才开始请求
 */

export const LOAD_MORE_OBSERVER_OPTIONS: IntersectionObserverInit = {
  rootMargin: '0px 0px 500px 0px',
  threshold: 0,
}
