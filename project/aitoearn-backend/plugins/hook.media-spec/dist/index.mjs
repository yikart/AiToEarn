// hook.media-spec —— 图片/视频规格校验钩子（官方示例插件）
// 自包含单文件 ESM，不 import 任何模块；宿主通过 activate(host) 注入能力代理。
const MAX_IMAGES = 9
const MAX_VIDEO_DURATION_SEC = 3600
const MIN_EDGE_PX = 10

export async function activate() {
  function validateMedia(draft) {
    const issues = []
    const images = draft.blocks.filter(block => block.kind === 'image')
    const videos = draft.blocks.filter(block => block.kind === 'video')
    if (images.length > MAX_IMAGES) {
      issues.push({ severity: 'error', message: `图片数量超限：${images.length}/${MAX_IMAGES}`, path: 'blocks' })
    }
    images.forEach((block, index) => {
      if (block.width < MIN_EDGE_PX || block.height < MIN_EDGE_PX) {
        issues.push({ severity: 'error', message: `第 ${index + 1} 张图片尺寸过小（${block.width}x${block.height}）`, path: `blocks.${index}` })
      }
    })
    videos.forEach((block, index) => {
      if (block.durationSec > MAX_VIDEO_DURATION_SEC) {
        issues.push({ severity: 'error', message: `视频时长超限：${block.durationSec}s/${MAX_VIDEO_DURATION_SEC}s`, path: `blocks.${index}` })
      }
    })
    return issues
  }

  return {
    hooks: {
      validateDraft: draft => validateMedia(draft),
      beforePublish: async (draft) => {
        const errors = validateMedia(draft).filter(issue => issue.severity === 'error')
        if (errors.length > 0) {
          throw new Error(`媒体规格校验未通过：${errors.map(issue => issue.message).join('；')}`)
        }
      },
    },
  }
}
