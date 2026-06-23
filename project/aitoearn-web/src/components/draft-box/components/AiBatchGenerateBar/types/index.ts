export interface AiBatchGenerateBarProps {
  /** 外部传入 groupId，不从 store 读取 */
  groupId?: string
  /** 生成成功后回调 */
  onGenerated?: () => void
  /** 自定义容器类名 */
  className?: string
  /** 是否强制使用草稿模式，隐藏独立图片/视频生成 */
  forceDraftMode?: boolean
}
